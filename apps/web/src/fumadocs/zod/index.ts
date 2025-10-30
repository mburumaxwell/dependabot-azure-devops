import { z } from 'zod/v4';
import { git } from './git';
import { image } from './image';
import { readtime } from './read-time';

const mod = {
  ...z,
  readtime,
  image,
  git,
};

export type * from './types';
export { mod as z };
