"use strict";
// RisaCare - REZ Intelligence Integration Client
Object.defineProperty(exports, "__esModule", { value: true });
exports.rezIntelligenceClient = exports.REZ_INTELLIGENCE = void 0;
exports.interpretReport = interpretReport;
exports.assessSymptoms = assessSymptoms;
exports.predictIntent = predictIntent;
exports.storeHealthMemory = storeHealthMemory;
exports.getHealthHistory = getHealthHistory;
exports.trackUserSignal = trackUserSignal;
exports.getUserSignals = getUserSignals;
exports.analyzeHealthBehavior = analyzeHealthBehavior;
const utils_1 = require("../../shared/utils");
exports.REZ_INTELLIGENCE = {
    BASE_URL: process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018',
    HEALTH_EXPERT_URL: process.env.HEALTH_EXPERT_URL || 'http://localhost:3011',
    MEMORY_LAYER_URL: process.env.MEMORY_LAYER_URL || 'http://localhost:4201',
    SIGNAL_AGGREGATOR_URL: process.env.SIGNAL_AGGREGATOR_URL || 'http://localhost:4142',
    API_KEY: process.env.REZ_INTELLIGENCE_API_KEY || 'dev-api-key'
};
async function callService(url, body, method = 'POST') {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': exports.REZ_INTELLIGENCE.API_KEY
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            utils_1.logger.error('API error: ' + response.status);
            return null;
        }
        return await response.json();
    }
    catch (error) {
        utils_1.logger.error('Failed to call service: ' + url, error);
        return null;
    }
}
async function interpretReport(request) {
    const url = exports.REZ_INTELLIGENCE.HEALTH_EXPERT_URL + '/api/v1/health/health/interpret';
    const result = await callService(url, {
        recordType: request.recordType,
        reportDate: request.reportDate,
        rawText: request.rawText,
        extractedBiomarkers: request.extractedBiomarkers,
        userContext: request.userContext,
        sessionId: (0, utils_1.generateId)('sess')
    });
    if (!result) {
        return generateMockInterpretation(request);
    }
    return result;
}
async function assessSymptoms(request) {
    const url = exports.REZ_INTELLIGENCE.HEALTH_EXPERT_URL + '/api/v1/health/symptoms';
    const result = await callService(url, {
        symptoms: request.symptoms.map(s => ({ name: s.name, duration: s.duration, severity: s.severity })),
        patient: request.patient
    });
    if (!result) {
        return generateMockSymptomAssessment(request);
    }
    const urgencyMap = {
        'low': 'self_care',
        'medium': 'consult_doctor',
        'high': 'urgent_care',
        'critical': 'emergency'
    };
    return {
        urgencyLevel: urgencyMap[result.urgency] || 'self_care',
        reasoning: result.recommendations?.join('. ') || 'Assessment complete',
        recommendedSpecialties: result.specialties || [],
        confidence: 80
    };
}
async function predictIntent(userId, message) {
    const url = exports.REZ_INTELLIGENCE.HEALTH_EXPERT_URL + '/api/v1/health/intent/' + encodeURIComponent(message);
    const result = await callService(url, {});
    return {
        intent: result?.intent || 'general',
        confidence: 0.8
    };
}
async function storeHealthMemory(userId, eventType, data) {
    const url = exports.REZ_INTELLIGENCE.MEMORY_LAYER_URL + '/api/memory/store';
    return callService(url, {
        userId,
        eventType,
        data,
        timestamp: new Date().toISOString()
    });
}
async function getHealthHistory(userId, eventType, limit = 50) {
    const base = exports.REZ_INTELLIGENCE.MEMORY_LAYER_URL + '/api/timeline/' + userId;
    const url = eventType ? base + '?eventType=' + eventType + '&limit=' + limit : base + '?limit=' + limit;
    return callService(url, undefined, 'GET');
}
async function trackUserSignal(userId, signalType, properties) {
    const url = exports.REZ_INTELLIGENCE.SIGNAL_AGGREGATOR_URL + '/api/signals/track';
    return callService(url, {
        userId,
        signalType,
        properties,
        timestamp: new Date().toISOString()
    });
}
async function getUserSignals(userId, signalTypes) {
    const url = exports.REZ_INTELLIGENCE.SIGNAL_AGGREGATOR_URL + '/api/signals/user/' + userId;
    const result = await callService(url, undefined, 'GET');
    if (!result)
        return [];
    if (signalTypes && signalTypes.length > 0) {
        return result.filter(s => signalTypes.includes(s.signalType));
    }
    return result;
}
async function analyzeHealthBehavior(userId) {
    const signals = await getUserSignals(userId);
    const engagementScore = Math.min(100, signals.length * 10);
    const riskLevel = engagementScore < 30 ? 'high' : engagementScore < 70 ? 'medium' : 'low';
    return {
        engagementScore,
        riskLevel,
        insights: signals.map(s => s.signalType + ': ' + s.count + ' interactions'),
        recommendations: riskLevel === 'high' ? ['Increase health tracking engagement', 'Set regular checkup reminders'] : ['Maintain current engagement', 'Continue regular monitoring']
    };
}
function generateMockInterpretation(request) {
    const refs = request.extractedBiomarkers.map(b => {
        const min = b.referenceRange?.min || 0;
        const max = b.referenceRange?.max || 100;
        return {
            biomarker: b.name,
            value: String(b.value),
            unit: b.unit,
            referenceRange: min + '-' + max,
            status: b.status || 'normal',
            explanation: b.name + ' is ' + (b.status || 'normal') + '. Please consult your doctor for personalized advice.',
            confidence: 75,
            needsAttention: (b.status || 'normal') !== 'normal'
        };
    });
    const needsDoctor = refs.some(r => r.needsAttention);
    const hasExtreme = refs.some(r => r.status === 'high' || r.status === 'low');
    return {
        interpretations: refs,
        overallAssessment: {
            summary: 'Analyzed ' + request.extractedBiomarkers.length + ' biomarkers from ' + request.recordType,
            needsDoctorConsult: needsDoctor,
            urgency: hasExtreme ? 'medium' : 'low'
        },
        riskSignals: [],
        confidence: 75
    };
}
function generateMockSymptomAssessment(request) {
    const hasSevere = request.symptoms.some(s => s.severity === 'severe');
    return {
        urgencyLevel: hasSevere ? 'urgent_care' : 'consult_doctor',
        reasoning: 'Based on your symptoms, professional consultation is recommended',
        recommendedSpecialties: ['General Physician'],
        confidence: 70
    };
}
exports.rezIntelligenceClient = {
    health: { interpret: interpretReport, symptoms: assessSymptoms, predictIntent },
    intent: { predict: predictIntent },
    memory: { store: storeHealthMemory, history: getHealthHistory },
    signals: { track: trackUserSignal, get: getUserSignals },
    behavior: { analyze: analyzeHealthBehavior }
};
exports.default = exports.rezIntelligenceClient;
//# sourceMappingURL=index.js.map