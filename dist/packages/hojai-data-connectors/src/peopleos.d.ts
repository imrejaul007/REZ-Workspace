export interface EmploymentSignal {
    userId: string;
    employer: string;
    role: string;
    department?: string;
    salary?: number;
    tenure?: number;
    skills?: string[];
}
export declare function emitEmploymentSignals(data: EmploymentSignal): Promise<void>;
//# sourceMappingURL=peopleos.d.ts.map