import { environment } from '@paklo/core/environment';
import { Polar } from '@polar-sh/sdk';

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Remember that all objects are completely separated between environments.
  server: environment.production ? 'production' : 'sandbox',
});
