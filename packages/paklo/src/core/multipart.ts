import { HEADER_NAME_CONTENT_DISPOSITION, HEADER_NAME_CONTENT_TYPE } from './headers';

export class MultipartFormDataBody {
  private type = 'multipart/form-data';
  private boundary: string = `${Math.random().toString(36).substring(2)}`;
  private parts: Array<MultipartFormDataBodyPart> = [];

  public async encode(): Promise<ArrayBuffer> {
    if (this.parts.length === 0) {
      throw new Error('MultipartFormDataBody must have at least one part');
    }

    const data: Array<MultipartFormDataBodyPart['body']> = [];

    for (const part of this.parts) {
      // write boundary
      data.push(`--${this.boundary}\r\n`);

      // write headers
      for (const [key, value] of Object.entries(part.headers)) {
        data.push(`${key}: ${value}\r\n`);
      }
      data.push('\r\n');

      // write body
      data.push(part.body);
      data.push('\r\n');
    }

    data.push(`--${this.boundary}--\r\n`);

    const list: Buffer[] = [];
    for (const item of data) {
      if (item instanceof File) list.push(Buffer.from(await item.arrayBuffer()));
      else if (typeof item === 'string') list.push(Buffer.from(item, 'utf8'));
      else list.push(item);
    }
    return Buffer.concat(list).buffer;
  }

  public getBoundary(): string {
    return this.boundary;
  }

  public getContentType(): string {
    return `${this.type}; boundary=${this.boundary}`;
  }

  public add(name: string, value: string) {
    const part = createPart(name, value);
    this.parts.push(part);
  }

  public addFile(name: string, file: File) {
    const part = createPart(name, file, file.name, file.type);
    this.parts.push(part);
  }
}

type MultipartFormDataBodyPart = {
  name: string;
  headers: Record<string, string>;
  body: Buffer | File | string;
};

function createPart(
  name: string,
  body: MultipartFormDataBodyPart['body'],
  filename?: string,
  contentType?: string,
): MultipartFormDataBodyPart {
  const headers: Record<string, string> = {};
  headers[HEADER_NAME_CONTENT_DISPOSITION] = `form-data; name="${name}"${filename ? `; filename="${filename}"` : ''}`;
  if (contentType) headers[HEADER_NAME_CONTENT_TYPE] = contentType;
  return { name, headers, body };
}
