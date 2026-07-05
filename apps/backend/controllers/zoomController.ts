import type { Request, Response } from 'express';
import crypto from 'crypto';
import { ZoomMeeting } from '../models/ZoomMeeting.js';
import { User } from '../models/User.js';
import { getAuthorizeUrl, exchangeCodeForToken, isZoomConnected, getValidAccessToken } from '../utils/zoomOAuth.js';
import { zoomApiCircuit, CircuitOpenError } from '../utils/circuitBreaker.js';
import { parseVTT } from '../utils/vttParser.js';
import { processZoomMeetingForKnowledge } from '../services/knowledgeBase.js';
import { logger } from '../utils/logger.js';


export async function zoomAuthorize(req: Request, res: Response) {
  try {
    const url = getAuthorizeUrl(req.user!._id.toString());
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}


export async function zoomCallback(req: Request, res: Response) {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state in Zoom OAuth callback' });
  }

  try {
    await exchangeCodeForToken(code, state);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/account?zoom=connected`);
  } catch (err) {
    logger.error('Zoom OAuth callback failed', { message: (err as Error).message });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/account?zoom=error`);
  }
}


export async function zoomWebhook(req: Request, res: Response) {
  const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  const { event, payload } = req.body as { event?: string; payload?: any };


  if (event === 'endpoint.url_validation') {
    if (!secretToken) {
      return res.status(500).json({ error: 'ZOOM_WEBHOOK_SECRET_TOKEN not set — cannot complete validation' });
    }
    const hashForValidate = crypto
      .createHmac('sha256', secretToken)
      .update(payload.plainToken)
      .digest('hex');
    return res.json({ plainToken: payload.plainToken, encryptedToken: hashForValidate });
  }

 
  if (secretToken) {
    const timestamp = req.headers['x-zm-request-timestamp'];
    const signature = req.headers['x-zm-signature'];
    const message = `v0:${timestamp}:${JSON.stringify(req.body)}`;
    const hash = crypto.createHmac('sha256', secretToken).update(message).digest('hex');
    const expectedSignature = `v0=${hash}`;

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  }

  if (event !== 'recording.transcript_completed') {
    return res.status(200).json({ ignored: true });
  }


  res.status(200).json({ received: true });

  try {
    const meetingObj = payload?.object;
    const zoomHostId = meetingObj?.host_id;
    const transcriptFile = meetingObj?.recording_files?.find((f: any) => f.file_type === 'TRANSCRIPT');

    if (!zoomHostId || !transcriptFile?.download_url) {
      logger.warn('Zoom webhook missing host or transcript download URL', { event });
      return;
    }

    
    const hostUser = await User.findOne({ zoomUserId: zoomHostId });
    if (!hostUser) {
      logger.warn('Zoom webhook: no local user has connected this Zoom host account', { zoomHostId });
      return;
    }

    const meeting = await ZoomMeeting.create({
      userId: hostUser._id,
      zoomMeetingId: meetingObj.id,
      topic: meetingObj.topic || 'Untitled meeting',
      sourcing: 'webhook',
      status: 'pending',
    });

    const accessToken = await getValidAccessToken(hostUser._id.toString());
    const transcriptText = await zoomApiCircuit.execute(async () => {
      const resp = await fetch(`${transcriptFile.download_url}?access_token=${accessToken}`);
      if (!resp.ok) throw new Error(`Transcript download failed: ${resp.status}`);
      return resp.text();
    });

    await processZoomMeetingForKnowledge(meeting, parseVTT(transcriptText));
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      logger.warn('Zoom API circuit open — skipping this webhook, will need manual retry', {});
      return;
    }
    logger.error('Zoom webhook processing failed', { message: (err as Error).message });
  }
}


export async function zoomManualUpload(req: Request, res: Response) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded (field name: "transcript")' });

  const { topic, batchId } = req.body as { topic?: string; batchId?: string };
  const raw = file.buffer.toString('utf-8');
  const isVtt = file.originalname.endsWith('.vtt') || raw.trim().startsWith('WEBVTT');
  const transcriptText = isVtt ? parseVTT(raw) : raw;

  const meeting = await ZoomMeeting.create({
    userId: req.user!._id,
    zoomMeetingId: `manual-${Date.now()}`,
    topic: topic || file.originalname,
    sourcing: isVtt ? 'manual_vtt' : 'manual_txt',
    status: 'pending',
    batchId: batchId || null,
  });

  try {
    const result = await processZoomMeetingForKnowledge(meeting, transcriptText);
    res.status(201).json({ meeting, extracted: result.extracted });
  } catch (err) {
    res.status(500).json({ error: 'Processing failed', meeting, message: (err as Error).message });
  }
}


export async function zoomStatus(req: Request, res: Response) {
  const connected = await isZoomConnected(req.user!._id.toString());
  const lastMeeting = await ZoomMeeting.findOne({ userId: req.user!._id }).sort({ createdAt: -1 });
  res.json({ connected, lastMeeting });
}