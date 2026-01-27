'use client';

import { CheckCircle2, Copy, Eye, EyeOff, Shield, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  updateGithubToken,
  updateOrganizationToken,
  validateGitHubToken,
  validateOrganizationCredentials,
} from '@/actions/organizations';
import { GitHubLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getOrganizationTypeInfo } from '@/lib/organizations';
import type { Organization } from '@/lib/prisma';

export function PrimaryIntegrationSection({ organization }: { organization: Organization }) {
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTokenSaved, setIsTokenSaved] = useState(false);

  const orgTypeInfo = getOrganizationTypeInfo(organization.type);

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

  function copyToClipboard(url: string): void {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  }

  return (
    <Item variant='outline'>
      <ItemMedia variant='icon'>
        <Tooltip>
          <TooltipTrigger>
            <orgTypeInfo.logo />
          </TooltipTrigger>
          <TooltipContent>{orgTypeInfo.name} Integration</TooltipContent>
        </Tooltip>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Primary Integration</ItemTitle>
        <ItemDescription>Your organization's main source control integration</ItemDescription>
        <FieldSet>
          <FieldGroup>
            <Field>
              {/* <FieldLabel>URL</FieldLabel> */}
              <InputGroup data-disabled>
                <InputGroupInput value={organization.url} disabled className='bg-muted' />
                <InputGroupButton onClick={() => copyToClipboard(organization.url)}>
                  <Copy className='size-4' />
                </InputGroupButton>
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
                      <CheckCircle2 className='mr-2 size-4' />
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
      </ItemContent>
    </Item>
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
    <Item variant='outline'>
      <ItemMedia variant='icon'>
        <Tooltip>
          <TooltipTrigger>
            <GitHubLogo />
          </TooltipTrigger>
          <TooltipContent>GitHub Integration</TooltipContent>
        </Tooltip>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>GitHub Access Token</ItemTitle>
        <ItemDescription>Optional token to avoid GitHub API rate limiting</ItemDescription>
        <FieldSet>
          <FieldGroup>
            <Field>
              <div className='flex items-center justify-between'>
                <FieldLabel htmlFor='github-token'>Personal Access Token</FieldLabel>
                <div className='flex items-center gap-1.5 text-xs'>
                  {hasToken ? (
                    <>
                      <ShieldCheck className='size-3.5 text-green-600' />
                      <span className='font-medium text-green-600'>Token configured</span>
                    </>
                  ) : (
                    <>
                      <Shield className='size-3.5 text-muted-foreground' />
                      <span className='font-medium text-muted-foreground'>Optional - not set</span>
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
                      <CheckCircle2 className='mr-2 size-4' />
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
      </ItemContent>
    </Item>
  );
}
