import { readFile } from 'node:fs/promises';
import * as yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod/v4';

import {
  DependabotConfigSchema,
  type DependabotRegistry,
  type DependabotUpdate,
  DependabotUpdateSchema,
  parseRegistries,
  parseUpdates,
  validateConfiguration,
} from './config';

describe('Parse configuration file', () => {
  it('Parsing works as expected', async () => {
    const config = await DependabotConfigSchema.parseAsync(
      yaml.load(await readFile('fixtures/config/dependabot.yml', 'utf-8')),
    );
    const updates = parseUpdates(config, '');
    expect(updates.length).toBe(5);

    // first
    const first = updates[0]!;
    expect(first.directory).toBe('/');
    expect(first.directories).toBeUndefined();
    expect(first['package-ecosystem']).toBe('docker');
    expect(first['insecure-external-code-execution']).toBeUndefined();
    expect(first.registries).toBeUndefined();

    // second
    const second = updates[1]!;
    expect(second.directory).toBe('/client');
    expect(second.directories).toBeUndefined();
    expect(second['package-ecosystem']).toBe('npm');
    expect(second['insecure-external-code-execution']).toBe('deny');
    expect(second.registries).toEqual(['reg1', 'reg2']);

    // third
    const third = updates[2]!;
    expect(third.directory).toBeUndefined();
    expect(third.directories).toEqual(['/src/client', '/src/server']);
    expect(third['package-ecosystem']).toBe('nuget');
    expect(JSON.stringify(third.groups)).toBe(
      '{"microsoft":{"patterns":["microsoft*"],"update-types":["minor","patch"]}}',
    );

    // fourth
    const fourth = updates[3]!;
    expect(fourth.directory).toBe('/');
    expect(fourth.directories).toBeUndefined();
    expect(fourth['package-ecosystem']).toBe('devcontainers');
    expect(fourth['open-pull-requests-limit']).toEqual(0);
    expect(fourth.registries).toBeUndefined();

    // fifth
    const fifth = updates[4]!;
    expect(fifth.directory).toBe('/');
    expect(fifth.directories).toBeUndefined();
    expect(fifth['package-ecosystem']).toBe('dotnet-sdk');
    expect(fifth['open-pull-requests-limit']).toEqual(5);
    expect(fifth.registries).toBeUndefined();
  });

  it('Parsing works as expected for issue 1789', async () => {
    const config = await DependabotConfigSchema.parseAsync(
      yaml.load(await readFile('fixtures/config/dependabot-issue-1789.yml', 'utf-8')),
    );
    const updates = parseUpdates(config, '');
    expect(updates.length).toBe(1);

    // update
    const update = updates[0]!;
    expect(update.directory).toBe('/');
    expect(update.directories).toBeUndefined();
    expect(update['package-ecosystem']).toBe('npm');
    expect(update['insecure-external-code-execution']).toBeUndefined();
    expect(update.registries).toEqual(['platform-clients', 'custom-packages']);
    expect(update.ignore?.length).toEqual(18);
    expect(update.ignore![17]!.versions).toEqual('>=3');
  });
});

describe('Directory validation', () => {
  it('Should reject directory with glob patterns', async () => {
    const invalidConfigs = [
      { version: 2, updates: [{ 'package-ecosystem': 'npm', directory: '/src/*' }] },
      { version: 2, updates: [{ 'package-ecosystem': 'npm', directory: '/src/app-?' }] },
      { version: 2, updates: [{ 'package-ecosystem': 'npm', directory: '/src/[abc]' }] },
      { version: 2, updates: [{ 'package-ecosystem': 'npm', directory: '/src/{a,b}' }] },
    ];

    for (const config of invalidConfigs) {
      await expect(DependabotConfigSchema.parseAsync(config)).rejects.toThrow(
        "The 'directory' field must not include glob pattern.",
      );
    }
  });

  it('Should accept directory without glob patterns', async () => {
    const validConfig = {
      version: 2,
      updates: [{ 'package-ecosystem': 'npm', directory: '/src/app' }],
    };

    const result = await DependabotConfigSchema.parseAsync(validConfig);
    expect(result.updates[0]?.directory).toBe('/src/app');
  });

  it('Should accept valid directory paths with special but non-glob characters', async () => {
    const validConfig = {
      version: 2,
      updates: [
        { 'package-ecosystem': 'npm', directory: '/src/app-name' },
        { 'package-ecosystem': 'docker', directory: '/src/app_name' },
        { 'package-ecosystem': 'nuget', directory: '/src/app.name' },
        { 'package-ecosystem': 'pip', directory: '/src/app@version' },
      ],
    };

    const result = await DependabotConfigSchema.parseAsync(validConfig);
    expect(result.updates).toHaveLength(4);
    expect(result.updates[0]?.directory).toBe('/src/app-name');
    expect(result.updates[1]?.directory).toBe('/src/app_name');
    expect(result.updates[2]?.directory).toBe('/src/app.name');
    expect(result.updates[3]?.directory).toBe('/src/app@version');
  });

  it('Should validate individual DependabotUpdate schema with glob patterns', async () => {
    const invalidUpdate = { 'package-ecosystem': 'npm', directory: '/src/*' };

    await expect(DependabotUpdateSchema.parseAsync(invalidUpdate)).rejects.toThrow(
      "The 'directory' field must not include glob pattern.",
    );
  });

  it('Should validate individual DependabotUpdate schema without glob patterns', async () => {
    const validUpdate = { 'package-ecosystem': 'npm', directory: '/src/app' };

    const result = await DependabotUpdateSchema.parseAsync(validUpdate);
    expect(result.directory).toBe('/src/app');
  });

  it('Should reject config file with glob patterns in directory', async () => {
    const configWithGlob = {
      version: 2,
      updates: [
        { 'package-ecosystem': 'npm', directory: '/src/*' },
        { 'package-ecosystem': 'docker', directory: '/apps/[abc]' },
      ],
    };

    try {
      await DependabotConfigSchema.parseAsync(configWithGlob);
      expect.fail('Expected validation to fail but it passed');
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      const zodError = error as ZodError;
      expect(zodError.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "The 'directory' field must not include glob pattern.",
          }),
        ]),
      );
    }
  });
});

