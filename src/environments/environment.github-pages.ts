import { Environment } from './environment.interface';
import { environmentBase } from './environment.base';
import { localOverrides } from './environment.local';

export const environment: Environment = {
  ...environmentBase,
  ...localOverrides,
  production: true,
  siteUrl: 'https://ryfactored.github.io/spot-radar',
  socialProviders: ['spotify'],
  toastDuration: { success: 3000, info: 4000, error: 5000 },
};
