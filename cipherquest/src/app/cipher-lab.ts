import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GameDataService } from './game-data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import confetti from 'canvas-confetti';

interface DailyStatus {
  slotsUsed: number;
  slotsTotal: number;
  lastPlayDate: string;
}

interface Challenge {
  id: string;
  enc: string;
  type: string;
  hint: string;
  xp: number;
}

@Component({
  selector: 'app-cipher-lab',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FormsModule],
  template: `
    <div class="h-screen w-screen bg-void flex flex-col font-sans text-white relative overflow-hidden">
      
      <!-- High End Background -->
      <div class="absolute inset-0 z-0 bg-[#050505]">
        <div class="absolute inset-0 z-0" style="background-image: url('/background.jpg'); background-size: cover; background-position: center; opacity: 0.15; mix-blend-mode: luminosity;"></div>
        <div class="absolute top-0 right-0 w-[50vw] h-[100vh] rounded-full pointer-events-none" [style.backgroundColor]="'color-mix(in srgb, var(--current-theme-color) 5%, transparent)'" style="filter: blur(200px)"></div>
        <div class="absolute bottom-0 left-0 w-[50vw] h-[50vh] rounded-full pointer-events-none" [style.backgroundColor]="'color-mix(in srgb, var(--current-theme-color) 3%, transparent)'" style="filter: blur(200px)"></div>
        <div class="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>
        <div class="absolute inset-0 bg-radial from-transparent to-black/95 pointer-events-none"></div>
      </div>
      
      <!-- Top HUD -->
      <header class="h-24 border-b border-white/5 bg-surface-dark/80 backdrop-blur-3xl flex justify-between items-center px-10 z-20 relative">
        <div class="flex items-center gap-8">
          <button routerLink="/" class="text-white/40 hover:text-white transition-all duration-300 p-2 flex items-center justify-center group outline-none">
            <div class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[color:var(--current-theme-color)] group-hover:bg-[color:var(--current-theme-color)]/10 transition-colors shadow-lg">
              <mat-icon class="text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
            </div>
            <span class="ml-4 font-sans font-bold tracking-[0.2em] text-[11px] uppercase group-hover:text-[color:var(--current-theme-color)] transition-colors">Return Home</span>
          </button>
        </div>

        <div class="flex items-center gap-8">
          <div class="flex flex-col items-end">
            <span class="font-mono text-[9px] uppercase tracking-[0.3em] text-[color:var(--current-theme-color)]">Daily Capacity //</span>
            <div class="h-1.5 w-64 bg-surface-panel overflow-hidden mt-2 flex rounded-full">
              <div class="h-full shadow-[0_0_15px_currentColor] transition-all duration-500 ease-out bg-[color:var(--current-theme-color)]" 
                   [style.width.%]="status() ? ((status()!.slotsTotal - status()!.slotsUsed) / status()!.slotsTotal) * 100 : 0"></div>
            </div>
            <span class="font-mono text-[10px] text-white/50 mt-1">{{ status() ? status()!.slotsTotal - status()!.slotsUsed : 0 }} / 5 Slots Remaining</span>
          </div>
          <div class="w-14 h-14 flex items-center justify-center glass-panel border rounded-lg transition-colors duration-500 border-[color:var(--current-theme-color)]/30">
            <mat-icon class="text-3xl transition-colors duration-500 text-[color:var(--current-theme-color)] drop-shadow-[0_0_20px_color-mix(in srgb, var(--current-theme-color) 80%, transparent)]">science</mat-icon>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto overflow-x-hidden z-10 flex flex-col items-center py-12 relative hide-scrollbar">
        <div class="w-full max-w-[1400px] px-8 flex flex-col xl:flex-row gap-16 items-stretch min-h-full">
          
          <!-- Left Column: Status / Briefing -->
          <div class="flex-1 flex flex-col w-full max-w-[400px] xl:max-w-none relative z-10">
            <div class="glass-panel p-8 flex-1 flex flex-col border border-[color:var(--current-theme-color)]/20 shadow-2xl relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-[color:var(--current-theme-color)]/5 to-transparent pointer-events-none"></div>
              
              <div class="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
                <mat-icon class="text-[color:var(--current-theme-color)] animate-[pulse_2s_infinite]">psychology</mat-icon>
                <h2 class="font-sans text-xs tracking-[0.4em] uppercase text-[color:var(--current-theme-color)] font-bold">CipherLab Daily Protocol</h2>
              </div>
              
              <div class="flex flex-col gap-8 mb-12 flex-1">
                <p class="font-mono text-sm leading-relaxed text-white/80 border-l-2 border-[color:var(--current-theme-color)] pl-4">
                  Welcome to the Syndicate Core simulation. Each day, the central mainframe generates 5 unique high-tier cipher challenges. Complete them to earn bonus XP.
                </p>
                
                @if (challenge()) {
                  <div class="mt-2 border border-[color:var(--current-theme-color)]/20 bg-[color:var(--current-theme-color)]/5 p-3 rounded">
                     <span class="text-[color:var(--current-theme-color)] font-bold tracking-[0.2em] uppercase text-[9px]">> Target Algorithm:</span>
                     <div class="text-white mt-1 font-mono text-[11px]">{{ challenge()?.type }}</div>
                  </div>
                  <div class="mt-2 border border-[color:var(--current-theme-color)]/20 bg-[color:var(--current-theme-color)]/5 p-3 rounded">
                     <span class="text-[color:var(--current-theme-color)] font-bold tracking-[0.2em] uppercase text-[9px]">> Known Pattern:</span>
                     <div class="text-white mt-1 font-mono text-[11px]">{{ challenge()?.hint }}</div>
                  </div>
                } @else if (status()?.slotsUsed === status()?.slotsTotal) {
                  <div class="text-center py-10">
                    <mat-icon class="text-4xl text-[color:var(--current-theme-color)]/50 mb-4">verified</mat-icon>
                    <p class="font-mono text-[12px] text-white/50 uppercase tracking-[0.2em]">Daily capacity reached.</p>
                    <p class="font-mono text-[10px] text-[color:var(--current-theme-color)] mt-2">Return tomorrow for new sequences.</p>
                  </div>
                } @else {
                  <div class="flex justify-center py-10">
                    <button (click)="generateChallenge()" class="bg-[color:var(--current-theme-color)] text-black font-bold uppercase tracking-[0.2em] text-[12px] px-8 py-4 rounded hover:shadow-[0_0_20px_var(--current-theme-color)] transition-all">Initialize Sequence</button>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right Column: The "Engine" / I/O -->
          <div class="flex-[1.5] flex flex-col gap-6 w-full">
            <!-- Ciphertext Display -->
            <div class="bg-surface-panel/50 border border-white/10 backdrop-blur-xl rounded-xl p-10 relative overflow-hidden shadow-xl" [ngClass]="{'opacity-50 pointer-events-none': !challenge()}">
              <div class="font-sans font-bold text-[10px] text-white/30 uppercase tracking-[0.3em] mb-6 flex justify-between">
                <span>Intercepted Ciphertext</span>
                <mat-icon class="text-[16px] text-[color:var(--current-theme-color)]">lock</mat-icon>
              </div>
              
              <div class="font-mono text-[36px] leading-[1.2] text-[color:var(--current-theme-color)] tracking-[0.1em] break-all">
                <span class="text-white/10 select-none mr-4">></span>{{ challenge()?.enc || 'AWAITING_INPUT...' }}
              </div>
            </div>

            <!-- Input Area -->
            <div class="glass-panel p-10 relative shadow-[0_40px_80px_rgba(0,0,0,0.5)] transition-all duration-500 rounded-xl" [ngClass]="{'opacity-50 pointer-events-none': !challenge() && !isSuccess()}">
              
              <div class="font-sans font-bold text-[10px] uppercase tracking-[0.3em] mb-8 flex justify-between text-[color:var(--current-theme-color)]">
                <span>Decryption Input</span>
                @if (isSuccess()) { <span>[DECRYPTED]</span> }
                @else if (challenge()) { <span class="animate-pulse">[AWAITING ANSWER]</span> }
              </div>

              <div class="relative flex items-center bg-surface-dark/50 rounded-lg p-6 border border-white/5 focus-within:border-white/20 transition-colors">
                <span class="font-mono text-[32px] text-white/20 select-none mr-4">></span>
                <input 
                  type="text"
                  [(ngModel)]="userInput"
                  (input)="userInput = userInput.toUpperCase()"
                  (keydown.enter)="!isSuccess() && verify()"
                  [disabled]="isSuccess() || !challenge()"
                  class="w-full bg-transparent text-white font-mono text-[40px] tracking-[0.1em] outline-none uppercase placeholder:text-white/10"
                  placeholder="ENTER PLAINTEXT..."
                  spellcheck="false"
                />
              </div>

              <!-- Error Display -->
              <div class="h-8 mt-6 flex items-center">
                 @if (errorMsg()) {
                   <p class="font-mono text-[12px] font-bold text-accent-magenta tracking-[0.2em] flex items-center gap-2 px-3 py-1 bg-accent-magenta/10 rounded border border-accent-magenta/20 animate-in shake">
                     <mat-icon class="text-[16px]">error_outline</mat-icon>
                     {{ errorMsg() }}
                   </p>
                 }
              </div>

              <!-- Action Button -->
              <div class="mt-8 flex justify-between items-center">
                <div class="font-mono text-[10px] text-white/50 tracking-widest uppercase">
                  @if (challenge()) { Tries Remaining: {{ 3 - tries() }} }
                </div>
                
                @if (!isSuccess()) {
                  <button (click)="verify()" [disabled]="!challenge()" class="bg-[color:var(--current-theme-color)] text-surface-dark font-sans font-bold uppercase tracking-[0.2em] text-[14px] py-5 px-14 rounded transition-all duration-300 hover:shadow-[0_0_30px_color-mix(in srgb, var(--current-theme-color) 40%, transparent)] hover:-translate-y-1 active:translate-y-0 active:scale-95 outline-none focus-visible:ring-4 ring-[color:var(--current-theme-color)]/50 disabled:opacity-50 disabled:pointer-events-none">
                    SUBMIT
                  </button>
                } @else {
                  <button (click)="nextChallenge()" class="relative overflow-hidden text-surface-dark font-sans font-bold uppercase tracking-[0.2em] text-[14px] py-5 px-14 rounded hover:bg-white transition-all duration-300 outline-none group focus-visible:ring-4"
                          [style.backgroundColor]="'var(--current-theme-color)'"
                          [style.boxShadow]="'0 0 30px color-mix(in srgb, var(--current-theme-color) 40%, transparent)'">
                    CONTINUE
                  </button>
                }
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class CipherLabComponent implements OnInit {
  router = inject(Router);
  gameData = inject(GameDataService);
  http = inject(HttpClient);

  status = signal<DailyStatus | null>(null);
  challenge = signal<Challenge | null>(null);
  userInput = '';
  errorMsg = signal('');
  isSuccess = signal(false);
  tries = signal(0);

  ngOnInit() {
    this.fetchStatus();
  }

  async fetchStatus() {
    try {
      const res = await this.http.get<DailyStatus>('/api/cipherlab/daily-status', { withCredentials: true }).toPromise();
      if (res) this.status.set(res);
    } catch (e) {
      console.error('Failed to load daily status', e);
    }
  }

  async generateChallenge() {
    this.errorMsg.set('');
    try {
      const res = await this.http.post<{ok: boolean, challenge: Challenge}>('/api/cipherlab/daily-challenge', {}, { withCredentials: true }).toPromise();
      if (res?.ok) {
        this.challenge.set(res.challenge);
        this.tries.set(0);
        this.userInput = '';
        this.isSuccess.set(false);
      }
    } catch (e: any) {
      this.errorMsg.set(e.error?.error || 'Failed to generate challenge.');
    }
  }

  async verify() {
    if (!this.challenge() || !this.userInput.trim()) return;
    this.tries.update(t => t + 1);
    this.errorMsg.set('');

    try {
      const res = await this.http.post<{ok: boolean, correct: boolean, pointsEarned: number, totalPoints: number, expectedAnswer: string | null}>('/api/cipherlab/daily-answer', {
        answer: this.userInput,
        tries: this.tries()
      }, { withCredentials: true }).toPromise();

      if (res?.ok) {
        if (res.correct) {
          this.isSuccess.set(true);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: [this.gameData.selectedAvatar().colorHex, '#ffffff'] });
          this.errorMsg.set(`Correct! +${res.pointsEarned} XP`);
          this.fetchStatus(); // update slots
        } else {
          if (this.tries() >= 3) {
            this.errorMsg.set(`FAILED. Correct answer was: ${res.expectedAnswer}`);
            this.challenge.set(null); // Force next challenge
            this.fetchStatus();
          } else {
            this.errorMsg.set('INTEGRITY FAILURE: MISMATCH DETECTED.');
            this.userInput = '';
          }
        }
      }
    } catch (e: any) {
      this.errorMsg.set(e.error?.error || 'Verification failed.');
    }
  }

  nextChallenge() {
    this.challenge.set(null);
    this.isSuccess.set(false);
    this.userInput = '';
    this.errorMsg.set('');
  }
}
