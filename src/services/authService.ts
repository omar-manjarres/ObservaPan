import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/config/firebase";

export function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/** Creates a new auth credential and returns its uid. */
export async function register(email: string, password: string): Promise<string> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user.uid;
}

export function logout() {
  return signOut(auth);
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function watchAuth(cb: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, cb);
}

/** Maps Firebase auth error codes to friendly Spanish messages. */
export function authErrorMessage(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/user-disabled": "Este usuario ha sido desactivado.",
    "auth/user-not-found": "No existe una cuenta con este correo.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/missing-password": "Ingresa tu contraseña.",
    "auth/email-already-in-use": "Ya existe una cuenta con este correo.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  };
  return map[code] ?? "Ocurrió un error al iniciar sesión.";
}
