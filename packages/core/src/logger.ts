import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({ colorize: true, ignore: 'pid,hostname' });

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
  },
  stream,
);
