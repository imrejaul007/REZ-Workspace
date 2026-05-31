/**
 * Hojai Flow - Voice Layer Service
 *
 * Core voice processing:
 * - Voice Activity Detection (VAD)
 * - Language Detection
 * - Speech Recognition (ASR)
 * - Personal Dictionary
 */
export interface Transcript {
    id: string;
    text: string;
    confidence: number;
    language: string;
    timestamp: Date;
    duration: number;
    speaker?: string;
}
export interface VoiceSegment {
    start: number;
    end: number;
    audio: Buffer;
    isSpeech: boolean;
}
export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'kn' | 'ml' | 'mr' | 'pa' | 'gu' | 'or' | 'as' | 'hinglish' | 'mixed';
export interface VoiceConfig {
    sampleRate: number;
    channels: number;
    vadThreshold: number;
    minSpeechDuration: number;
    maxSilenceDuration: number;
}
export declare class VoiceService {
    private config;
    private personalDictionary;
    private languageModels;
    constructor(config?: Partial<VoiceConfig>);
    /**
     * Voice Activity Detection
     * Detects speech vs silence in audio stream
     */
    detectVoiceActivity(audioBuffer: Buffer): Promise<VoiceSegment[]>;
    /**
     * Calculate audio energy (RMS)
     */
    private calculateAudioEnergy;
    /**
     * Detect language from text
     */
    detectLanguage(text: string): SupportedLanguage;
    /**
     * Speech Recognition (ASR)
     * Note: In production, this would call an external ASR service
     * Supported: Google Speech-to-Text, Whisper, Deepgram, AssemblyAI
     */
    recognizeSpeech(audioBuffer: Buffer, language?: SupportedLanguage): Promise<Transcript>;
    /**
     * Process streaming audio
     */
    processStream(audioStream: AsyncIterable<Buffer>, onTranscript: (transcript: Transcript) => void, onSegment: (segment: VoiceSegment) => void): Promise<void>;
    /**
     * Personal Dictionary Management
     */
    addToDictionary(term: string, replacement: string): void;
    removeFromDictionary(term: string): void;
    getDictionary(): Map<string, string>;
    /**
     * Apply personal dictionary to transcript
     */
    applyDictionary(text: string): string;
    /**
     * Learn from corrections
     */
    learnCorrection(original: string, corrected: string): void;
    /**
     * Style Learning
     */
    learnStyle(text: string): void;
    getPreferredLanguage(): SupportedLanguage;
    /**
     * Batch transcript processing
     */
    processBatch(audioBuffers: Buffer[], language?: SupportedLanguage): Promise<Transcript[]>;
}
export declare const voiceService: VoiceService;
export default voiceService;
//# sourceMappingURL=voiceService.d.ts.map