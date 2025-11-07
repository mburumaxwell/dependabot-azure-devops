'use client';

import { CheckCircle2, Eye, EyeOff, Globe, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import validator from 'validator';
import { validateOrganizationCredentials } from '@/actions/organizations';
import { createOrganizationWithCredential, type OrganizationCreateOptions } from '@/actions/organizations/create-org';
import { Stepper } from '@/components/stepper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';
import { ORGANIZATION_TYPES_INFO } from '@/lib/organization-types';
import { REGIONS, type RegionCode } from '@/lib/regions';
import { cn } from '@/lib/utils';

export function CreateOrganizationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OrganizationCreateOptions>({
    name: '',
    slug: '',
    type: 'azure',
    url: '',
    token: '',
    region: 'dub', // default to Dublin (most popular region)
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
  const [creatingError, setCreatingError] = useState('');

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

    const { data: rd, error } = await authClient.organization.checkSlug({ slug: data.slug });
    if (error) {
      setSlugVerifying(false);
      setSlugError(`${error.code}: ${error.message}`);
      return;
    }

    setSlugVerifying(false);
    if (rd.status) {
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
    const response = await createOrganizationWithCredential(data);
    setCreating(false);

    if (response.error) {
      setCreatingError(response.error.message);
      return;
    }

    setCreatingError('');

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

      <Card className='w-full'>
        <CardContent>
          {/* Step 1: Name & Slug */}
          {currentStep === 1 && (
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor='name'>Organization Name</FieldLabel>
                  <Input
                    id='name'
                    placeholder='Acme Inc'
                    value={data.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </Field>

                <Field data-invalid={!!slugError}>
                  <FieldLabel htmlFor='slug'>Slug</FieldLabel>
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
                      aria-invalid={!!slugError}
                    />
                    <Button
                      onClick={verifySlug}
                      disabled={!data.slug || slugVerifying || slugVerified}
                      variant='outline'
                    >
                      {slugVerifying ? (
                        <>
                          <Spinner />
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
                  {slugError && <FieldError>{slugError}</FieldError>}
                  {slugVerified && (
                    <p className='text-sm text-green-600 flex items-center gap-1'>
                      <CheckCircle2 className='size-4' />
                      Slug is available
                    </p>
                  )}
                  <FieldDescription>This will be used in your organization URL</FieldDescription>
                </Field>

                <Field>
                  <div className='flex justify-between pt-4'>
                    <Button variant='outline' onClick={() => router.back()}>
                      Cancel
                    </Button>
                    <Button onClick={() => setCurrentStep(2)} disabled={!canProceedStep1}>
                      Continue
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </FieldSet>
          )}

          {/* Step 2: Integration Setup */}
          {currentStep === 2 && (
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>Integration Type</FieldLabel>
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
                </Field>

                <Field data-invalid={!!urlError}>
                  <FieldLabel htmlFor='url'>
                    {(data.type === 'azure' && 'Azure DevOps Organization') ||
                      (data.type === 'bitbucket' && 'Bitbucket Workspace') ||
                      (data.type === 'gitlab' && 'GitLab Group')}{' '}
                    URL
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Globe className='size-4' />
                    </InputGroupAddon>
                    <InputGroupAddon>
                      <InputGroupText>https://</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id='url'
                      placeholder={
                        (data.type === 'azure' && 'dev.azure.com/your-org') ||
                        (data.type === 'bitbucket' && 'bitbucket.org/your-workspace') ||
                        (data.type === 'gitlab' && 'gitlab.com/your-group') ||
                        'my-git-platform.com/your-path'
                      }
                      value={data.url.replace(/^https?:\/\//, '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Ensure we always store with https:// prefix
                        const fullUrl = value.startsWith('http') ? value : `https://${value}`;
                        handleUrlChange(fullUrl);
                      }}
                      className='pl-0.5!'
                      aria-invalid={!!urlError}
                    />
                  </InputGroup>
                  {urlError && <FieldError>{urlError}</FieldError>}
                </Field>

                <Field>
                  <FieldLabel htmlFor='token'>Personal Access Token</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id='token'
                      type={showToken ? 'text' : 'password'}
                      placeholder='Enter your access token'
                      value={data.token}
                      onChange={(e) => {
                        setData((prev) => ({ ...prev, token: e.target.value }));
                        setCredentialsVerified(false);
                        setCredentialsError('');
                      }}
                    />
                    <InputGroupAddon align='inline-end'>
                      <InputGroupButton
                        type='button'
                        variant='ghost'
                        size='icon-xs'
                        onClick={() => setShowToken(!showToken)}
                        aria-label={showToken ? 'Hide token' : 'Show token'}
                      >
                        {showToken ? (
                          <EyeOff className='size-4 text-muted-foreground' />
                        ) : (
                          <Eye className='size-4 text-muted-foreground' />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>
                    We'll use this to connect to your{' '}
                    {(data.type === 'azure' && 'Azure DevOps Organization') ||
                      (data.type === 'bitbucket' && 'Bitbucket Workspace') ||
                      (data.type === 'gitlab' && 'GitLab Group')}
                  </FieldDescription>
                </Field>

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

                <Field>
                  <Button
                    onClick={verifyCredentials}
                    disabled={!data.url || !data.token || credentialsVerifying || credentialsVerified}
                    variant='outline'
                    className='w-full bg-transparent'
                  >
                    {credentialsVerifying ? (
                      <>
                        <Spinner />
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
                </Field>

                <Field>
                  <div className='flex justify-between pt-4'>
                    <Button variant='outline' onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep(3)} disabled={!canProceedStep2}>
                      Continue
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </FieldSet>
          )}

          {/* Step 3: Data Residency */}
          {currentStep === 3 && (
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>Select Execution Region</FieldLabel>
                  <FieldDescription>Choose where your organization's jobs will be run.</FieldDescription>
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
                </Field>

                {creatingError && (
                  <Alert variant='destructive'>
                    <XCircle className='size-4' />
                    <AlertDescription>{creatingError}</AlertDescription>
                  </Alert>
                )}

                <Field>
                  <div className='flex justify-between pt-4'>
                    <Button variant='outline' onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button onClick={createOrganization} disabled={creating}>
                      {creating ? (
                        <>
                          <Spinner />
                          Creating Organization
                        </>
                      ) : (
                        'Continue to Billing'
                      )}
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </FieldSet>
          )}
        </CardContent>
      </Card>
    </>
  );
}
