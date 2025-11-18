import type { Hono } from 'hono';
import { handle } from 'hono/vercel';

/**
 * Converts a Hono app instance to a Next.js API route handler
 *
 * This utility function takes a Hono application and creates a Next.js-compatible
 * handler that supports all HTTP methods. It uses Hono's Vercel adapter to handle
 * the conversion between Hono's request/response format and Next.js API routes.
 *
 * @param app - The Hono application instance to convert
 * @returns An object with HTTP method handlers (GET, POST, etc.) for Next.js API routes
 *
 * @example
 * ```typescript
 * const app = new Hono();
 * app.get('/api/hello', (c) => c.json({ message: 'Hello World' }));
 *
 * export const { GET, POST } = toNextJsHandler(app);
 * ```
 */
export function toNextJsHandler(app: Hono) {
  // Use Hono's Vercel adapter to create a handler compatible with Vercel/Next.js
  const handler = handle(app);

  // Return an object mapping all HTTP methods to the same handler
  // This allows the Hono app to handle any HTTP method routed to this API endpoint
  return {
    GET: handler,
    POST: handler,
    PATCH: handler,
    PUT: handler,
    DELETE: handler,
    OPTIONS: handler,
    HEAD: handler,
  };
}
