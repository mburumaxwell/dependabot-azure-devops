import { PROXY_IMAGE_NAME, updaterImageName } from './docker-tags';
import { ImageService } from './image-service';

// Code below is borrowed and adapted from dependabot-action

export async function run(packageManager: string): Promise<void> {
  await ImageService.pull(updaterImageName(packageManager));
  await ImageService.pull(PROXY_IMAGE_NAME);
}

if (process.argv.length < 3) {
  console.error('Usage: pnpm fetch-images <package-manager>');
  process.exit(1);
}

await run(process.argv[2]!);
