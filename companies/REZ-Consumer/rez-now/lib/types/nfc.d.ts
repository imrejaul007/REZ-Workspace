// Minimal Web NFC type declarations
interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}
interface NDEFMessage {
  records: NDEFRecord[];
}
interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: DataView;
  encoding?: string;
  lang?: string;
  toRecords?: () => NDEFRecord[];
}
interface NDEFReader extends EventTarget {
  onreading: ((this: NDEFReader, ev: NDEFReadingEvent) => void) | null;
  onreadingerror: ((this: NDEFReader, ev: Event) => void) | null;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(message: NDEFMessageInit | string, options?: NDEFWriteOptions): Promise<void>;
}
interface NDEFMessageInit {
  records: NDEFRecordInit[];
}
interface NDEFRecordInit {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: string | BufferSource | NDEFMessageInit;
}
interface NDEFWriteOptions {
  overwrite?: boolean;
  signal?: AbortSignal;
}
declare const NDEFReader: {
  prototype: NDEFReader;
  new (): NDEFReader;
};
