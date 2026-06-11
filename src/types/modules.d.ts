declare module "better-sqlite3" {
  export default class Database {
    constructor(path: string);
    pragma(source: string): unknown;
    exec(source: string): void;
  }
}

declare module "nodemailer" {
  const nodemailer: {
    createTransport(options: object): {
      sendMail(options: object): Promise<{ message: string | object }>;
    };
  };
  export default nodemailer;
}

declare module "archiver" {
  import { Stream } from "stream";
  function archiver(format: string, options?: object): Stream & {
    pipe<T extends NodeJS.WritableStream>(destination: T): T;
    append(
      source: string | Buffer,
      data?: { name?: string; mode?: number },
    ): void;
    finalize(): Promise<void>;
    on(event: string, listener: (...args: unknown[]) => void): void;
  };
  export = archiver;
}
