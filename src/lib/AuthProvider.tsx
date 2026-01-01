'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/registration', '/admin'];

// Routes that authenticated users should be redirected away from
const authRoutes = ['/', '/login', '/registration'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Handle redirects based on auth state
            if (session?.user) {
                // User is authenticated
                if (authRoutes.includes(pathname)) {
                    router.push('/games/aviator');
                }
            } else {
                // User is not authenticated
                if (!publicRoutes.includes(pathname)) {
                    router.push('/');
                }
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                if (event === 'SIGNED_IN') {
                    router.push('/games/aviator');
                } else if (event === 'SIGNED_OUT') {
                    router.push('/');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [pathname, router]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
