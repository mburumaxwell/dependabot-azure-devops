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
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import type { OTLPExporterNodeConfigBase } from '@opentelemetry/otlp-exporter-base';
import { BatchLogRecordProcessor, type LogRecordExporter } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader, type PushMetricExporter } from '@opentelemetry/sdk-metrics';
import type { BufferConfig, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { type Configuration, registerOTel } from '@vercel/otel';
import { credential } from '@/lib/azure';
import { environment } from '@/lib/environment';

export async function register() {
  const instrumentations: Configuration['instrumentations'] = [
    new PrismaInstrumentation(),
    new MongoDBInstrumentation(),
    new PgInstrumentation(),
    new PinoInstrumentation(),
  ];
  const spanProcessors: Configuration['spanProcessors'] = [];
  const logRecordProcessors: Configuration['logRecordProcessors'] = [];
  const metricReaders: Configuration['metricReaders'] = [];
  const providers: ProviderExporters[] = [];

  // export to azure monitor if configured
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (connectionString) {
    const exporterOptions: AzureMonitorExporterOptions = { connectionString, credential };

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
          'X-Axiom-Dataset': environment.name || 'development',
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
