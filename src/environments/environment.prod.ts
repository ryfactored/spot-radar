import { Environment } from './environment.interface';
import { environmentBase } from './environment.base';

export const environment: Environment = {
  ...environmentBase,
  production: true,
  socialProviders: ['google'],
  siteUrl: 'https://your-domain.vercel.app',
  toastDuration: { success: 3000, info: 4000, error: 5000 },
};
