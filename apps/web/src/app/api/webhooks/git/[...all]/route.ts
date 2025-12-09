import { toNextJsHandler } from '@paklo/core/hono';
import { Hono } from 'hono';
import { app as azure } from './azure';
import { app as bitbucket } from './bitbucket';
import { app as gitlab } from './gitlab';

export const dynamic = 'force-dynamic';

const app = new Hono().basePath('/api/webhooks/git');
app.route('/azure', azure);
app.route('/bitbucket', bitbucket);
app.route('/gitlab', gitlab);

export const { POST } = toNextJsHandler(app);
