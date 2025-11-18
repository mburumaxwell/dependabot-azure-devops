import { auth, toNextJsHandler } from '@/lib/auth';

export const { POST, GET } = toNextJsHandler(auth);
