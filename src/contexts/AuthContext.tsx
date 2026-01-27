import type { User as FirebaseUser } from 'firebase/auth';
import type { ReactNode } from 'react';
import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';
import { isFirebaseConfigured, subscribeToAuthChanges } from '../services/firebase';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(() => {
        if (!isFirebaseConfigured && localStorage.getItem('rigel_demo_mode') === '1') {
            return {
                uid: 'demo',
                email: 'demo@local',
                displayName: 'Demo',
                photoURL: null
            };
        }
        return null;
    });

    const [loading, setLoading] = useState(() => {
        // If firebase isn't configured, we can determine auth state synchronously
        return isFirebaseConfigured;
    });

    useEffect(() => {
        if (!isFirebaseConfigured) return;

        const unsubscribe = subscribeToAuthChanges((firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
