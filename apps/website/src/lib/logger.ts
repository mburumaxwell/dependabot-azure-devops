import { create } from 'paklo/logger';
import app from '../../package.json';

export const logger = create({ name: app.name });
