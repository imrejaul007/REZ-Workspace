import { Server as SocketIO } from 'socket.io';
import { serviceConnector } from './services/serviceConnector.js';
declare const app: import("express-serve-static-core").Express;
declare const io: SocketIO<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function emitOrderUpdate(orderId: string, update: any): void;
export declare function emitConversationUpdate(conversationId: string, update: any): void;
export { app, io, serviceConnector };
export default app;
