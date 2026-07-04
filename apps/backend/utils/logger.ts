type LogMeta = Record<string, unknown>;

function ts() {
  return new Date().toISOString();
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(`[${ts()}] INFO  ${message}`, meta ?? '');
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(`[${ts()}] WARN  ${message}`, meta ?? '');
  },
  error(message: string, meta?: LogMeta) {
    console.error(`[${ts()}] ERROR ${message}`, meta ?? '');
  },
};
