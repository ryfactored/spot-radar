import { Environment } from './environment.interface';
import { environmentBase } from './environment.base';
import { localOverrides } from './environment.local';

export const environment: Environment = {
  ...environmentBase,
  ...localOverrides,
  production: true,
  siteUrl: 'https://radar.ryfactored.com',
  socialProviders: ['spotify'],
  toastDuration: { success: 3000, info: 4000, error: 5000 },
  // Keep the internal component playground and unused template features out of
  // the production build.
  featureFlags: {
    ...environmentBase.featureFlags,
    components: false,
    notes: false,
    chat: false,
    files: false,
  },
};
