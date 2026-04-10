/**
 * Structured logging utility for production observability.
 * Includes support for correlation IDs to trace requests across the system.
 */

const getCorrelationId = () => {
  let cid = sessionStorage.getItem('x-correlation-id');
  if (!cid) {
    cid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('x-correlation-id', cid);
  }
  return cid;
};

const formatLog = (level, event, data = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    correlation_id: getCorrelationId(),
    ...data,
  };
  return JSON.stringify(logEntry);
};

export const logger = {
  info: (event, data) => {
    console.info(formatLog('INFO', event, data));
  },
  warn: (event, data) => {
    console.warn(formatLog('WARN', event, data));
  },
  error: (event, data) => {
    console.error(formatLog('ERROR', event, data));
    // Here you would also push to a monitoring service like Sentry
  },
  debug: (event, data) => {
    if (import.meta.env.DEV) {
      console.debug(formatLog('DEBUG', event, data));
    }
  }
};
