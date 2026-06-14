import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SafeQR {
 shortcode: string;
 qrId: string;
 mode: string;
 status: string;
 stats?: {
   totalScans: number;
   uniqueScanners: number;
   totalMessages: number;
 };
 createdAt: string;
}

interface Session {
 sessionId: string;
 shortcode: string;
 mode: string;
 status: string;
 isOwner: boolean;
 unreadCount: number;
 lastMessage?: {
   content: string;
   senderRole: string;
   createdAt: string;
 };
 expiresAt: string;
 createdAt: string;
}

interface KarmaState {
 totalPoints: number;
 helpCount: number;
 level: string;
 badge: string;
 streak?: number;
}

interface FeedPost {
 postId: string;
 shortcode: string;
 mode: string;
 title: string;
 description: string;
 location?: {
   lat: number;
   lng: number;
   address?: string;
 };
 photos: string[];
 reward?: {
   amount: number;
   currency: string;
   message?: string;
 };
 owner: {
   id: string;
   name: string;
   karmaLevel?: string;
 };
 status: string;
 createdAt: string;
 expiresAt: string;
}

interface SafeQRContextType {
 // QR State
 myQRs: SafeQR[];
 setMyQRs: (qrs: SafeQR[]) => void;
 selectedQR: SafeQR | null;
 setSelectedQR: (qr: SafeQR | null) => void;

 // Session State
 sessions: Session[];
 setSessions: (sessions: Session[]) => void;
 unreadTotal: number;

 // Karma State
 karmaState: KarmaState | null;
 setKarmaState: (state: KarmaState | null) => void;

 // Feed State
 nearbyPosts: FeedPost[];
 setNearbyPosts: (posts: FeedPost[]) => void;

 // Loading State
 isLoading: boolean;
 setIsLoading: (loading: boolean) => void;

 // Error State
 error: string | null;
 setError: (error: string | null) => void;

 // Refresh Functions
 refreshQRs: () => Promise<void>;
 refreshSessions: () => Promise<void>;
 refreshKarma: () => Promise<void>;
 refreshFeed: (lat: number, lng: number) => Promise<void>;
}

const SafeQRContext = createContext<SafeQRContextType | undefined>(undefined);

export function SafeQRProvider({ children }: { children: ReactNode }) {
 const [myQRs, setMyQRs] = useState<SafeQR[]>([]);
 const [selectedQR, setSelectedQR] = useState<SafeQR | null>(null);
 const [sessions, setSessions] = useState<Session[]>([]);
 const [karmaState, setKarmaState] = useState<KarmaState | null>(null);
 const [nearbyPosts, setNearbyPosts] = useState<FeedPost[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const unreadTotal = sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);

 // Placeholder refresh functions - will be connected to API in screens
 async function refreshQRs() {
   // Will be implemented with api.getMyQRs()
 }

 async function refreshSessions() {
   // Will be implemented with api.getSessions()
 }

 async function refreshKarma() {
   // Will be implemented with api.getKarmaState()
 }

 async function refreshFeed(lat: number, lng: number) {
   // Will be implemented with api.getNearbyFeed()
 }

 return (
   <SafeQRContext.Provider
     value={{
       myQRs,
       setMyQRs,
       selectedQR,
       setSelectedQR,
       sessions,
       setSessions,
       unreadTotal,
       karmaState,
       setKarmaState,
       nearbyPosts,
       setNearbyPosts,
       isLoading,
       setIsLoading,
       error,
       setError,
       refreshQRs,
       refreshSessions,
       refreshKarma,
       refreshFeed,
     }}
   >
     {children}
   </SafeQRContext.Provider>
 );
}

export function useSafeQR() {
 const context = useContext(SafeQRContext);
 if (context === undefined) {
   throw new Error('useSafeQR must be used within a SafeQRProvider');
 }
 return context;
}
