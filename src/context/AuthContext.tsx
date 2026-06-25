import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authService from "@/services/authService";
import { getUserProfile, touchLastLogin } from "@/services/userService";
import { logAudit } from "@/services/auditService";
import type { AppUser } from "@/types";

interface AuthContextValue {
  firebaseReady: boolean;
  loading: boolean;
  user: AppUser | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = authService.watchAuth(async (fbUser) => {
      if (fbUser) {
        setUid(fbUser.uid);
        const profile = await getUserProfile(fbUser.uid);
        setUser(profile);
      } else {
        setUid(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const cred = await authService.login(email, password);
      await touchLastLogin(cred.user.uid);
      await logAudit({
        userId: cred.user.uid,
        userEmail: email,
        action: "login",
        module: "auth",
        description: "Inicio de sesión",
      });
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      const msg = authService.authErrorMessage(code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
  };

  const refresh = async () => {
    if (uid) setUser(await getUserProfile(uid));
  };

  return (
    <AuthContext.Provider
      value={{ firebaseReady: true, loading, user, error, signIn, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
