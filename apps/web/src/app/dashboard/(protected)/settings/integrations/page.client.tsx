'use client';

import { CheckCircle2, Copy, Eye, EyeOff, Globe, Shield, ShieldCheck, Webhook } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  createWebhooks,
  getWebhooksToken,
  updateGithubToken,
  updateOrganizationToken,
  validateGitHubToken,
  validateOrganizationCredentials,
  validateWebhooks,
} from '@/actions/organizations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getGeneralWebhookTypes, getWebhooksUrl } from '@/lib/organizations';
import type { Organization } from '@/lib/prisma';

export function PrimaryIntegrationSection({ organization }: { organization: Organization }) {
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTokenSaved, setIsTokenSaved] = useState(false);

  async function handleValidateAndSaveToken() {
    if (!token.trim()) return;

    setIsValidating(true);

    // validate credentials
    const { valid, message } = await validateOrganizationCredentials({
      type: organization.type,
      url: organization.url,
      token,
      id: organization.id,
    });
    if (!valid) {
      setIsValidating(false);
      toast.error('Failed to verify organization credentials', {
        description: message || 'Please check your token and try again.',
      });
      return;
    }

    setIsValidating(false);

    // update token in database
    setIsSaving(true);
    const { success, error } = await updateOrganizationToken({ id: organization.id, token });
    setIsSaving(false);
    if (!success) {
      setIsSaving(false);
      toast.error('Failed to save organization token', {
        description: error?.message || 'Please try again later.',
      });
      return;
    }

    toast.success('Organization token saved successfully');
    setIsTokenSaved(true);
    setToken('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primary Integration</CardTitle>
        <CardDescription>Your organization's main source control integration</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel>Integration Type</FieldLabel>
              <div className='flex items-center gap-2'>
                <Input value={organization.type} disabled className='bg-muted' />
                <Badge variant='secondary'>Active</Badge>
              </div>
            </Field>

            <Field>
              <FieldLabel>URL</FieldLabel>
              <InputGroup data-disabled>
                <InputGroupAddon>
                  <Globe className='size-4' />
                </InputGroupAddon>
                <InputGroupInput value={organization.url} disabled className='bg-muted' />
              </InputGroup>
            </Field>

            <Field>
              <div className='flex items-center justify-between'>
                <FieldLabel htmlFor='token'>Access Token</FieldLabel>
              </div>
              <div className='flex gap-2'>
                <InputGroup className='flex-1'>
                  <InputGroupInput
                    id='token'
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setIsTokenSaved(false);
                    }}
                    placeholder='Enter new token to update'
                  />
                  <InputGroupAddon align='inline-end'>
                    <InputGroupButton
                      type='button'
                      variant='ghost'
                      size='icon-xs'
                      onClick={() => setShowToken(!showToken)}
                      aria-label={showToken ? 'Hide token' : 'Show token'}
                    >
                      {showToken ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <Button
                  onClick={handleValidateAndSaveToken}
                  disabled={!token.trim() || isValidating || isSaving || isTokenSaved}
                >
                  {isValidating || isSaving ? (
                    <>
                      <Spinner className='mr-2' />
                      {isValidating ? 'Validating...' : 'Saving...'}
                    </>
                  ) : isTokenSaved ? (
                    <>
                      <CheckCircle2 className='size-4 mr-2' />
                      Saved
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>
              <FieldDescription>
                Tokens are stored securely and never displayed after saving. Enter a new token to update your existing
                configuration.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>
  );
}

export function GitHubSection({
  organizationId,
  hasToken: initialHasToken,
}: {
  organizationId: string;
  hasToken: boolean;
}) {
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [hasToken, setHasToken] = useState(initialHasToken);

  async function handleValidateAndSaveToken() {
    if (!token.trim()) return;

    setIsValidating(true);

    // validate token
    const { valid, message } = await validateGitHubToken({ token });
    if (!valid) {
      setIsValidating(false);
      toast.error('Failed to verify GitHub token', {
        description: message || 'Please check your token and try again.',
      });
      return;
    }

    setIsValidating(false);

    // update token in database
    setIsSaving(true);
    const { success, error } = await updateGithubToken({ id: organizationId, token });
    setIsSaving(false);
    if (!success) {
      setIsSaving(false);
      toast.error('Failed to save GitHub token', {
        description: error?.message || 'Please try again later.',
      });
      return;
    }

    toast.success('GitHub token saved successfully');
    setIsTokenSaved(true);
    setHasToken(true);
    setToken('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Access Token</CardTitle>
        <CardDescription>Optional token to avoid GitHub API rate limiting</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <div className='flex items-center justify-between'>
                <FieldLabel htmlFor='github-token'>Personal Access Token</FieldLabel>
                <div className='flex items-center gap-1.5 text-xs'>
                  {hasToken ? (
                    <>
                      <ShieldCheck className='size-3.5 text-green-600' />
                      <span className='text-green-600 font-medium'>Token configured</span>
                    </>
                  ) : (
                    <>
                      <Shield className='size-3.5 text-muted-foreground' />
                      <span className='text-muted-foreground font-medium'>Optional - not set</span>
                    </>
                  )}
                </div>
              </div>
              <div className='flex gap-2'>
                <InputGroup className='flex-1'>
                  <InputGroupInput
                    id='github-token'
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setIsTokenSaved(false);
                    }}
                    placeholder={hasToken ? 'Enter new token to update' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                  />
                  <InputGroupAddon align='inline-end'>
                    <InputGroupButton
                      type='button'
                      variant='ghost'
                      size='icon-xs'
                      onClick={() => setShowToken(!showToken)}
                      aria-label={showToken ? 'Hide token' : 'Show token'}
                    >
                      {showToken ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <Button
                  onClick={handleValidateAndSaveToken}
                  disabled={!token.trim() || isValidating || isSaving || isTokenSaved}
                >
                  {isValidating || isSaving ? (
                    <>
                      <Spinner className='mr-2' />
                      {isValidating ? 'Validating...' : 'Saving...'}
                    </>
                  ) : isTokenSaved ? (
                    <>
                      <CheckCircle2 className='size-4 mr-2' />
                      Saved
                    </>
                  ) : hasToken ? (
                    'Update'
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <FieldDescription>
                This optional token increases GitHub API rate limits and requires "repo" scope. Tokens are stored
                securely and never displayed after saving.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>
  );
}

export function WebhooksSection({ organization }: { organization: Organization }) {
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const webhookUrl = getWebhooksUrl(organization);
  const webhooksTypes = getGeneralWebhookTypes(organization);

  async function fetchToken() {
    if (token !== null) {
      setShowToken(true);
      return;
    }

    setIsFetching(true);
    try {
      const webhooksToken = await getWebhooksToken({ organizationId: organization.id });
      setToken(webhooksToken);
      setShowToken(true);
    } catch (error) {
      toast.error('Failed to load webhooks token', {
        description: (error as Error).message,
      });
    } finally {
      setIsFetching(false);
    }
  }

  function handleToggleVisibility() {
    if (!showToken && token !== null) {
      // If hiding and token is already loaded, just show it without server call
      setShowToken(true);
    } else if (!showToken) {
      // If showing for first time, load from server
      fetchToken();
    } else {
      // If hiding, just hide
      setShowToken(false);
    }
  }

  async function handleCopyToken() {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      toast.success('Webhooks token copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy token to clipboard', {
        description: (error as Error).message,
      });
    }
  }

  async function handleCopyWebhookUrl() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success('Webhook URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL to clipboard', {
        description: (error as Error).message,
      });
    }
  }

  async function handleValidateWebhooks() {
    setIsValidating(true);
    const { success, valid, message } = await validateWebhooks(organization);
    setIsValidating(false);
    if (!success || !valid) {
      toast.error(success ? 'Webhooks validation failed' : 'Webhooks configuration is invalid', {
        description: message,
      });
      return;
    }

    toast.success('Webhooks validated successfully');
  }

  async function handleCreateWebhooks() {
    setIsCreating(true);
    const { success, error } = await createWebhooks(organization);
    setIsCreating(false);
    if (!success) {
      toast.error('Failed to create webhooks', { description: error?.message });
      return;
    }

    toast.success('Webhooks created successfully');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Webhook className='size-5' />
          Webhooks Integration
        </CardTitle>
        <CardDescription>Configure webhooks (or service hooks) from your provider to Paklo.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel>Webhooks Token</FieldLabel>
              <div className='flex gap-2'>
                <InputGroup className='flex-1'>
                  <InputGroupInput
                    type={showToken ? 'text' : 'password'}
                    value={showToken && token ? token : ''}
                    placeholder={token === null ? 'Click "Show Token" to load' : '••••••••••••••••••••••••••••••••'}
                    disabled
                    className='bg-muted font-mono text-sm'
                  />
                  <InputGroupAddon align='inline-end'>
                    {showToken && token && (
                      <InputGroupButton
                        type='button'
                        variant='ghost'
                        size='icon-xs'
                        onClick={handleCopyToken}
                        aria-label='Copy token'
                        className='mr-1'
                      >
                        <Copy className='size-4' />
                      </InputGroupButton>
                    )}
                  </InputGroupAddon>
                </InputGroup>
                <Button onClick={handleToggleVisibility} disabled={isFetching} variant='outline'>
                  {isFetching ? (
                    <>
                      <Spinner className='mr-2' />
                      Fetching...
                    </>
                  ) : showToken ? (
                    'Hide'
                  ) : (
                    'Reveal'
                  )}
                </Button>
              </div>
              <FieldDescription>
                This token is used to authenticate webhook requests coming into Paklo. It cannot be edited but can be
                viewed and copied for manual webhook configuration.
              </FieldDescription>
            </Field>

            {webhooksTypes.length === 0 ? null : (
              <Field>
                <FieldLabel>Recommended Webhooks</FieldLabel>
                <div className='space-y-3 bg-muted/50 rounded-md'>
                  <Table className='text-sm space-y-2 text-muted-foreground'>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooksTypes.map((webhook) => (
                        <TableRow key={webhook.type}>
                          <TableCell>
                            <code className='text-wrap'>{webhook.type}</code>
                          </TableCell>
                          <TableCell>
                            <span className='text-wrap'>{webhook.description}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className='text-sm text-muted-foreground p-2 border-t border-border/50 flex items-center gap-2'>
                    <div>
                      <strong>Webhook URL:</strong>{' '}
                      <code className='bg-background px-1.5 py-0.5 rounded break-all'>{webhookUrl}</code>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      onClick={handleCopyWebhookUrl}
                      aria-label='Copy webhook URL'
                    >
                      <Copy className='size-4' />
                    </Button>
                  </div>
                </div>
                <FieldDescription>
                  These webhooks ensure Paklo receives real-time notifications about your repositories and pull
                  requests.
                </FieldDescription>
              </Field>
            )}

            <Field>
              <FieldLabel>Integration Actions</FieldLabel>
              <div className='flex gap-2'>
                <Button onClick={handleValidateWebhooks} disabled={isValidating || isCreating} variant='outline'>
                  {isValidating ? (
                    <>
                      <Spinner className='mr-2' />
                      Validating...
                    </>
                  ) : (
                    'Validate'
                  )}
                </Button>
                <Button onClick={handleCreateWebhooks} disabled={isValidating || isCreating} variant='default'>
                  {isCreating ? (
                    <>
                      <Spinner className='mr-2' />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
              <FieldDescription>
                Validate your current webhook configuration or automatically create the required webhooks for your
                organization.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>
  );
}
