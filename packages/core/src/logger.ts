import pino, { type DestinationStream, type Level } from 'pino';
import pretty from 'pino-pretty';

export type LoggerCreateOptions = {
  /**
   * Log level
   * Only set this if you must override the default log level logic from env variables
   */
  level?: Level;

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
        // these colors only apply to the log level which we may be hiding above
        // support for custom colors in the message itself is not yet supported
        // https://github.com/pinojs/pino-pretty/issues/430
        // https://github.com/pinojs/pino-pretty/issues/524
        // https://github.com/pinojs/pino-pretty/pull/611
        customColors: {
          trace: 'grey',
          debug: 'grey',
          info: 'white',
          warn: 'yellow',
          error: 'red',
          fatal: 'magenta',
        } satisfies Record<Level, string>,
      })
    : undefined;

  // create and return the logger
  const resolvedLevel = level || process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');
  return pino(
    { level: resolvedLevel, timestamp },
    pino.multistream([
      // add streams conditionally
      // without setting the level on each stream, some logs seem to be skipped
      ...(prettyStream ? [{ level: resolvedLevel, stream: prettyStream }] : []),
      ...streams.map((stream) => ({ level: resolvedLevel, stream })),
    ]),
  );
}

/** Default logger instance */
export const logger = create();
