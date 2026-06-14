import BetterSqlite3 from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export class Database {
  private db: BetterSqlite3.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || process.env.DB_PATH || './data/invoices.db';
    const absolutePath = path.isAbsolute(resolvedPath)
      ? resolvedPath
      : path.join(process.cwd(), resolvedPath);

    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new BetterSqlite3(absolutePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL DEFAULT 'tax_invoice',
        status TEXT NOT NULL DEFAULT 'draft',
        invoice_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(json_extract(data, '$.customerName'));
    `);
  }

  prepare(sql: string): BetterSqlite3.Statement {
    return this.db.prepare(sql);
  }

  run(sql: string, params?: any[]): BetterSqlite3.RunResult {
    return this.db.prepare(sql).run(...(params || []));
  }

  get<T>(sql: string, ...params: any[]): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  all<T>(sql: string, ...params: any[]): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  close(): void {
    this.db.close();
  }

  backup(destination: string): void {
    this.db.backup(destination);
  }
}

export type DB = Database;