describe('Parse registries', () => {
  it('Parsing works as expected', async () => {
    const config = await DependabotConfigSchema.parseAsync(
      yaml.load(await readFile('fixtures/config/sample-registries.yml', 'utf-8')),
    );
    const registries = await parseRegistries(config, () => undefined);
    expect(Object.keys(registries).length).toBe(15);

    // cargo-registry
    let registry = registries.cargo!;
    expect(registry.type).toBe('cargo_registry');
    expect(registry.url).toBe('https://cargo.cloudsmith.io/foobaruser/test/');
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBe('private-registry');
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBe('tkn_1234567890');
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBeUndefined();
    expect(registry.password).toBeUndefined();
    expect(registry['replaces-base']).toBeUndefined();

    // composer-repository
    registry = registries.composer!;
    expect(registry.type).toBe('composer_repository');
    expect(registry.url).toBe('https://repo.packagist.com/example-company/');
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBe('repo.packagist.com');
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBe('octocat');
    expect(registry.password).toBe('pwd_1234567890');
    expect(registry['replaces-base']).toBeUndefined();

    // docker-registry
    registry = registries.dockerhub!;
    expect(registry.type).toBe('docker_registry');
    expect(registry.url).toBeUndefined();
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBe('registry.hub.docker.com');
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBe('octocat');
    expect(registry.password).toBe('pwd_1234567890');
    expect(registry['replaces-base']).toBe(true);

    // git
    registry = registries['github-octocat']!;
    expect(registry.type).toBe('git');
    expect(registry.url).toBe('https://github.com');
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBe('x-access-token');
    expect(registry.password).toBe('pwd_1234567890');
    expect(registry['replaces-base']).toBeUndefined();

    // goproxy-server
    registry = registries['goproxy']!;
    expect(registry.type).toBe('goproxy_server');
    expect(registry.url).toBe('https://acme.jfrog.io/artifactory/api/go/my-repo');
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBe('octocat');
    expect(registry.password).toBe('pwd_1234567890');
    expect(registry['replaces-base']).toBeUndefined();

    // helm-registry
    registry = registries.helm!;
    expect(registry.type).toBe('helm_registry');
    expect(registry.url).toBe('https://registry.example.com');
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBe('octocat');
    expect(registry.password).toBe('pwd_1234567890');
    expect(registry['replaces-base']).toBeUndefined();

    // hex-organization
    registry = registries['github-hex-org']!;
    expect(registry.type).toBe('hex_organization');
    expect(registry.url).toBeUndefined();
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBe('key_1234567890');
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBe('github');
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBeUndefined();
    expect(registry.password).toBeUndefined();
    expect(registry['replaces-base']).toBeUndefined();

    // hex-repository
    registry = registries['github-hex-repository']!;
    expect(registry.type).toBe('hex_repository');
    expect(registry.url).toBe('https://private-repo.example.com');
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBe('private-repo');
    expect(registry['auth-key']).toBe('ak_1234567890');
    expect(registry['public-key-fingerprint']).toBe('pkf_1234567890');
    expect(registry.username).toBeUndefined();
    expect(registry.password).toBeUndefined();
    expect(registry['replaces-base']).toBeUndefined();

    // maven-repository
    registry = registries['maven-artifactory']!;
    expect(registry.type).toBe('maven_repository');
    expect(registry.url).toBe('https://artifactory.example.com');
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBe('octocat');
    expect(registry.password).toBe('pwd_1234567890');
    expect(registry['replaces-base']).toBe(true);

    // npm-registry
    registry = registries['npm-github']!;
    expect(registry.type).toBe('npm_registry');
    expect(registry.url).toBeUndefined();
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBe('npm.pkg.github.com');
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBe('tkn_1234567890');
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBeUndefined();
    expect(registry.password).toBeUndefined();
    expect(registry['replaces-base']).toBe(true);

    // nuget-feed
    registry = registries['nuget-azure-devops']!;
    expect(registry.type).toBe('nuget_feed');
    expect(registry.url).toBe('https://pkgs.dev.azure.com/contoso/_packaging/My_Feed/nuget/v3/index.json');
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBe('octocat@example.com');
    expect(registry.password).toBe('pwd_1234567890');
    expect(registry['replaces-base']).toBeUndefined();

    // pub-repository
    registry = registries['my-pub-registry']!;
    expect(registry.type).toBe('pub_repository');
    expect(registry.url).toBe('https://example-private-pub-repo.dev/optional-path');
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBe('tkn_1234567890');
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBeUndefined();
    expect(registry.password).toBeUndefined();
    expect(registry['replaces-base']).toBeUndefined();

    // python-index
    registry = registries['python-azure']!;
    expect(registry.type).toBe('python_index');
    expect(registry.url).toBeUndefined();
    expect(registry['index-url']).toBe('https://pkgs.dev.azure.com/octocat/_packaging/my-feed/pypi/example');
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBeUndefined();
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBe('octocat@example.com');
    expect(registry.password).toBe('pwd_1234567890');
    expect(registry['replaces-base']).toBe(true);

    // rubygems-server
    registry = registries['ruby-github']!;
    expect(registry.type).toBe('rubygems_server');
    expect(registry.url).toBe('https://rubygems.pkg.github.com/octocat/github_api');
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBeUndefined();
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBe('tkn_1234567890');
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBeUndefined();
    expect(registry.password).toBeUndefined();
    expect(registry['replaces-base']).toBe(false);

    // terraform-registry
    registry = registries['terraform-example']!;
    expect(registry.type).toBe('terraform_registry');
    expect(registry.url).toBeUndefined();
    expect(registry['index-url']).toBeUndefined();
    expect(registry.registry).toBeUndefined();
    expect(registry.host).toBe('terraform.example.com');
    expect(registry.key).toBeUndefined();
    expect(registry.token).toBe('tkn_1234567890');
    expect(registry.organization).toBeUndefined();
    expect(registry.repo).toBeUndefined();
    expect(registry['auth-key']).toBeUndefined();
    expect(registry['public-key-fingerprint']).toBeUndefined();
    expect(registry.username).toBeUndefined();
    expect(registry.password).toBeUndefined();
    expect(registry['replaces-base']).toBeUndefined();
  });
});

