import { create } from '@paklo/core/logger';
import app from '../../package.json';

export const logger = create({ name: app.name });
