import pino, { type DestinationStream } from 'pino';
import pretty from 'pino-pretty';

export type LoggerCreateOptions = {
  /**
   * Log level
   * Only set this if you must override the default log level logic from env variables
   */
  level?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

  /**
   * Whether to include time stamps in log entries
   * @default false
   */
  timestamp?: boolean;

  /** Options for pretty printing */
  pretty?: {
    /**
     * Whether to enable pretty printing
     * @default true
     */
    enable?: boolean;

    /**
     * Whether to colorize the pretty printed output
     * @default true
     */
    colorize?: boolean;

    /**
     * Whether to include the log level in pretty printed output
     * @default false
     */
    includeLevel?: boolean;
  };

  /**
   * Additional streams, if any, to write logs to.
   * This is in addition to any pretty printing stream configured.
   * Useful for adding things like OpenTelemetry streams.
   */
  streams?: DestinationStream[];
};

/**
 * Creates a new logger with the given options.
 * @param options - Logger creation options
 * @returns A logger instance
 */
export function create(options: LoggerCreateOptions = {}) {
  const {
    level,
    timestamp = false,
    pretty: {
      // options for pretty printing
      enable: prettyEnable = true,
      colorize: prettyColorize = true,
      includeLevel: prettyIncludeLevel = false,
    } = {},
    streams = [],
  } = options;

  // configure pretty printing stream, if enabled
  const prettyStream = prettyEnable
    ? pretty({
        colorize: prettyColorize,
        ignore: 'pid,hostname',
        customPrettifiers: prettyIncludeLevel ? undefined : { level: () => '' },
      })
    : undefined;

  // create and return the logger
  return pino(
    {
      level: level || process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
      timestamp,
    },
    pino.multistream([
      // add streams conditionally
      ...(prettyStream ? [prettyStream] : []),
      ...streams,
    ]),
  );
}

/** Default logger instance */
export const logger = create();
