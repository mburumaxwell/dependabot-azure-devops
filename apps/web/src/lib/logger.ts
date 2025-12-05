// this file exists in its simplicity to allow us to
// (re)create a logger just for the web app

import { create } from '@paklo/core/logger';

export const logger = create({ timestamp: true, pretty: { includeLevel: true } });
