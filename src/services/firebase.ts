import { initializeApp } from 'firebase/app';
import type { User as FirebaseUser } from 'firebase/auth';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';
import { config } from '../config';

// Firebase configuration from runtime config
const firebaseConfig = {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_AUTH_DOMAIN,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID
};

// Detect missing config (common in local dev) and avoid hard crash/blank page
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

// Initialize Firebase only when configured
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

const notConfigured = () => ({ success: false as const, error: 'Firebase 未配置：请设置 .env 或 window.__RUNTIME_CONFIG__' });

// Error message translations
const getAuthErrorMessage = (error: Error): string => {
    const errorCode = (error as { code?: string }).code || '';
    const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': '该邮箱已被注册',
        'auth/invalid-email': '邮箱格式不正确',
        'auth/operation-not-allowed': '该登录方式暂未开放',
        'auth/weak-password': '密码强度不够，请至少使用6个字符',
        'auth/user-disabled': '该账户已被禁用',
        'auth/user-not-found': '账户不存在',
        'auth/wrong-password': '密码错误',
        'auth/invalid-credential': '邮箱或密码错误',
        'auth/too-many-requests': '登录尝试次数过多，请稍后再试',
        'auth/popup-closed-by-user': '登录窗口已关闭',
        'auth/network-request-failed': '网络连接失败，请检查网络'
    };
    return errorMessages[errorCode] || error.message || '操作失败，请重试';
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
    if (!auth) return notConfigured();
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error as Error) };
    }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
    if (!auth) return notConfigured();
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error as Error) };
    }
};

// Sign in with Google
export const signInWithGoogle = async () => {
    if (!auth) return notConfigured();
    try {
        await signInWithPopup(auth, googleProvider);
        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error as Error) };
    }
};

// Send password reset email
export const sendPasswordReset = async (email: string) => {
    if (!auth) return notConfigured();
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error as Error) };
    }
};

// Sign out
export const signOut = async () => {
    if (!auth) {
        // Demo/local mode: clear demo flag and cached data
        localStorage.removeItem('rigel_demo_mode');
        localStorage.removeItem('journal_transactions_cache');
        return { success: true, error: null };
    }
    try {
        await firebaseSignOut(auth);
        // Clear all cached data on sign out
        localStorage.removeItem('journal_transactions_cache');
        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error as Error) };
    }
};

// Get current user's ID token for API calls
export const getIdToken = async (): Promise<string | null> => {
    if (!auth) return null;
    const user = auth.currentUser;
    if (!user) return null;

    try {
        return await user.getIdToken();
    } catch {
        return null;
    }
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (
    callback: (user: FirebaseUser | null) => void
) => {
    if (!auth) {
        // In local dev without firebase config, don't crash; treat as signed out.
        callback(null);
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
};

// Get current user UID - useful for cache keys
export const getCurrentUserUid = (): string | null => {
    return auth?.currentUser?.uid || null;
};
