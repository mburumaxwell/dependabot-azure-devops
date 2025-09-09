'use client';

import type { ReactNode } from 'react';

import { ApplicationInsightsProvider } from './app-insights';
import { TooltipProvider } from './ui/tooltip';

export function Provider({ children }: { children: ReactNode }) {
  return (
    <ApplicationInsightsProvider connectionString={process.env.NEXT_PUBLIC_APP_INSIGHTS_CONNECTION_STRING}>
      <TooltipProvider>{children}</TooltipProvider>
    </ApplicationInsightsProvider>
  );
}
