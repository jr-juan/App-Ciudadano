import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseDB } from './firebase.config';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  createdAt: unknown;
  emailVerified: boolean;
  photoURL: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$ = new BehaviorSubject<User | null>(null);
  authReady$ = new BehaviorSubject(false);
  loading$ = new BehaviorSubject(true);

  private readonly ATTEMPTS_KEY = 'auth_failed_attempts';
  private readonly LOCK_KEY = 'auth_lock_until';
  private readonly LOCK_MINUTES = 10;

  constructor(private router: Router) {
    onAuthStateChanged(firebaseAuth, (user) => {
      this.user$.next(user);
      this.loading$.next(false);
      this.authReady$.next(true);
    });
  }

  get currentUser(): User | null {
    return firebaseAuth.currentUser;
  }

  async register(fullName: string, email: string, password: string): Promise<User> {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const credentials = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const user = credentials.user;
    await updateProfile(user, { displayName: fullName, photoURL: null });

    await setDoc(doc(firebaseDB, 'users', user.uid), {
      uid: user.uid,
      displayName: fullName,
      email: user.email,
      createdAt: serverTimestamp(),
      emailVerified: user.emailVerified,
      photoURL: null,
    });

    await sendEmailVerification(user);
    return user;
  }

  async login(email: string, password: string, rememberMe: boolean): Promise<User> {
    if (this.isLoginLocked()) {
      throw new Error('Cuenta bloqueada temporalmente. Intenta de nuevo más tarde.');
    }

    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(firebaseAuth, persistence);
    const credentials = await signInWithEmailAndPassword(firebaseAuth, email, password);
    this.resetFailedLoginAttempts();
    return credentials.user;
  }

  async loginWithGoogle(): Promise<User> {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    const credentials = await signInWithPopup(firebaseAuth, provider);
    const user = credentials.user;

    const userDoc = await getDoc(doc(firebaseDB, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(firebaseDB, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName ?? 'Usuario',
        email: user.email,
        createdAt: serverTimestamp(),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL ?? null,
      });
    }

    this.resetFailedLoginAttempts();
    return user;
  }

  async resendVerificationEmail(user?: User): Promise<void> {
    const current = user ?? this.currentUser;
    if (!current) {
      throw new Error('No hay usuario autenticado.');
    }
    if (current.emailVerified) {
      return;
    }
    await sendEmailVerification(current);
  }

  async forgotPassword(email: string): Promise<void> {
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/login`,
      handleCodeInApp: false,
    };
    await sendPasswordResetEmail(firebaseAuth, email, actionCodeSettings);
  }

  async signOut(): Promise<void> {
    await signOut(firebaseAuth);
    this.router.navigate(['/auth/login']);
  }

  incrementFailedLoginAttempt(): void {
    const attempts = this.failedLoginAttempts + 1;
    localStorage.setItem(this.ATTEMPTS_KEY, String(attempts));
    if (attempts >= 5) {
      const lockUntil = Date.now() + this.LOCK_MINUTES * 60000;
      localStorage.setItem(this.LOCK_KEY, String(lockUntil));
    }
  }

  resetFailedLoginAttempts(): void {
    localStorage.removeItem(this.ATTEMPTS_KEY);
    localStorage.removeItem(this.LOCK_KEY);
  }

  get failedLoginAttempts(): number {
    return Number(localStorage.getItem(this.ATTEMPTS_KEY) || 0);
  }

  isLoginLocked(): boolean {
    const lockUntil = Number(localStorage.getItem(this.LOCK_KEY) || 0);
    if (!lockUntil) {
      return false;
    }
    if (Date.now() >= lockUntil) {
      this.resetFailedLoginAttempts();
      return false;
    }
    return true;
  }

  getLockRemainingMinutes(): number {
    const lockUntil = Number(localStorage.getItem(this.LOCK_KEY) || 0);
    if (!lockUntil) {
      return 0;
    }
    const remaining = Math.ceil((lockUntil - Date.now()) / 60000);
    return remaining > 0 ? remaining : 0;
  }

  getErrorMessage(error: any): string {
    const code = error?.code ?? error?.message ?? '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'El correo ya está en uso. Usa otro correo o inicia sesión.';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil. Usa al menos 8 caracteres con mayúsculas, números y símbolos.';
      case 'auth/invalid-email':
        return 'El correo no es válido.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Correo o contraseña incorrectos.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Intenta de nuevo más tarde.';
      default:
        return 'Ocurrió un error inesperado. Intenta nuevamente.';
    }
  }
}
