declare module 'json2csv' {
  export function parse<T>(data: T[], options?: object): string;
  export const Parser: new (options?: object) => { parse: (data: unknown[]) => string };
}
