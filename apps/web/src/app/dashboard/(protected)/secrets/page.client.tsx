'use client';

import { Eye, EyeOff, Key, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  createSecret,
  deleteSecret,
  type OrganizationSecretSafe,
  updateSecret,
  validateSecretName,
} from '@/actions/organizations';
import { TimeAgo } from '@/components/time-ago';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { validateSecretNameFormat } from '@/lib/secrets';

interface SecretsViewProps {
  organizationId: string;
  secrets: OrganizationSecretSafe[];
}

export function SecretsView({ organizationId, secrets: initialSecrets }: SecretsViewProps) {
  const [secrets, setSecrets] = useState<OrganizationSecretSafe[]>(initialSecrets);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<OrganizationSecretSafe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for add/edit dialog
  const [secretName, setSecretName] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [nameError, setNameError] = useState('');

  function resetForm() {
    setSecretName('');
    setSecretValue('');
    setShowValue(false);
    setNameError('');
    setEditingSecret(null);
  }

  function handleAddSecret() {
    setIsAddDialogOpen(true);
    resetForm();
  }

  function handleEditSecret(secret: OrganizationSecretSafe) {
    setEditingSecret(secret);
    setSecretName(secret.name);
    setSecretValue(''); // Value is not populated for editing (security)
    setShowValue(false);
    setNameError('');
  }

  async function handleSubmit() {
    // Convert secret name to uppercase for consistency
    const name = secretName.toUpperCase();

    // Validate secret name
    const { valid, error } = await validateSecretName({
      organizationId,
      name,
      id: editingSecret?.id,
    });
    if (!valid) {
      setNameError(error || 'Invalid secret name');
      return;
    }

    if (!secretValue.trim()) {
      toast.error('Secret value is required');
      return;
    }

    setIsSubmitting(true);

    if (editingSecret) {
      const secret = await updateSecret({
        organizationId,
        id: editingSecret.id,
        value: secretValue,
      });
      setSecrets((prev) => prev.map((s) => (s.id === editingSecret.id ? { ...s, ...secret } : s)));
      toast.success('Secret updated successfully');
    } else {
      const secret = await createSecret({
        organizationId,
        name: name,
        value: secretValue,
      });
      setSecrets((prev) => [...prev, secret]);
      toast.success('Secret added successfully');
    }

    setIsSubmitting(false);
    setIsAddDialogOpen(false);
    setEditingSecret(null);
    resetForm();
  }

  async function handleDeleteSecret(secret: OrganizationSecretSafe) {
    await deleteSecret({ organizationId, id: secret.id });

    setSecrets((prev) => prev.filter((s) => s.id !== secret.id));
    toast.success(`Secret "${secret.name}" deleted successfully`);
  }

  function validateNameInput(name: string) {
    setSecretName(name);
    if (name.trim()) {
      const { valid, error } = validateSecretNameFormat(name);
      setNameError(valid ? '' : error || 'Unknown secret validation error');
    } else {
      setNameError('');
    }
  }

  return (
    <>
      {secrets.length === 0 ? (
        <div className='p-6 w-full max-w-5xl mx-auto min-h-screen flex'>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Key />
              </EmptyMedia>
              <EmptyTitle>No secrets configured</EmptyTitle>
              <EmptyDescription>
                Get started by adding your first organization secret. These will be used to store sensitive information
                securely and have them replaced when your jobs run.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddSecret}>
                    <Plus className='size-4' />
                    Add your first secret
                  </Button>
                </DialogTrigger>
              </Dialog>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
          <div className='grid gap-4 grid-cols-1 md:grid-cols-3 items-center justify-center'>
            <div className='md:col-span-2'>
              <h1 className='text-3xl font-semibold mb-2'>Organization Secrets</h1>
              <p className='text-muted-foreground'>
                Manage organization secrets that can be used in your workflows. Values are securely stored and cannot be
                read back except during job runs.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddSecret} className='mt-4 md:w-full lg:mt-0 lg:justify-self-end lg:w-auto'>
                  <Plus className='size-4' />
                  Add Secret
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          <div className='border rounded-lg overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='font-semibold'>Secret Name</TableHead>
                  <TableHead className='font-semibold w-32'>Last Updated</TableHead>
                  <TableHead className='font-semibold w-24 text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secrets.map((secret) => (
                  <TableRow key={secret.id} className='group'>
                    <TableCell className='font-mono font-medium'>{secret.name}</TableCell>
                    <TableCell>
                      <TimeAgo value={secret.updatedAt} />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEditSecret(secret)}
                          className='size-8 p-0 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer'
                        >
                          <Pencil className='size-4' />
                          <span className='sr-only'>Edit secret</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='size-8 p-0 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-destructive'
                            >
                              <Trash2 className='size-4' />
                              <span className='sr-only'>Delete secret</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Secret</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the secret "{secret.name}"? This action cannot be undone
                                and may break job runs that depend on this secret.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSecret(secret)}
                                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                              >
                                Delete Secret
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add/Edit Secret Dialog */}
      <Dialog
        open={isAddDialogOpen || editingSecret !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingSecret(null);
            resetForm();
          }
        }}
      >
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>{editingSecret ? 'Update Secret' : 'Add New Secret'}</DialogTitle>
            <DialogDescription>
              {editingSecret
                ? 'Update the secret value. The name cannot be changed.'
                : 'Add a new secret to your organization. Choose a descriptive name and enter the secret value.'}
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <FieldSet>
              <FieldGroup>
                <Field data-invalid={!!nameError}>
                  <FieldLabel htmlFor='name'>Name</FieldLabel>
                  <Input
                    id='name'
                    placeholder='e.g., DOCKER_HUB_PASSWORD'
                    value={secretName}
                    onChange={(e) => validateNameInput(e.target.value)}
                    disabled={!!editingSecret} // Disable name editing when updating
                    aria-invalid={!!nameError}
                  />
                  {nameError && <FieldError>{nameError}</FieldError>}
                  <FieldDescription>
                    Name must contain only letters, numbers, underscores, and hyphens.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor='value'>Value</FieldLabel>
                  <InputGroup>
                    {showValue ? (
                      <Textarea
                        id='value'
                        data-slot='input-group-control'
                        placeholder={editingSecret ? 'Enter new value...' : 'Enter secret value...'}
                        value={secretValue}
                        onChange={(e) => setSecretValue(e.target.value)}
                        className='font-mono text-sm min-h-20'
                      />
                    ) : (
                      <InputGroupInput
                        id='value'
                        type='password'
                        placeholder={editingSecret ? 'Enter new value...' : 'Enter secret value...'}
                        value={secretValue}
                        onChange={(e) => setSecretValue(e.target.value)}
                        className='font-mono text-sm'
                      />
                    )}
                    <InputGroupAddon align={showValue ? 'block-end' : 'inline-end'}>
                      <InputGroupButton
                        type='button'
                        variant='ghost'
                        size='icon-xs'
                        onClick={() => setShowValue(!showValue)}
                        tabIndex={-1}
                        aria-label={showValue ? 'Hide secret value' : 'Show secret value'}
                      >
                        {showValue ? <EyeOff className='size-3' /> : <Eye className='size-3' />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {editingSecret && <FieldDescription>Enter a new value to update the secret.</FieldDescription>}
                </Field>
              </FieldGroup>
            </FieldSet>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingSecret(null);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !secretName.trim() || !secretValue.trim() || !!nameError}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  {editingSecret ? 'Updating...' : 'Adding...'}
                </>
              ) : editingSecret ? (
                'Update Secret'
              ) : (
                'Add Secret'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
