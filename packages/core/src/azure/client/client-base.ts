import type { KyInstance } from 'ky';
import { API_VERSION } from './constants';

export class BaseAzureDevOpsClient {
  constructor(protected readonly client: KyInstance) {}

  protected makeUrl(path: string): string;
  protected makeUrl(path: string, apiVersion: string): string;
  protected makeUrl(path: string, params: Record<string, unknown>): string;
  protected makeUrl(path: string, params: Record<string, unknown>, apiVersion: string): string;
  protected makeUrl(path: string, params?: Record<string, unknown> | string, apiVersion: string = API_VERSION): string {
    if (typeof params === 'string') {
      apiVersion = params;
      params = {};
    }

    const queryString = Object.entries({ 'api-version': apiVersion, ...params })
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${path}?${queryString}`;
  }
}
