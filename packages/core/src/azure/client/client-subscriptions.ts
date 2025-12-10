import { BaseAzureDevOpsClient } from './client-base';
import type { AzdoSubscription, AzdoSubscriptionsQuery, AzdoSubscriptionsQueryResponse } from './types';

export class HookSubscriptionsClient extends BaseAzureDevOpsClient {
  public async query(query: AzdoSubscriptionsQuery): Promise<AzdoSubscription[]> {
    const response = await this.client
      .post<AzdoSubscriptionsQueryResponse>(this.makeUrl('_apis/hooks/subscriptionsquery'), { json: query })
      .json();
    return response?.results;
  }

  public async create(subscription: Partial<AzdoSubscription>): Promise<AzdoSubscription> {
    const response = await this.client
      .post<AzdoSubscription>(this.makeUrl('_apis/hooks/subscriptions'), { json: subscription })
      .json();
    return response;
  }

  public async replace(subscriptionId: string, subscription: AzdoSubscription): Promise<AzdoSubscription> {
    const response = await this.client
      .put<AzdoSubscription>(this.makeUrl(`_apis/hooks/subscriptions/${subscriptionId}`), { json: subscription })
      .json();
    return response;
  }

  public async delete(subscriptionId: string): Promise<void> {
    await this.client.delete(this.makeUrl(`_apis/hooks/subscriptions/${subscriptionId}`)).json();
  }
}
