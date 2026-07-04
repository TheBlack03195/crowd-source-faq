import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;
let connectingPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
  }

  mongoose.set('strictQuery', true);

  connectingPromise = mongoose
    .connect(uri, {
      maxPoolSize: 10,
    })
    .then((conn) => {
      cachedConnection = conn;
      connectingPromise = null;
      console.log(`[db] MongoDB connected → ${conn.connection.name}`);
      return conn;
    })
    .catch((err) => {
      connectingPromise = null;
      console.error('[db] MongoDB connection error:', err.message);
      throw err;
    });

  return connectingPromise;
}

export function getConnectionState(): string {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
}
