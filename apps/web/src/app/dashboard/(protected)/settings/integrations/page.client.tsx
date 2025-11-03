'use client';

import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  updateGithubToken,
  updateOrganizationToken,
  validateGitHubToken,
  validateOrganizationCredentials,
} from '@/actions/organizations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { Organization } from '@/lib/auth-client';
import type { OrganizationType } from '@/lib/organization-types';

export function PrimaryIntegrationSection({ organization }: { organization: Organization }) {
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTokenSaved, setIsTokenSaved] = useState(false);

  async function handleValidateToken() {
    if (!token.trim()) return;

    setIsValidating(true);

    // validate credentials
    const { valid, message } = await validateOrganizationCredentials({
      type: organization.type as OrganizationType,
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
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label>Integration Type</Label>
          <div className='flex items-center gap-2'>
            <Input value={organization.type} disabled className='bg-muted' />
            <Badge variant='secondary'>Active</Badge>
          </div>
        </div>

        <div className='space-y-2'>
          <Label>URL</Label>
          <Input value={organization.url} disabled className='bg-muted' />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='token'>Access Token</Label>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <Input
                id='token'
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setIsTokenSaved(false);
                }}
                placeholder='Enter new token to update'
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-0 top-0 h-full px-3'
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
              </Button>
            </div>
            <Button onClick={handleValidateToken} disabled={!token.trim() || isValidating || isSaving || isTokenSaved}>
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
                'Save'
              )}
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            Tokens are not loaded from the server. Enter a new token to update it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function GitHubSection({ organizationId }: { organizationId: string }) {
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTokenSaved, setIsTokenSaved] = useState(false);

  const handleValidateToken = async () => {
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
    setToken('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Access Token</CardTitle>
        <CardDescription>Optional token to avoid GitHub API rate limiting</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='github-token'>Personal Access Token</Label>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <Input
                id='github-token'
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setIsTokenSaved(false);
                }}
                placeholder='ghp_xxxxxxxxxxxxxxxxxxxx'
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-0 top-0 h-full px-3'
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
              </Button>
            </div>
            <Button onClick={handleValidateToken} disabled={!token.trim() || isValidating || isSaving || isTokenSaved}>
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
                'Save'
              )}
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            This token is used to increase GitHub API rate limits. Requires 'repo' scope.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
