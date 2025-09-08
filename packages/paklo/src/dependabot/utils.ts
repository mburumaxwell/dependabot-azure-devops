import stream, { type Writable } from 'node:stream';

// Code below is borrowed and adapted from dependabot-action

export const outStream = (prefix: string): Writable => {
  return new stream.Writable({
    write(chunk, _, next) {
      process.stderr.write(`${prefix} | ${chunk.toString()}`);
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
