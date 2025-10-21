export interface ProblemDetails {
  type?: string;

  /** The name/title of the error.*/
  title: string;

  /** A brief explanation/definition into the nature of the error. */
  detail?: string | null;

  /** Any additional error arguments passed to the client. */
  extras?: unknown;

  /** The HTTP status code */
  status?: number;
  statusText?: string;

  errors?: Record<string, string[] | undefined>;
  traceId?: string;
}
