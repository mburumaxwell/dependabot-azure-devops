import { type ZodType } from 'zod/v4';

import { environment } from '@/environment';

import {
  HEADER_NAME_ACCEPT,
  HEADER_NAME_AUTHORIZATION,
  HEADER_NAME_CONTENT_TYPE,
  HEADER_NAME_USER_AGENT,
} from './headers';
import { MultipartFormDataBody } from './multipart';
import { type ProblemDetails } from './problem';

const defaultUserAgent = `paklo/${environment.sha?.substring(0, 7) ?? 'dogfood'}`;

export type CreateInnerApiClientOptions = {
  /**
   * The base URL to use for the API.
   * @example 'https://api.paklo.software'
   */
  baseUrl: string;

  /** The token to use for authentication. This can be a JWT or specialized key. */
  token?: string;
};

export type RequestOptions = {
  /**
   * Value for the `User-Agent` header.
   * This prepends the default value (e.g. `paklo/ab26320`)
   * which is important when we need to propagate the browser information to the server.
   */
  userAgent?: string;
};

export type ResourceResponse<T = Record<string, unknown>> = {
  /** The headers of the response. */
  headers: Headers;

  /** Whether the request was successful. */
  successful: boolean;

  /** The status code of the response. */
  status: number;

  /** The status text of the response. */
  statusText: string;

  /** The data of the response. */
  data?: T;

  /** The error of the response. */
  error?: ProblemDetails;
};

export type InnerRequestOptions<T> = RequestOptions & {
  /**
   * The base URL to use for the request.
   * This overrides the default base URL.
   * @example 'https://api.paklo.software'
   */
  baseUrl?: string;

  /** Additional headers to use for the request. */
  headers?: HeadersInit;

  /** The payload to use for the request. */
  payload?: Record<string, unknown> | MultipartFormDataBody | ReadableStream | XMLHttpRequestBodyInit;

  /** The schema to use when parsing the response. */
  schema?: ZodType<T>;
};

type InnerRequestOptionsComplete<T> = InnerRequestOptions<T> & {
  /** The method to use for the request. */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /** The URL to use for the request. */
  url: string;
};

export class InnerApiClient {
  private readonly baseUrl: string;
  private readonly headers: Headers;
  private readonly token?: string;

  /**
   * Create a new API client.
   * @param options The options to use for the client.
   */
  constructor({ baseUrl, token }: CreateInnerApiClientOptions) {
    this.baseUrl = baseUrl;

    this.headers = new Headers({
      [HEADER_NAME_ACCEPT]: 'application/json',
    });

    this.token = token;
  }

  async get<T>(url: string, options?: InnerRequestOptions<T>) {
    return this.request<T>({
      url: this.makeUrl(url, options),
      method: 'GET',
      ...options,
    });
  }

  async post<T>(url: string, options?: InnerRequestOptions<T>) {
    return this.request<T>({
      method: 'POST',
      url: this.makeUrl(url, options),
      ...options,
    });
  }

  async put<T>(url: string, options?: InnerRequestOptions<T>) {
    return this.request<T>({
      method: 'PUT',
      url: this.makeUrl(url, options),
      ...options,
    });
  }

  async patch<T>(url: string, options?: InnerRequestOptions<T>) {
    return this.request<T>({
      method: 'PATCH',
      url: this.makeUrl(url, options),
      ...options,
    });
  }

  async delete<T>(url: string, options?: InnerRequestOptions<T>) {
    return this.request<T>({
      method: 'DELETE',
      url: this.makeUrl(url, options),
      ...options,
    });
  }

