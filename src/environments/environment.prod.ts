import { Environment } from './environment.interface';
import { environmentBase } from './environment.base';
import { localOverrides } from './environment.local';

export const environment: Environment = {
  ...environmentBase,
  ...localOverrides,
  production: true,
  socialProviders: ['google'],
  toastDuration: { success: 3000, info: 4000, error: 5000 },
};
