import { create } from '@paklo/cli/logger';
import app from '../../package.json';

export const logger = create({ name: app.name });