  async request<T>(options: InnerRequestOptionsComplete<T>): Promise<ResourceResponse<T>> {
    const { method, url, payload, userAgent, headers: additionalHeaders, schema } = options;

    // create headers for the request
    const headers = new Headers(this.headers);
    const finalUserAgent = userAgent && userAgent.length > 0 ? `${userAgent} (${defaultUserAgent})` : defaultUserAgent;
    headers.set(HEADER_NAME_USER_AGENT, finalUserAgent);

    // populate authorization header
    if (this.token) {
      headers.set(HEADER_NAME_AUTHORIZATION, `Bearer ${this.token}`);
    }

    // populate additional headers
    if (additionalHeaders) {
      if (additionalHeaders instanceof Headers) {
        additionalHeaders.forEach((value, key) => headers.set(key, value as string));
      } else if (Array.isArray(additionalHeaders)) {
        additionalHeaders.forEach(([key, value]) => headers.set(key, value));
      } else {
        Object.entries(additionalHeaders).forEach(([key, value]) => headers.set(key, value as string));
      }
    }

    // prepare body
    let body: BodyInit | undefined = undefined;
    if (skipSerialization(payload)) body = payload;
    else if (payload instanceof MultipartFormDataBody) {
      body = new Uint8Array(await payload.encode());
      headers.set(HEADER_NAME_CONTENT_TYPE, payload.getContentType());
    } else {
      body = JSON.stringify(payload);
      headers.set(HEADER_NAME_CONTENT_TYPE, 'application/json');
    }

    // make request
    try {
      const response = await fetch(url, { method, headers, body });
      const { ok: successful, status, statusText } = response;

      if (!successful) {
        try {
          const rawError = await response.text();
          return { headers: response.headers, successful, status, statusText, error: JSON.parse(rawError) };
        } catch (err) {
          if (err instanceof SyntaxError) {
            return {
              headers: response.headers,
              successful,
              status,
              statusText,
              error: {
                title: 'Unknown error',
                status,
                statusText: response.statusText,
              },
            };
          }

          const error: ProblemDetails = {
            title: (err instanceof Error ? err.message : undefined) ?? 'Unknown error',
            status: response.status,
            statusText: response.statusText,
          };

          return { headers: response.headers, successful, status, statusText, error };
        }
      }

      let data = response.body ? ((await response.json()) as T) : undefined;
      if (data && schema) {
        const result = await schema.safeParseAsync(data);
        if (!result.success) {
          return {
            headers: response.headers,
            successful: false,
            status,
            statusText,
            data,
            error: {
              title: 'application_error',
              detail: 'Schema validation error',
              errors: result.error.flatten().fieldErrors,
              status: response.status,
              statusText: response.statusText,
            },
          };
        }
        data = result.data;
      }

      return { headers: response.headers, data, successful, status, statusText };
    } catch (err) {
      return {
        headers: new Headers(),
        successful: false,
        status: -1,
        statusText: 'Application Error',
        error: {
          title: 'application_error',
          detail: `Unable to fetch data. The request could not be resolved. ${err}`,
        },
      };
    }
  }

  private makeUrl<T>(url: string, options?: InnerRequestOptions<T>): string {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = options?.baseUrl ?? this.baseUrl;
    return `${baseUrl}${url}`;
  }
}

/**
 * Whether to skip serialization of the payload.
 * @param payload The payload to check.
 * @returns true if the payload should not be serialized; otherwise, false.
 */
function skipSerialization(
  payload: InnerRequestOptions<never>['payload'],
): payload is FormData | URLSearchParams | ReadableStream | Blob | ArrayBuffer | string | undefined {
  return (
    payload instanceof FormData ||
    payload instanceof URLSearchParams ||
    payload instanceof ReadableStream ||
    payload instanceof Blob ||
    payload instanceof ArrayBuffer ||
    payload instanceof Buffer ||
    typeof payload === 'string' ||
    !payload
  );
}

/** Http request error */
export class HttpRequestError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
  }
}

export function isErrorTemporaryFailure(e?: { code?: string | number; message?: string } | null): boolean {
  if (e instanceof HttpRequestError) {
    // Check for common HTTP status codes that indicate a temporary failure
    // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    switch (e.code) {
      case 502:
        return true; // 502 Bad Gateway
      case 503:
        return true; // 503 Service Unavailable
      case 504:
        return true; // 504 Gateway Timeout
      default:
        return false;
    }
  } else if (e?.code) {
    // Check for Node.js system errors that indicate a temporary failure
    // See: https://nodejs.org/api/errors.html#errors_common_system_errors
    switch (e.code) {
      case 'ETIMEDOUT':
        return true; // Operation timed out
      default:
        return false;
    }
  } else {
    return false;
  }
}
