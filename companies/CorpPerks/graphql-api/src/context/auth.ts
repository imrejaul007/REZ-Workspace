import { ContextFunction } from '@apollo/server';
import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { verify } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { Employee, IEmployee } from '../models/index.js';

export interface GraphQLContext {
  user?: IEmployee;
}

export const context: ContextFunction<ExpressContextFunctionArgument, GraphQLContext> = async ({ req, res }) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
        role: string;
      };

      const user = await Employee.findById(decoded.userId);
      return { user: user || undefined };
    } catch {
      // Invalid token, continue without user
      return {};
    }
  }

  return {};
};

// Helper to extract user from context
export function getUserFromContext(context: GraphQLContext): IEmployee | null {
  return context.user || null;
}
