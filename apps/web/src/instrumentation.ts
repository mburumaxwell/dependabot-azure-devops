import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import type { OTLPExporterNodeConfigBase } from '@opentelemetry/otlp-exporter-base';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import type { BufferConfig } from '@opentelemetry/sdk-trace-base';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { environment } from '@paklo/core/environment';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { type Configuration, registerOTel } from '@vercel/otel';

export async function register() {
  let traceExporter: Configuration['traceExporter'];
  const instrumentations: Configuration['instrumentations'] = [
    new PrismaInstrumentation(),
    new MongoDBInstrumentation(),
    new PinoInstrumentation(),
  ];
  const spanProcessors: Configuration['spanProcessors'] = [];
  const logRecordProcessors: Configuration['logRecordProcessors'] = [];
  const metricReaders: Configuration['metricReaders'] = [];

  if (process.env.NEXT_RUNTIME !== 'edge') {
    const isVercelDeployment = Boolean(process.env.VERCEL_DEPLOYMENT_ID);
    if (environment.production && !isVercelDeployment) {
      const { AzureMonitorTraceExporter } = await import('@azure/monitor-opentelemetry-exporter');
      traceExporter = new AzureMonitorTraceExporter({
        connectionString: process.env.NEXT_PUBLIC_APP_INSIGHTS_CONNECTION_STRING,
      });
    }
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
    const [spanExporter, logRecordExporter, metricExporter] = [
      new OTLPTraceExporter(makeOptions('traces')),
      new OTLPLogExporter(makeOptions('logs')),
      new OTLPMetricExporter(makeOptions('metrics')),
    ];

    const bufferConfig: BufferConfig = { maxExportBatchSize: 5, maxQueueSize: 100 };
    spanProcessors.push(new BatchSpanProcessor(spanExporter, bufferConfig));
    logRecordProcessors.push(new BatchLogRecordProcessor(logRecordExporter, bufferConfig));
    metricReaders.push(new PeriodicExportingMetricReader({ exporter: metricExporter }));
  }

  registerOTel({
    serviceName: 'paklo',
    traceExporter,
    instrumentations,
    spanProcessors,
    logRecordProcessors,
    metricReaders,
  });
}
