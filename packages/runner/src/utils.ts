import stream, { type Writable } from 'node:stream';

// Code below is borrowed and adapted from dependabot-action

export const nullStream: Writable = new stream.Writable({ write: (__, _, next) => next() });

export const outStream = (prefix: string): Writable => {
  return new stream.Writable({
    write(chunk, _, next) {
      process.stdout.write(`${prefix} | ${chunk.toString()}`);
      next();
    },
  });
};

export const errStream = (prefix: string): Writable => {
  return new stream.Writable({
    write(chunk, _, next) {
      process.stderr.write(`${prefix} | ${chunk.toString()}`);
      next();
    },
  });
};

/**
 * Extracts the SHA from an updater image string.
 * @param updaterImage - Image string in the format "image:sha" or "registry/image:sha"
 * @returns The SHA part after the last colon, or null if no colon is found
 */
export const extractUpdaterSha = (updaterImage: string): string | null => {
  const match = updaterImage.match(/:([^:]*)$/);
  return match ? match[1]! : null;
};
