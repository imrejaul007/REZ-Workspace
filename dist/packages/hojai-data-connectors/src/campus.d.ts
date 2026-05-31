export interface EducationSignal {
    userId: string;
    institution: string;
    program: string;
    year: number;
    performance?: {
        gpa?: number;
        engagement: number;
        completion: number;
    };
    interests?: string[];
}
export declare function emitEducationSignals(data: EducationSignal): Promise<void>;
//# sourceMappingURL=campus.d.ts.map