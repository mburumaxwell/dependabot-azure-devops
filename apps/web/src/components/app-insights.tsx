'use client';

import { AppInsightsContext, ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ApplicationInsights, type ITelemetryItem } from '@microsoft/applicationinsights-web';
import { type ReactNode, useEffect, useState } from 'react';

export type ApplicationInsightsProviderProps = {
  connectionString?: string;
  disabled?: boolean;
  initializers?: ((item: ITelemetryItem) => boolean)[];
  children: ReactNode;
};

/**
 * This Component provides telemetry with Azure App Insights
 *
 * NOTE: the package '@microsoft/applicationinsights-react-js' has a HOC withAITracking that requires this to be a Class Component rather than a Functional Component
 */
export function ApplicationInsightsProvider({
  children,
  connectionString,
  disabled = false,
  initializers,
}: ApplicationInsightsProviderProps) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && connectionString && !disabled) {
      initialize(connectionString, initializers);

      setInitialized(true);
    }
  }, [initialized, connectionString, disabled, initializers]);

  return <AppInsightsContext.Provider value={reactPlugin}>{children}</AppInsightsContext.Provider>;
}

let reactPlugin: ReactPlugin;
let appInsights: ApplicationInsights | null = null;

function initialize(connectionString?: string, initializers?: ((item: ITelemetryItem) => boolean)[]) {
  if (!connectionString) {
    throw new Error('[AppInsightsService] connectionString is not provided');
  }

  reactPlugin = new ReactPlugin();

  appInsights = new ApplicationInsights({
    config: {
      connectionString: connectionString,

      maxBatchInterval: 0,

      disableFetchTracking: false,
      disableAjaxTracking: false,

      // enable this since history object may not be available and also
      // for react router 6
      enableAutoRouteTracking: true,

      extensions: [reactPlugin],
    },
  });

  appInsights.loadAppInsights();

  if (initializers && initializers.length > 0) {
    for (const telemetryInitializer of initializers) {
      appInsights.addTelemetryInitializer(telemetryInitializer);
    }
  }
}
