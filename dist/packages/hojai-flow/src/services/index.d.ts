/**
 * Hojai Flow - Main Entry Point
 *
 * Memory Operating System where Voice = Primary Interface
 */
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}
declare const app: import("express-serve-static-core").Express;
export { app };
export default app;
//# sourceMappingURL=index.d.ts.map