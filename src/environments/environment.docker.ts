import { Environment } from './environment.interface';
import { environmentBase } from './environment.base';
import { dockerLocalOverrides } from './environment.docker.local';

/**
 * Docker container environment configuration.
 * Used when building the Angular app for deployment in a Docker container.
 */
export const environment: Environment = {
  ...environmentBase,
  ...dockerLocalOverrides,
  production: true,
};
