/**
 * TRIPMIND - Travel AI Operating System
 * TypeScript Entry Point
 * Port: 4809
 *
 * Note: Main implementation is in index.js (CommonJS)
 * - Production: npm start (runs index.js directly)
 * - Development: npm run dev (runs index.js with nodemon)
 * - TypeScript imports: import { PORT } from './index';
 */

export const PORT = parseInt(process.env.PORT || '4809', 10);

// Re-export from CommonJS implementation
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('./index');
export default app;
