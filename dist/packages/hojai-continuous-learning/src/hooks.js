/**
 * HOJAI Learning Hooks
 * Import into any service to enable auto-learning
 *
 * Usage:
 *   import { addLearningHooks } from './hooks';
 *   addLearningHooks(app);
 */
import axios from 'axios';
const LEARNING_URL = process.env.LEARNING_URL || 'http://localhost:4891';
// ============================================
// LEARNING FROM CHAT
// ============================================
export async function learnFromChat(data) {
    try {
        await axios.post(`${LEARNING_URL}/learn/chat`, data);
    }
    catch (e) {
        console.error('Learning failed:', e);
    }
}
// ============================================
// LEARNING FROM SIGNAL
// ============================================
export async function learnFromSignal(data) {
    try {
        await axios.post(`${LEARNING_URL}/learn/signal`, data);
    }
    catch (e) {
        console.error('Learning failed:', e);
    }
}
// ============================================
// LEARNING FROM EVENT
// ============================================
export async function learnFromEvent(data) {
    try {
        await axios.post(`${LEARNING_URL}/learn/event`, data);
    }
    catch (e) {
        console.error('Learning failed:', e);
    }
}
// ============================================
// LEARNING FROM CONVERSION
// ============================================
export async function learnFromConversion(data) {
    try {
        await axios.post(`${LEARNING_URL}/learn/conversion`, data);
    }
    catch (e) {
        console.error('Learning failed:', e);
    }
}
// ============================================
// LEARNING FROM CORRECTION
// ============================================
export async function learnFromCorrection(data) {
    try {
        await axios.post(`${LEARNING_URL}/learn/correction`, data);
    }
    catch (e) {
        console.error('Learning failed:', e);
    }
}
// ============================================
// BATCH LEARNING
// ============================================
export async function learnEverything(data) {
    try {
        await axios.post(`${LEARNING_URL}/learn/batch`, data);
    }
    catch (e) {
        console.error('Batch learning failed:', e);
    }
}
// ============================================
// EXPRESS MIDDLEWARE
// ============================================
export function learningMiddleware(req, res, next) {
    const startTime = Date.now();
    // Store original json
    const originalJson = res.json.bind(res);
    // Override json to capture responses
    res.json = function (data) {
        const duration = Date.now() - startTime;
        // Learn from chat if it's a chat response
        if (req.path.includes('/chat') || req.path.includes('/message')) {
            learnFromChat({
                intent: req.body?.intent || 'unknown',
                query: req.body?.query || req.body?.message || '',
                response: typeof data === 'string' ? data : JSON.stringify(data),
                success: res.statusCode < 400,
                duration
            });
        }
        return originalJson(data);
    };
    next();
}
// ============================================
// CHAT SERVICE HOOK
// ============================================
export function addChatLearningHooks(app) {
    // After chat response
    app.use((req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            // Learn from conversation
            if (req.body?.message) {
                learnFromChat({
                    intent: req.body.intent || 'chat',
                    query: req.body.message,
                    response: typeof data === 'string' ? data : JSON.stringify(data),
                    success: res.statusCode < 400
                });
            }
            return originalSend(data);
        };
        next();
    });
}
// ============================================
// SIGNAL SERVICE HOOK
// ============================================
export function addSignalLearningHooks(app) {
    // After signal processing
    app.post('/api/signals', async (req, res) => {
        const result = res.locals?.result; // capture result before sending
        // Learn from signal
        await learnFromSignal({
            signalType: req.body.type,
            userAction: req.body.action,
            outcome: req.body.confidence > 0.8 ? 'success' : 'low',
            confidence: req.body.confidence
        });
        return res.send;
    });
}
// ============================================
// EVENT SERVICE HOOK
// ============================================
export function addEventLearningHooks() {
    return async (event) => {
        await learnFromEvent({
            eventType: event.type,
            context: event.data,
            success: event.success !== false
        });
    };
}
// ============================================
// CORRECTION HOOK
// ============================================
export function addCorrectionHook() {
    return async (data) => {
        await learnFromCorrection(data);
    };
}
// ============================================
// WORKFORCE HOOK
// ============================================
export function addWorkforceLearningHooks() {
    return {
        onTaskComplete: async (task) => {
            await learnFromConversion({
                trigger: 'task_completion',
                action: task.type,
                result: task.success ? 'converted' : 'failed',
                revenue: task.value
            });
        },
        onLevelUp: async (employee) => {
            await learnFromEvent({
                eventType: 'ai_level_up',
                context: { employeeId: employee.id, level: employee.level },
                success: true
            });
        }
    };
}
// ============================================
// GET ALL LEARNINGS
// ============================================
export async function getAllLearnings() {
    try {
        const response = await axios.get(`${LEARNING_URL}/learn/all`);
        return response.data;
    }
    catch (e) {
        console.error('Failed to get learnings:', e);
        return null;
    }
}
//# sourceMappingURL=hooks.js.map