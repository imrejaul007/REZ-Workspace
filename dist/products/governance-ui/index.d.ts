/**
 * Hojai Governance UI
 * Version: 1.0 | Date: May 30, 2026 */
export interface Role {
    id: string;
    name: string;
    permissions: string[];
}
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'invited' | 'disabled';
}
export declare class GovernanceUI {
    getRoles(): Promise<{
        id: string;
        name: string;
        permissions: string[];
    }[]>;
    getUsers(): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
    }[]>;
}
export default GovernanceUI;
//# sourceMappingURL=index.d.ts.map