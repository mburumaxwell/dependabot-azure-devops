import type { PackageEcosystem } from '@paklo/core/dependabot';
import {
  BazelOriginal,
  BunOriginal,
  ComposerOriginal,
  DockerOriginal,
  DotNetOriginal,
  ElmOriginal,
  GithubactionsOriginal,
  GitOriginal,
  GoOriginal,
  GradleOriginal,
  HelmOriginal,
  JuliaOriginal,
  MavenOriginal,
  NpmOriginal,
  NugetOriginal,
  PnpmOriginal,
  PoetryOriginal,
  PythonOriginal,
  RustOriginal,
  SwiftOriginal,
  TerraformOriginal,
  YarnOriginal,
} from 'devicons-react';
import { Package } from 'lucide-react';

export function EcosystemIcon({
  ecosystem,
  ...props
}: { ecosystem: string | PackageEcosystem } & React.ComponentPropsWithoutRef<'svg'>) {
  switch (ecosystem) {
    // case 'bundler':
    // case 'cargo':
    case 'composer':
      return <ComposerOriginal {...props} />;
    // case 'pub':
    case 'docker':
      return <DockerOriginal {...props} />;
    case 'elm':
      return <ElmOriginal {...props} />;
    case 'gradle':
      return <GradleOriginal {...props} />;
    case 'maven':
      return <MavenOriginal {...props} />;
    case 'nuget':
      return <NugetOriginal {...props} />;
    case 'pip':
      return <PythonOriginal {...props} />;
    case 'swift':
      return <SwiftOriginal {...props} />;
    case 'terraform':
      return <TerraformOriginal {...props} />;
    // case 'devcontainers':
    case 'bun':
      return <BunOriginal {...props} />;
    // case 'uv':
    // case 'vcpkg':
    case 'helm':
      return <HelmOriginal {...props} />;
    case 'julia':
      return <JuliaOriginal {...props} />;
    case 'bazel':
      return <BazelOriginal {...props} />;
    // case 'opentofu':
    // case 'docker-compose':
    case 'dotnet-sdk':
      return <DotNetOriginal {...props} />;
    // case 'mix':
    case 'gitsubmodule':
      return <GitOriginal {...props} />;
    case 'github-actions':
      return <GithubactionsOriginal {...props} />;
    case 'gomod':
      return <GoOriginal {...props} />;
    case 'npm':
      return <NpmOriginal {...props} />;
    case 'pip-compile':
    case 'pipenv':
      return <PythonOriginal {...props} />;
    case 'pnpm':
      return <PnpmOriginal {...props} />;
    case 'poetry':
      return <PoetryOriginal {...props} />;
    case 'rust-toolchain':
      return <RustOriginal {...props} />;
    case 'yarn':
      return <YarnOriginal {...props} />;
    default:
      return <Package {...props} />;
  }
}
