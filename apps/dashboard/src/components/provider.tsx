'use client';

import type { Environment } from '@paklo/cli/environment';
import type { ReactNode } from 'react';
import { ApplicationInsightsProvider } from './app-insights';
import { TooltipProvider } from './ui/tooltip';

interface ProviderProps {
  children: ReactNode;
  environment: Environment;
}

export function Provider({ children, environment }: ProviderProps) {
  const connectionString = environment.production ? process.env.NEXT_PUBLIC_APP_INSIGHTS_CONNECTION_STRING : undefined;
  return (
    <ApplicationInsightsProvider connectionString={connectionString}>
      <TooltipProvider>{children}</TooltipProvider>
    </ApplicationInsightsProvider>
  );
}
