import type { Organization, Project } from '@/lib/prisma';

// https://hono.dev/docs/api/context#contextvariablemap
declare module 'hono' {
  interface ContextVariableMap {
    organization: Organization;
    project: Project;
  }
}
