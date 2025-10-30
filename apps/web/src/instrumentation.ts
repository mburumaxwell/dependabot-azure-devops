import type { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { environment } from '@paklo/core/environment';
import { registerOTel } from '@vercel/otel';

export async function register() {
  let traceExporter: SpanExporter | undefined;

  if (process.env.NEXT_RUNTIME !== 'edge') {
    const isVercelDeployment = Boolean(process.env.VERCEL_DEPLOYMENT_ID);
    if (environment.production && !isVercelDeployment) {
      const { AzureMonitorTraceExporter } = await import('@azure/monitor-opentelemetry-exporter');
      traceExporter = new AzureMonitorTraceExporter({
        connectionString: process.env.NEXT_PUBLIC_APP_INSIGHTS_CONNECTION_STRING,
      });
    }
  }

  registerOTel({ serviceName: 'paklo', traceExporter });
}
