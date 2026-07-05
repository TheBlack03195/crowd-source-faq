import { ZoomMeeting } from '../models/ZoomMeeting.js';
import { zoomApiCircuit } from './circuitBreaker.js';

export interface ZoomHealth {
  circuitState: 'closed' | 'open' | 'half-open';
  failingMeetings: number;
  deadLetterCount: number;
  pendingRetryCount: number;
}


export async function getZoomHealth(): Promise<ZoomHealth> {
  const [failingMeetings, deadLetterCount, pendingRetryCount] = await Promise.all([
    ZoomMeeting.countDocuments({ status: 'failed', deadLettered: false }),
    ZoomMeeting.countDocuments({ deadLettered: true }),
    ZoomMeeting.countDocuments({ status: 'failed', deadLettered: false, retryCount: { $gt: 0 } }),
  ]);

  return {
    circuitState: zoomApiCircuit.getState(),
    failingMeetings,
    deadLetterCount,
    pendingRetryCount,
  };
}
