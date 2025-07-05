'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const pathIsProtected = protectedRoutes.some((route) => pathname.startsWith(route));
    const pathIsPublic = publicRoutes.includes(pathname);
    
    if (!user && pathIsProtected) {
      router.replace('/login');
    }

    if (user && pathIsPublic) {
      router.replace('/dashboard');
    }

  }, [user, loading, pathname, router]);


  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  if (loading && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
