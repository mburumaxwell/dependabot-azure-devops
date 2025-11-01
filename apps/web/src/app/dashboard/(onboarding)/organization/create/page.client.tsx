'use client';

import { CheckCircle2, Eye, EyeOff, Globe, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import validator from 'validator';
import { validateOrganizationCredentials } from '@/actions/organizations';
import { Stepper } from '@/components/stepper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { authClient } from '@/lib/auth-client';
import { ORGANIZATION_TYPES_INFO, type OrganizationType } from '@/lib/organization-types';
import { REGIONS, type RegionCode } from '@/lib/regions';
import { cn } from '@/lib/utils';

type CreationData = {
  name: string;
  slug: string;
  type: OrganizationType;
  url: string;
  token: string;
  region: RegionCode;
};

export function CreateOrganizationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CreationData>({
    name: '',
    slug: '',
    type: 'azure',
    url: '',
    token: '',
    region: 'lhr',
  });

  // Step 1: Slug verification state
  const [slugVerifying, setSlugVerifying] = useState(false);
  const [slugVerified, setSlugVerified] = useState(false);
  const [slugError, setSlugError] = useState('');

  // Step 2: Credentials verification state
  const [credentialsVerifying, setCredentialsVerifying] = useState(false);
  const [credentialsVerified, setCredentialsVerified] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [showToken, setShowToken] = useState(false);

  // Step 3: Creating organization state
  const [creating, setCreating] = useState(false);

  const steps = [
    { title: 'Name & Slug', description: 'Basic information' },
    { title: 'Integration', description: 'Connect your platform' },
    { title: 'Data Residency', description: 'Choose your region' },
  ];

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    setData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20),
    }));
    setSlugVerified(false);
    setSlugError('');
  }

  // Verify slug availability
  async function verifySlug() {
    if (!data.slug) {
      setSlugError('Slug is required');
      return;
    }

    setSlugVerifying(true);
    setSlugError('');

    if (['test', 'admin', 'api'].includes(data.slug)) {
      setSlugVerifying(false);
      setSlugError('This slug is not allowed');
      return;
    }

    const response = await authClient.organization.checkSlug({ slug: data.slug });
    if (response.error) {
      setSlugVerifying(false);
      setSlugError(`${response.error.code}: ${response.error.message}`);
      return;
    }

    setSlugVerifying(false);
    if (response.data.status) {
      setSlugVerified(true);
    } else {
      setSlugError('This slug is already taken');
    }
  }

  function validateUrl(url: string): boolean {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_tld: true,
      require_protocol: true,
      allow_fragments: false,
      allow_query_components: false,
      disallow_auth: true,
      host_blacklist: ['localhost', '127.0.0.1', '[::1]'],
    });
  }

  function handleUrlChange(url: string) {
    setData((prev) => ({ ...prev, url }));
    setCredentialsVerified(false);
    setCredentialsError('');

    if (url && !validateUrl(url)) {
      setUrlError(
        `Please enter a valid URL (e.g., ${
          (data.type === 'azure' && 'https://dev.azure.com/your-org') ||
          (data.type === 'bitbucket' && 'https://bitbucket.org/your-workspace') ||
          (data.type === 'gitlab' && 'https://gitlab.com/your-group')
        })`,
      );
    } else {
      setUrlError('');
    }
  }

  // Verify integration credentials
  async function verifyCredentials() {
    if (!data.url || !data.token) {
      setCredentialsError('URL and token are required');
      return;
    }

    const normalizedUrl = data.url.replace(/\/+$/, '');
    if (!validateUrl(normalizedUrl)) {
      setUrlError('Please enter a valid URL');
      return;
    }
    setData((prev) => ({ ...prev, url: normalizedUrl }));

    setCredentialsVerifying(true);
    setCredentialsError('');

    if (data.type !== 'azure') {
      setCredentialsVerifying(false);
      setCredentialsError('Only Azure DevOps is supported at this time');
      return;
    }

    // validate credentials
    const { valid, message } = await validateOrganizationCredentials(data);
    if (!valid) {
      setCredentialsVerifying(false);
      setCredentialsError(message || 'Failed to verify credentials');
      return;
    }

    setCredentialsVerifying(false);
    setCredentialsVerified(true);
  }

  // Create organization
  async function createOrganization() {
    setCreating(true);

    // Call API to create organization
    const response = await authClient.organization.create({
      name: data.name,
      slug: data.slug,
      type: data.type,
      url: data.url,
      token: data.token,
      region: data.region,

      // change current active organization to the new one
      keepCurrentActiveOrganization: false,
    });

    setCreating(false);

    if (response.error) {
      // TODO: show error to user
      // setCreatingError(`${response.error.code}: ${response.error.message}`);
      return;
    }

    // Redirect to organization settings for billing setup
    router.push('/dashboard/settings/billing?new=true');
  }

  const canProceedStep1 = data.name && data.slug && slugVerified;
  const canProceedStep2 = data.url && !urlError && data.token && credentialsVerified;

  // filter regions allowed to be shown, sort by available the label
  const regions = REGIONS.filter((region) => region.visible).sort(
    (a, b) => Number(b.available) - Number(a.available) || a.label.localeCompare(b.label),
  );

  return (
    <>
      <Stepper steps={steps} currentStep={currentStep} className='mb-8' />

      <Card>
        <CardContent>
          {/* Step 1: Name & Slug */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Organization Name</Label>
                <Input
                  id='name'
                  placeholder='Acme Inc'
                  value={data.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='slug'>Slug</Label>
                <div className='flex gap-2'>
                  <Input
                    id='slug'
                    placeholder='acme-inc'
                    value={data.slug}
                    onChange={(e) => {
                      setData((prev) => ({ ...prev, slug: e.target.value }));
                      setSlugVerified(false);
                      setSlugError('');
                    }}
                    className={slugError ? 'border-destructive' : ''}
                  />
                  <Button onClick={verifySlug} disabled={!data.slug || slugVerifying || slugVerified} variant='outline'>
                    {slugVerifying ? (
                      <>
                        <Loader2 className='animate-spin' />
                        Verifying
                      </>
                    ) : slugVerified ? (
                      <>
                        <CheckCircle2 className='text-green-600' />
                        Verified
                      </>
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                {slugError && (
                  <p className='text-sm text-destructive flex items-center gap-1'>
                    <XCircle className='size-4' />
                    {slugError}
                  </p>
                )}
                {slugVerified && (
                  <p className='text-sm text-green-600 flex items-center gap-1'>
                    <CheckCircle2 className='size-4' />
                    Slug is available
                  </p>
                )}
                <p className='text-sm text-muted-foreground'>This will be used in your organization URL</p>
              </div>

              <div className='flex justify-between pt-4'>
                <Button variant='outline' onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button onClick={() => setCurrentStep(2)} disabled={!canProceedStep1}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Integration Setup */}
          {currentStep === 2 && (
            <div className='space-y-6'>
              <div className='space-y-4'>
                <Label>Integration Type</Label>
                <div className='grid grid-cols-3 gap-4'>
                  {Object.values(ORGANIZATION_TYPES_INFO).map((provider) => (
                    <button
                      key={provider.type}
                      type='button'
                      onClick={() => {
                        setData((prev) => ({ ...prev, type: provider.type }));
                        setCredentialsVerified(false);
                        setCredentialsError('');
                      }}
                      className={cn(
                        'relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary/50',
                        data.type === provider.type ? 'border-primary bg-primary/5' : 'border-border bg-card',
                      )}
                    >
                      <div
                        className={`size-12 rounded-lg bg-[${provider.logoBackground}] flex items-center justify-center`}
                      >
                        <provider.logo className='size-8 text-foreground' />
                      </div>
                      <div className='text-center'>
                        <div className='font-semibold'>{provider.name}</div>
                        <div className='text-sm text-muted-foreground'>{provider.vendor}</div>
                      </div>
                      {data.type === provider.type && (
                        <div className='absolute top-3 right-3'>
                          <CheckCircle2 className='size-5 text-primary' />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='url'>
                  {(data.type === 'azure' && 'Azure DevOps Organization') ||
                    (data.type === 'bitbucket' && 'Bitbucket Workspace') ||
                    (data.type === 'gitlab' && 'GitLab Group')}{' '}
                  URL
                </Label>
                <Input
                  id='url'
                  placeholder={
                    (data.type === 'azure' && 'https://dev.azure.com/your-org') ||
                    (data.type === 'bitbucket' && 'https://bitbucket.org/your-workspace') ||
                    (data.type === 'gitlab' && 'https://gitlab.com/your-group') ||
                    'https://my-git-platform.com/your-path'
                  }
                  value={data.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={urlError ? 'border-destructive' : ''}
                />
                {urlError && (
                  <p className='text-sm text-destructive flex items-center gap-1'>
                    <XCircle className='size-4' />
                    {urlError}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='token'>Personal Access Token</Label>
                <div className='relative'>
                  <Input
                    id='token'
                    type={showToken ? 'text' : 'password'}
                    placeholder='Enter your access token'
                    value={data.token}
                    onChange={(e) => {
                      setData((prev) => ({ ...prev, token: e.target.value }));
                      setCredentialsVerified(false);
                      setCredentialsError('');
                    }}
                    className='pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className='size-4 text-muted-foreground' />
                    ) : (
                      <Eye className='size-4 text-muted-foreground' />
                    )}
                    <span className='sr-only'>{showToken ? 'Hide token' : 'Show token'}</span>
                  </Button>
                </div>
                <p className='text-sm text-muted-foreground'>
                  We'll use this to connect to your{' '}
                  {(data.type === 'azure' && 'Azure DevOps Organization') ||
                    (data.type === 'bitbucket' && 'Bitbucket Workspace') ||
                    (data.type === 'gitlab' && 'GitLab Group')}
                </p>
              </div>

              {credentialsError && (
                <Alert variant='destructive'>
                  <XCircle className='size-4' />
                  <AlertDescription>{credentialsError}</AlertDescription>
                </Alert>
              )}

              {credentialsVerified && (
                <Alert className='border-green-600/20 bg-green-50 dark:bg-green-950/20'>
                  <CheckCircle2 className='size-4 text-green-600' />
                  <AlertDescription className='text-green-600'>Connection verified successfully</AlertDescription>
                </Alert>
              )}

              <div className='flex gap-2'>
                <Button
                  onClick={verifyCredentials}
                  disabled={!data.url || !data.token || credentialsVerifying || credentialsVerified}
                  variant='outline'
                  className='flex-1 bg-transparent'
                >
                  {credentialsVerifying ? (
                    <>
                      <Loader2 className='animate-spin' />
                      Verifying Connection
                    </>
                  ) : credentialsVerified ? (
                    <>
                      <CheckCircle2 className='text-green-600' />
                      Verified
                    </>
                  ) : (
                    'Verify Connection'
                  )}
                </Button>
              </div>

              <div className='flex justify-between pt-4'>
                <Button variant='outline' onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)} disabled={!canProceedStep2}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Data Residency */}
          {currentStep === 3 && (
            <div className='space-y-6'>
              <div className='space-y-4'>
                <Label>Select Execution Region</Label>
                <p className='text-sm text-muted-foreground'>Choose where your organization's jobs will be run.</p>
                <RadioGroup
                  value={data.region}
                  onValueChange={(value) => setData((prev) => ({ ...prev, region: value as RegionCode }))}
                  className='grid grid-cols-2 gap-4'
                >
                  {regions.map((region) => (
                    <div key={region.code} className='relative'>
                      <label
                        htmlFor={region.code}
                        className={cn(
                          'flex items-center gap-4 rounded-lg border-2 p-4 transition-all cursor-pointer',
                          !region.available && 'opacity-50 cursor-not-allowed',
                          region.available && data.region === region.code
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/50',
                        )}
                      >
                        <RadioGroupItem
                          value={region.code}
                          id={region.code}
                          disabled={!region.available}
                          className='shrink-0'
                        />
                        <div className='flex items-center gap-4 flex-1'>
                          <div className='size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
                            <Globe className='size-6 text-primary' />
                          </div>
                          <div className='flex-1'>
                            <div className='font-semibold'>{region.label}</div>
                            <div className='text-sm text-muted-foreground'>
                              {region.available ? 'Available now' : 'Coming soon'}
                            </div>
                          </div>
                        </div>
                        {!region.available && (
                          <div className='absolute inset-0 backdrop-blur-[2px] rounded-lg flex items-center justify-center'>
                            <span className='bg-background/90 px-4 py-2 rounded-full text-sm font-medium border'>
                              Coming Soon
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className='flex justify-between pt-4'>
                <Button variant='outline' onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button onClick={createOrganization} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className='animate-spin' />
                      Creating Organization
                    </>
                  ) : (
                    'Continue to Billing'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
