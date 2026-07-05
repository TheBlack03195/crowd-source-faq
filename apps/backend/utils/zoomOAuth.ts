import type { IUser } from '../models/User.js';
import { User } from '../models/User.js';
import { encrypt, decrypt } from './crypto.js';
import { zoomApiCircuit } from './circuitBreaker.js';
import { logger } from './logger.js';

const ZOOM_AUTHORIZE_URL = 'https://zoom.us/oauth/authorize';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';

interface ZoomTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — required for Zoom OAuth.`);
  return value;
}

export function getAuthorizeUrl(state: string): string {
  const clientId = requireEnv('ZOOM_CLIENT_ID');
  const redirectUri = process.env.ZOOM_REDIRECT_URI || 'http://localhost:6767/api/zoom/callback';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `${ZOOM_AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeToken(body: URLSearchParams): Promise<ZoomTokenResponse> {
  return zoomApiCircuit.execute(async () => {
    const clientId = requireEnv('ZOOM_CLIENT_ID');
    const clientSecret = requireEnv('ZOOM_CLIENT_SECRET');
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(ZOOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Zoom token exchange failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<ZoomTokenResponse>;
  });
}

export async function exchangeCodeForToken(code: string, userId: string): Promise<void> {
  const redirectUri = process.env.ZOOM_REDIRECT_URI || 'http://localhost:6767/api/zoom/callback';
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const tokens = await exchangeToken(body);
  await saveTokensForUser(userId, tokens);
}

async function refreshAccessToken(user: IUser): Promise<ZoomTokenResponse> {
  if (!user.zoomRefreshTokenEnc) {
    throw new Error('User has no Zoom refresh token on file — they need to reconnect.');
  }
  const refreshToken = decrypt(user.zoomRefreshTokenEnc);

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const tokens = await exchangeToken(body);
  await saveTokensForUser(user._id.toString(), tokens);
  return tokens;
}

async function saveTokensForUser(userId: string, tokens: ZoomTokenResponse): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    zoomAccessTokenEnc: encrypt(tokens.access_token),
    zoomRefreshTokenEnc: encrypt(tokens.refresh_token),
    zoomTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  });
}


export async function getValidAccessToken(userId: string): Promise<string> {
  const user = await User.findById(userId).select('+zoomAccessTokenEnc +zoomRefreshTokenEnc');
  if (!user || !user.zoomAccessTokenEnc) {
    throw new Error('User has not connected a Zoom account.');
  }

  const expiresAt = user.zoomTokenExpiresAt?.getTime() ?? 0;
  if (Date.now() < expiresAt - 60_000) {
    return decrypt(user.zoomAccessTokenEnc);
  }

  logger.info('Zoom access token expired, refreshing', { userId });
  const refreshed = await refreshAccessToken(user);
  return refreshed.access_token;
}

export async function isZoomConnected(userId: string): Promise<boolean> {
  const user = await User.findById(userId).select('+zoomAccessTokenEnc');
  return Boolean(user?.zoomAccessTokenEnc);
}
