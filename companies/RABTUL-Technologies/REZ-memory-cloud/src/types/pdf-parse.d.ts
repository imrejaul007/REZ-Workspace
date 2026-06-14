declare module 'pdf-parse' {
  interface PDFInfo {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modDate?: string;
    [key: string]: unknown;
  }

  interface PDFMeta {
    info?: PDFInfo;
    metadata?: Record<string, unknown>;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: unknown;
    text: string;
    version: string;
    getContents?: unknown;
    getPage?: unknown;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: {
      pagerender?: (pageData: { getTextContent: () => Promise<unknown> }) => Promise<string>;
      max?: number;
      version?: string;
    }
  ): Promise<PDFData>;

  export = pdfParse;
}
