import pino from 'pino';
import pretty from 'pino-pretty';

import { environment } from '@/environment';

const stream = pretty({ colorize: true, ignore: 'pid,hostname' });

export const logger = pino({
  level: process.env.LOG_LEVEL || (environment.production ? 'warn' : 'debug'),
}, stream);
