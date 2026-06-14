export const jwtAuthService = { validate: (t: string) => ({ valid: true }) };
export const extractTokenFromHeader = (h: string) => h.replace('Bearer ', '');
