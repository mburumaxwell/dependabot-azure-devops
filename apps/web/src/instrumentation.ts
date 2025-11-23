import {
  type AzureMonitorExporterOptions,
  AzureMonitorLogExporter,
  AzureMonitorMetricExporter,
  AzureMonitorTraceExporter,
} from '@azure/monitor-opentelemetry-exporter';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import type { OTLPExporterNodeConfigBase } from '@opentelemetry/otlp-exporter-base';
import { BatchLogRecordProcessor, type LogRecordExporter } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader, type PushMetricExporter } from '@opentelemetry/sdk-metrics';
import type { BufferConfig, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { environment } from '@paklo/core/environment';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { type Configuration, registerOTel } from '@vercel/otel';

export async function register() {
  const instrumentations: Configuration['instrumentations'] = [
    new PrismaInstrumentation(),
    new MongoDBInstrumentation(),
    new PinoInstrumentation(),
  ];
  const spanProcessors: Configuration['spanProcessors'] = [];
  const logRecordProcessors: Configuration['logRecordProcessors'] = [];
  const metricReaders: Configuration['metricReaders'] = [];
  const providers: ProviderExporters[] = [];

  const edge = process.env.NEXT_RUNTIME === 'edge';
  const vercel = Boolean(process.env.VERCEL_DEPLOYMENT_ID);
  if (!edge && environment.production && !vercel) {
    const connectionString = process.env.NEXT_PUBLIC_APP_INSIGHTS_CONNECTION_STRING;
    const exporterOptions: AzureMonitorExporterOptions = { connectionString };

    providers.push({
      spanExporter: new AzureMonitorTraceExporter(exporterOptions),
      logRecordExporter: new AzureMonitorLogExporter(exporterOptions),
      metricExporter: new AzureMonitorMetricExporter(exporterOptions),
    });
  }

  // export to axiom if configured
  const axiomApiKey = process.env.AXIOM_API_KEY;
  if (axiomApiKey) {
    function makeOptions(category: string) {
      return {
        url: `https://api.axiom.co/v1/${category}`,
        headers: {
          Authorization: `Bearer ${axiomApiKey}`,
          'X-Axiom-Dataset': category,
        },
      } satisfies OTLPExporterNodeConfigBase;
    }

    providers.push({
      bufferConfig: { maxExportBatchSize: 5, maxQueueSize: 100 },
      spanExporter: new OTLPTraceExporter(makeOptions('traces')),
      logRecordExporter: new OTLPLogExporter(makeOptions('logs')),
      metricExporter: new OTLPMetricExporter(makeOptions('metrics')),
    });
  }

  for (const { bufferConfig, spanExporter, logRecordExporter, metricExporter } of providers) {
    if (spanExporter) {
      spanProcessors.push(new BatchSpanProcessor(spanExporter, bufferConfig));
    }
    if (logRecordExporter) {
      logRecordProcessors.push(new BatchLogRecordProcessor(logRecordExporter, bufferConfig));
    }
    if (metricExporter) {
      metricReaders.push(new PeriodicExportingMetricReader({ exporter: metricExporter }));
    }
  }

  registerOTel({
    serviceName: 'paklo',
    instrumentations,
    spanProcessors,
    logRecordProcessors,
    metricReaders,
  });
}

type ProviderExporters = {
  /** The buffer configuration for the batching exporters. */
  bufferConfig?: BufferConfig;

  /** The span (traces) exporter, if the provider supports. */
  spanExporter?: SpanExporter;

  /** The log exporter, if the provider supports. */
  logRecordExporter?: LogRecordExporter;

  /** The metric exporter, if the provider supports. */
  metricExporter?: PushMetricExporter;
};