describe('Validate registries', () => {
  it('Validation works as expected', () => {
    // const config = await DependabotConfigSchema.parseAsync(
    //   yaml.load(await readFile('fixtures/config/dependabot.yml', 'utf-8')),
    // );
    // let updates = parseUpdates(config);
    // expect(updates.length).toBe(2);

    const updates: DependabotUpdate[] = [
      {
        'package-ecosystem': 'npm',
        directory: '/',
        directories: undefined,
        registries: ['dummy1', 'dummy2'],
      },
    ];

    const registries: Record<string, DependabotRegistry> = {
      dummy1: {
        type: 'nuget',
        url: 'https://pkgs.dev.azure.com/contoso/_packaging/My_Feed/nuget/v3/index.json',
        token: 'pwd_1234567890',
      },
      dummy2: {
        type: 'python-index',
        url: 'https://pkgs.dev.azure.com/octocat/_packaging/my-feed/pypi/example',
        username: 'octocat@example.com',
        password: 'pwd_1234567890',
        'replaces-base': true,
      },
    };

    // works as expected
    validateConfiguration(updates, registries);

    // fails: registry not referenced
    updates[0]!.registries = [];
    expect(() => validateConfiguration(updates, registries)).toThrow(
      `Registries: 'dummy1,dummy2' have not been referenced by any update`,
    );

    // fails: registry not configured
    updates[0]!.registries = ['dummy1', 'dummy2', 'dummy3'];
    expect(() => validateConfiguration(updates, registries)).toThrow(
      `Referenced registries: 'dummy3' have not been configured in the root of dependabot.yml`,
    );
  });
});
