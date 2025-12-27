import dotenvFlow from 'dotenv-flow';

dotenvFlow.config();

async function run() {
  const { prisma } = await import('@/lib/prisma');
  const { stripe, METER_EVENT_NAME_USAGE } = await import('@/lib/billing');

  const jobs = await prisma.updateJob.findMany({
    where: { NOT: { status: { in: ['running', 'scheduled'] } } },
  });
  const organizationIds = jobs.map((job) => job.organizationId);
  const organizations = await prisma.organization.findMany({
    where: { id: { in: organizationIds } },
  });
  const organizationMap = new Map(organizations.map((org) => [org.id, org]));

  for (const job of jobs) {
    const organization = organizationMap.get(job.organizationId)!;
    const durationMinutes = (job.duration! / 60_000).toFixed(0);

    try {
      await stripe.billing.meterEvents.create({
        event_name: METER_EVENT_NAME_USAGE,
        payload: {
          stripe_customer_id: organization.customerId!,
          minutes: durationMinutes,
        },
        identifier: job.id,
      });
      console.log('Reported');
    } catch (error) {
      if (error instanceof stripe.errors.StripeInvalidRequestError) {
        console.log('Skipped');
      }
    }
  }
}

run();
