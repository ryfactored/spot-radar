import { Environment } from './environment.interface';
import { environmentBase } from './environment.base';
import { localOverrides } from './environment.local';

export const environment: Environment = {
  ...environmentBase,
  ...localOverrides,
};
