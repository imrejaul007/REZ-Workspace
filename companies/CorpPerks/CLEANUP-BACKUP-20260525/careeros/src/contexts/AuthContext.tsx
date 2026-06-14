'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  skills: string[];
  role: string;
  intentProfile?: {
    primaryIntent: string;
    confidence: number;
    lastUpdated: Date;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateSkills: (skills: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// REZ Auth Service integration
const REZ_AUTH_URL = process.env.REZ_AUTH_URL || 'https://rez-auth-service.onrender.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'Demo User',
    email: 'demo@careeros.com',
    skills: ['React', 'Node.js', 'TypeScript'],
    role: 'job_seeker',
    intentProfile: {
      primaryIntent: 'career_acceleration',
      confidence: 0.85,
      lastUpdated: new Date(),
    },
  });

  const login = async (email: string, password: string) => {
    try {
      // Try REZ Auth service first
      const response = await fetch(`${REZ_AUTH_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.userId || '1',
          name: data.name || 'User',
          email,
          skills: data.skills || [],
          role: data.role || 'job_seeker',
          intentProfile: data.intentProfile,
        });
      } else {
        // Fallback to demo mode
        setUser({
          id: '1',
          name: 'Demo User',
          email,
          skills: ['React', 'Node.js', 'TypeScript'],
          role: 'job_seeker',
        });
      }
    } catch {
      // REZ Auth unavailable - use demo mode
      setUser({
        id: '1',
        name: 'Demo User',
        email,
        skills: ['React', 'Node.js', 'TypeScript'],
        role: 'job_seeker',
      });
    }
  };

  const logout = () => setUser(null);

  const updateSkills = (skills: string[]) => {
    if (user) {
      setUser({ ...user, skills });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateSkills }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
