import { defineConfig, type Options } from 'tsup';

const base: Options = {
  format: 'cjs',
  target: 'node22',
  platform: 'node',
  splitting: false,
  clean: true,
  dts: true, // required to make watch work
  sourcemap: true,
  noExternal: [/^(?!cpu-features|ssh2|dockerode).*$/], // ⬅️ bundle everything everything except native modules
  external: ['cpu-features', 'ssh2', 'dockerode'],
};

export default defineConfig([
  // each task is downloaded as a folder so it must have everything
  { ...base, entry: ['src/task-v1.ts'], outDir: 'tasks/dependabotV1/dist' },
  { ...base, entry: ['src/task-v2.ts'], outDir: 'tasks/dependabotV2/dist' },
  { ...base, entry: ['src/task-v2-pre.ts'], outDir: 'tasks/dependabotV2/dist' },
]);
