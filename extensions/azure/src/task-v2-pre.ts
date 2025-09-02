import { spawn } from 'node:child_process';
import * as path from 'node:path';

async function installDockerodeGlobally(): Promise<void> {
  console.log('Installing dockerode and dependencies globally...');
  const packages = ['dockerode'];

  return new Promise((resolve, reject) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const args = ['install', '-g', ...packages];

    console.log(`Running: ${npm} ${args.join(' ')}`);

    const child = spawn(npm, args, {
      stdio: 'inherit', // Show output in real-time
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Successfully installed dockerode and dependencies globally');
        resolve();
      } else {
        console.error(`❌ npm install failed with exit code ${code}`);
        reject(new Error(`npm install failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error('❌ Failed to spawn npm process:', error);
      reject(error);
    });
  });
}

async function installDockerodeToPath(): Promise<void> {
  console.log('Installing dockerode to custom path...');

  const installDir = path.join(process.cwd(), 'node_modules_global');
  const packages = ['dockerode'];

  return new Promise((resolve, reject) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const args = ['install', '--prefix', installDir, ...packages];

    console.log(`Running: ${npm} ${args.join(' ')}`);

    const child = spawn(npm, args, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Update NODE_PATH to include the new modules
        const modulesPath = path.join(installDir, 'node_modules');
        const currentNodePath = process.env.NODE_PATH || '';
        const newNodePath = currentNodePath ? `${currentNodePath}${path.delimiter}${modulesPath}` : modulesPath;

        process.env.NODE_PATH = newNodePath;

        // Force Node.js to reload the module paths
        if (require.cache) {
          delete require.cache[require.resolve('module')];
        }

        console.log('✅ Successfully installed dockerode to custom path');
        console.log(`📁 NODE_PATH updated to include: ${modulesPath}`);
        resolve();
      } else {
        console.error(`❌ npm install failed with exit code ${code}`);
        reject(new Error(`npm install failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error('❌ Failed to spawn npm process:', error);
      reject(error);
    });
  });
}

async function main(): Promise<void> {
  try {
    // Try global install first, fall back to custom path if it fails
    try {
      await installDockerodeGlobally();
    } catch (globalError) {
      console.warn('Global install failed, trying custom path installation...');
      await installDockerodeToPath();
    }

    console.log('🚀 Ready to run main task');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error);
    process.exit(1);
  }
}

main();
