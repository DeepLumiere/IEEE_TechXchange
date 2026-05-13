import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase-client';
import { GameDataService } from './game-data.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="h-screen w-screen bg-void flex flex-col text-white relative overflow-y-auto overflow-x-hidden font-sans selection:bg-[color:var(--current-theme-color)]/30">
      <!-- Background -->
      <div class="fixed inset-0 z-0">
        <div class="absolute inset-0" style="background-image: url('/background.jpg'); background-size: cover; background-position: center; opacity: 0.12; mix-blend-mode: luminosity;"></div>
        <div class="absolute top-[15%] left-[15%] w-[35vw] h-[35vw] rounded-full mix-blend-screen opacity-40 pointer-events-none" style="background-color: color-mix(in srgb, var(--current-theme-color) 10%, transparent); filter: blur(160px)"></div>
        <div class="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full mix-blend-screen opacity-30 pointer-events-none" style="background-color: color-mix(in srgb, var(--current-theme-color) 8%, transparent); filter: blur(180px)"></div>
        <div class="absolute inset-0 grid-bg opacity-[0.06] pointer-events-none"></div>
        <div class="scanlines opacity-40"></div>
        <div class="absolute inset-0 bg-radial from-transparent to-black/90 pointer-events-none"></div>
      </div>

      <!-- Header -->
      <div class="relative z-10 w-full flex items-center justify-between px-6 md:px-10 pt-8 shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 border border-[color:var(--current-theme-color)]/50 bg-surface-dark/80 flex items-center justify-center rounded shadow-[0_0_15px_color-mix(in_srgb,var(--current-theme-color)_35%,transparent)] hidden sm:flex">
            <mat-icon class="text-[color:var(--current-theme-color)]">memory</mat-icon>
          </div>
          <div>
            <div class="font-display text-2xl sm:text-3xl uppercase tracking-widest leading-none">CipherQuest</div>
            <div class="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Secure Authentication</div>
          </div>
        </div>
        <button (click)="goHome()" class="text-[10px] uppercase tracking-[0.3em] font-mono text-white/50 hover:text-white transition-colors">Return Home</button>
      </div>

      <!-- Auth Card -->
      <div class="relative z-10 flex-1 flex items-center justify-center px-4 py-12 min-h-max">
        <div class="glass-panel p-8 md:p-10 w-full border border-white/10 transition-all duration-300" [ngClass]="mode === 'register' ? 'max-w-2xl' : 'max-w-lg'">
          <div class="font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--current-theme-color)] mb-2">> {{ mode === 'login' ? 'Secure Link' : 'Recruit Protocol' }}</div>
          <h1 class="font-display text-3xl md:text-4xl uppercase mb-2">{{ mode === 'login' ? 'Welcome Back' : 'Create Account' }}</h1>
          <p class="text-white/50 text-sm mb-8">{{ mode === 'login' ? 'Sign in to continue your mission.' : 'Set your callsign and credentials to begin.' }}</p>

          <div [ngClass]="mode === 'register' ? 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-8' : 'space-y-4 mb-8'">
            <!-- Username (register only) -->
            @if (mode === 'register') {
              <div>
                <label class="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2 block">Operative Callsign</label>
                <input type="text" [(ngModel)]="username" (ngModelChange)="onUsernameChange($event)"
                       class="w-full bg-surface-dark/80 border border-white/20 focus:border-[color:var(--current-theme-color)] text-white font-mono tracking-widest uppercase p-4 rounded outline-none transition-all duration-300 placeholder:text-white/10"
                       placeholder="ENTER CALLSIGN..." maxlength="24" autocomplete="off" spellcheck="false"
                       (keydown.enter)="submitAuth()">
                <div class="font-mono text-[10px] mt-1 px-1 h-4" [ngClass]="usernameStatusType() === 'available' ? 'text-green-400' : usernameStatusType() === 'checking' ? 'text-yellow-400' : 'text-accent-magenta'">
                  {{ usernameStatus() }}
                </div>
              </div>
            }

            <!-- Email -->
            <div>
              <label class="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2 block">Email</label>
              <input type="email" [(ngModel)]="email"
                     class="w-full bg-surface-dark/80 border border-white/20 focus:border-[color:var(--current-theme-color)] text-white font-mono tracking-wider p-4 rounded outline-none transition-all duration-300 placeholder:text-white/10"
                     placeholder="you@example.com" autocomplete="email"
                     (keydown.enter)="submitAuth()">
              @if (mode === 'register') { <div class="h-4 mt-1"></div> }
            </div>

            <!-- Password -->
            <div>
              <label class="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2 block">Password</label>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password"
                       class="w-full bg-surface-dark/80 border border-white/20 focus:border-[color:var(--current-theme-color)] text-white font-mono tracking-wider p-4 pr-12 rounded outline-none transition-all duration-300 placeholder:text-white/10"
                       placeholder="Min 6 characters" minlength="6"
                       (keydown.enter)="submitAuth()">
                <button (click)="showPassword = !showPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  <mat-icon class="text-[18px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <!-- Confirm Password (register only) -->
            @if (mode === 'register') {
              <div>
                <label class="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2 block">Confirm Password</label>
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="confirmPassword"
                       class="w-full bg-surface-dark/80 border border-white/20 focus:border-[color:var(--current-theme-color)] text-white font-mono tracking-wider p-4 rounded outline-none transition-all duration-300 placeholder:text-white/10"
                       placeholder="Re-enter password" minlength="6"
                       (keydown.enter)="submitAuth()">
              </div>
            }
          </div>

          <!-- Submit Button -->
          <button (click)="submitAuth()" [disabled]="busy()"
                  class="w-full px-8 py-4 rounded font-mono text-[12px] uppercase tracking-[0.4em] border border-[color:var(--current-theme-color)]/50 text-[color:var(--current-theme-color)] hover:bg-[color:var(--current-theme-color)] hover:text-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed mb-4">
            {{ busy() ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account') }}
          </button>

          <!-- Divider -->
          <div class="flex items-center gap-4 my-4">
            <div class="flex-1 h-px bg-white/10"></div>
            <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">or</span>
            <div class="flex-1 h-px bg-white/10"></div>
          </div>

          <!-- Google Sign-In -->
          <button (click)="googleAuth()" [disabled]="busy()"
                  class="w-full px-8 py-4 rounded font-mono text-[12px] uppercase tracking-[0.2em] border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6">
            <svg class="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <!-- Error -->
          @if (errorMsg()) {
            <div class="font-mono text-[11px] text-accent-magenta bg-accent-magenta/10 border border-accent-magenta/20 px-4 py-3 rounded mb-4 flex items-center gap-2">
              <mat-icon class="text-[16px]">error_outline</mat-icon>
              {{ errorMsg() }}
            </div>
          }

          <!-- Toggle -->
          <div class="text-center text-sm text-white/40">
            {{ mode === 'login' ? "Don't have an account? " : "Already have an account? " }}
            <button (click)="toggleMode()" class="text-[color:var(--current-theme-color)] hover:underline">{{ mode === 'login' ? 'Register' : 'Log in' }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuthComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private http = inject(HttpClient);
  readonly gameData = inject(GameDataService);

  mode: 'login' | 'register' = 'login';
  email = '';
  password = '';
  confirmPassword = '';
  username = '';
  showPassword = false;

  busy = signal(false);
  errorMsg = signal('');
  usernameStatus = signal('');
  usernameStatusType = signal<'available' | 'taken' | 'checking' | 'error' | null>(null);
  isUsernameAvailable = false;

  private usernameCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private lastCheckedUsername = '';

  ngOnInit() {
    this.gameData.checkAuthStatus().then(authed => {
      if (authed) this.router.navigate(['/']);
    });
  }

  ngOnDestroy() {
    if (this.usernameCheckTimer) clearTimeout(this.usernameCheckTimer);
  }

  goHome() { this.router.navigate(['/']); }

  toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.errorMsg.set('');
  }

  onUsernameChange(val: string) {
    this.isUsernameAvailable = false;
    if (this.usernameCheckTimer) clearTimeout(this.usernameCheckTimer);
    if (!val.trim()) {
      this.usernameStatus.set('');
      this.usernameStatusType.set(null);
      this.lastCheckedUsername = '';
      return;
    }
    this.usernameCheckTimer = setTimeout(() => this.checkUsername(val.trim()), 400);
  }

  async checkUsername(val: string) {
    if (!/^[a-zA-Z0-9_ ]{3,24}$/.test(val)) {
      this.isUsernameAvailable = false;
      this.usernameStatus.set(val.length < 3 ? 'At least 3 characters required.' : 'Only letters, numbers, spaces, or _ allowed.');
      this.usernameStatusType.set('error');
      return;
    }
    const lower = val.toLowerCase();
    if (lower === this.lastCheckedUsername) return;
    this.lastCheckedUsername = lower;
    this.usernameStatus.set('Checking...');
    this.usernameStatusType.set('checking');
    try {
      const data = await fetch(`/api/auth/check-username?username=${encodeURIComponent(val)}`, { credentials: 'include' }).then(r => r.json());
      if (val.toLowerCase() !== this.lastCheckedUsername) return;
      if (data.available) {
        this.isUsernameAvailable = true;
        this.usernameStatus.set('✓ Username available');
        this.usernameStatusType.set('available');
      } else {
        this.isUsernameAvailable = false;
        this.usernameStatus.set('✗ Username already taken');
        this.usernameStatusType.set('taken');
      }
    } catch {
      this.usernameStatus.set('Could not check. Try again.');
      this.usernameStatusType.set('error');
      this.isUsernameAvailable = false;
    }
  }

  async submitAuth() {
    this.errorMsg.set('');
    const mail = this.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { this.errorMsg.set('Please enter a valid email address.'); return; }
    if (this.password.length < 6) { this.errorMsg.set('Password must be at least 6 characters.'); return; }
    if (this.mode === 'register') {
      if (!/^[a-zA-Z0-9_ ]{3,24}$/.test(this.username.trim())) { this.errorMsg.set('Callsign must be 3-24 chars (letters, numbers, spaces, or _).'); return; }
      if (!this.isUsernameAvailable) { this.errorMsg.set('Please choose an available callsign.'); return; }
      if (this.password !== this.confirmPassword) { this.errorMsg.set('Passwords do not match.'); return; }
    }
    this.busy.set(true);
    try {
      if (this.mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, mail, this.password);
        const idToken = await cred.user.getIdToken();
        await this.callApi('/api/auth/register', { idToken, username: this.username.trim() });
        await this.gameData.checkAuthStatus();
        this.router.navigate(['/']);
      } else {
        const cred = await signInWithEmailAndPassword(auth, mail, this.password);
        const idToken = await cred.user.getIdToken();
        await this.callApi('/api/auth/login', { idToken });
        await this.gameData.checkAuthStatus();
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      this.errorMsg.set(this.mapFirebaseError(error));
    } finally {
      this.busy.set(false);
    }
  }

  async googleAuth() {
    this.errorMsg.set('');
    if (this.mode === 'register') {
      if (!/^[a-zA-Z0-9_ ]{3,24}$/.test(this.username.trim())) { this.errorMsg.set('Please set a callsign first (3-24 chars).'); return; }
      if (!this.isUsernameAvailable) { this.errorMsg.set('Please choose an available callsign.'); return; }
    }
    this.busy.set(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      if (this.mode === 'register') {
        await this.callApi('/api/auth/register', { idToken, username: this.username.trim() });
      } else {
        await this.callApi('/api/auth/login', { idToken });
      }
      await this.gameData.checkAuthStatus();
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMsg.set(this.mapFirebaseError(error));
    } finally {
      this.busy.set(false);
    }
  }

  private async callApi(path: string, payload: any) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  private mapFirebaseError(error: any): string {
    const code = error?.code || '';
    const map: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered. Try logging in.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
      'auth/user-not-found': 'No account found with this email. Register first.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return map[code] || error?.message || 'Authentication failed.';
  }
}
