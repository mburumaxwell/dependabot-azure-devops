import type { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { environment } from '@paklo/cli/environment';
import { registerOTel } from '@vercel/otel';

export async function register() {
  let traceExporter: SpanExporter | undefined;

  if (environment.production) {
    const isVercelDeployment = Boolean(process.env.VERCEL_DEPLOYMENT_ID);
    if (!isVercelDeployment && process.env.NEXT_RUNTIME === 'nodejs') {
      const { AzureMonitorTraceExporter } = await import('@azure/monitor-opentelemetry-exporter');
      traceExporter = new AzureMonitorTraceExporter({
        connectionString: process.env.NEXT_PUBLIC_APP_INSIGHTS_CONNECTION_STRING,
      });
    }
  }

  registerOTel({ serviceName: 'paklo-dashboard', traceExporter });
}
