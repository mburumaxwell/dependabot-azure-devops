import { environment } from '@paklo/core/environment';
import type { ReactNode } from 'react';
import { ApplicationInsightsProvider } from './app-insights';
import { ThemeProvider } from './theme';
import { TooltipProvider } from './ui/tooltip';

interface ProviderProps {
  children: ReactNode;
}

export function Provider({ children }: ProviderProps) {
  const connectionString = environment.production ? process.env.NEXT_PUBLIC_APP_INSIGHTS_CONNECTION_STRING : undefined;
  return (
    <ApplicationInsightsProvider connectionString={connectionString}>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </ApplicationInsightsProvider>
  );
}
