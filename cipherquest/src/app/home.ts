import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AVATAR_VARIANTS, GameDataService } from './game-data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="h-screen w-screen bg-void flex flex-col text-white relative overflow-hidden font-sans selection:bg-[color:var(--current-theme-color)]/30">
      <!-- Ambient Background -->
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 z-0" style="background-image: url('/background.jpg'); background-size: cover; background-position: center; opacity: 0.18; mix-blend-mode: luminosity;"></div>
        <div class="absolute top-[12%] left-[10%] w-[32vw] h-[32vw] rounded-full mix-blend-screen opacity-50 pointer-events-none animate-pulse-slow" [style.backgroundColor]="'color-mix(in srgb, var(--current-theme-color) 12%, transparent)'" style="filter: blur(160px)"></div>
        <div class="absolute bottom-[10%] right-[10%] w-[38vw] h-[38vw] rounded-full mix-blend-screen opacity-40 pointer-events-none" [style.backgroundColor]="'color-mix(in srgb, var(--current-theme-color) 8%, transparent)'" style="filter: blur(180px);"></div>
        <div class="absolute inset-0 grid-bg opacity-[0.08] pointer-events-none"></div>
        <div class="scanlines opacity-50"></div>
        <div class="absolute inset-0 bg-radial from-transparent to-black/90 pointer-events-none"></div>
      </div>

      <!-- Header -->
      <div class="relative z-10 w-full flex items-center justify-between px-10 pt-8">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 border border-[color:var(--current-theme-color)]/50 bg-surface-dark/80 flex items-center justify-center rounded shadow-[0_0_15px_color-mix(in_srgb,var(--current-theme-color)_35%,transparent)]">
            <mat-icon class="text-[color:var(--current-theme-color)]">memory</mat-icon>
          </div>
          <div>
            <div class="font-display text-3xl uppercase tracking-widest leading-none">CipherQuest</div>
            <div class="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Cipher Training Network</div>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 bg-surface-panel/70 border border-white/10 px-4 py-2 rounded">
            <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Theme</span>
            <div class="flex items-center gap-2">
              @for (variant of avatars; track variant.id) {
                <button (click)="setAvatar(variant)" class="w-5 h-5 rounded-full border border-white/20 outline-none"
                        [style.backgroundColor]="variant.colorHex"
                        [ngClass]="gameData.selectedAvatar().id === variant.id ? 'shadow-[0_0_12px_var(--current-theme-color)] border-white/60' : 'opacity-60 hover:opacity-100'"
                        [attr.aria-label]="variant.colorName"></button>
              }
            </div>
          </div>

          <div class="text-right flex flex-col items-end">
            <div class="text-[10px] uppercase font-mono tracking-[0.3em] text-white/40 mb-1">Operator</div>
            <div class="font-display text-xl uppercase tracking-widest text-[color:var(--current-theme-color)] flex items-center gap-2">
              <span [ngClass]="{'rainbow-text': gameData.isCipherMaster()}">{{ gameData.operatorName() || 'UNASSIGNED' }}</span>
              <mat-icon class="text-[20px]">{{ gameData.selectedAvatar().icon }}</mat-icon>
              @if (gameData.earnedBadges().length > 0) {
                <div class="flex items-center gap-1 ml-2 pl-2 border-l border-white/20">
                  @for (badge of gameData.earnedBadges(); track badge.id) {
                    <mat-icon class="text-[16px]" [ngClass]="{'rainbow-text': badge.id === 'badge-master'}" [title]="badge.name">{{ badge.icon }}</mat-icon>
                  }
                </div>
              }
            </div>
          </div>

          @if (gameData.isAuthenticated()) {
            <button (click)="doLogout()" class="px-4 py-2 border border-white/20 text-white/50 font-mono text-[10px] uppercase tracking-[0.2em] hover:border-accent-magenta hover:text-accent-magenta transition-all rounded">Logout</button>
          } @else {
            <button (click)="goToAuth()" class="px-4 py-2 border border-[color:var(--current-theme-color)]/50 text-[color:var(--current-theme-color)] font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-[color:var(--current-theme-color)] hover:text-black transition-all rounded">Sign In</button>
          }
        </div>
      </div>

      <!-- Hero -->
      <div class="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div class="max-w-4xl">
          <div class="font-mono text-[10px] uppercase tracking-[0.5em] text-[color:var(--current-theme-color)]/70 mb-4">> AI HINTS ONLINE // SYSTEM READY</div>
          <h1 class="font-display text-[56px] md:text-[90px] uppercase leading-none tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">Decrypt The Grid</h1>
          <p class="text-white/60 text-sm md:text-base mt-6">Master modern and classical ciphers through a mission-driven, game-style program. Train solo, enter the lab, or compete in multiplayer arenas.</p>
        </div>

        <div class="mt-10 w-full max-w-2xl">
          <label for="home-operator" class="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">> Operator Callsign</label>
          <div class="mt-3 flex flex-col sm:flex-row gap-3">
            <input id="home-operator" type="text" [(ngModel)]="operatorName" (keydown.enter)="applyOperatorName()"
                   class="flex-1 bg-surface-dark/80 border border-white/20 focus:border-[color:var(--current-theme-color)] text-white font-mono tracking-widest uppercase p-4 rounded outline-none transition-all duration-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] placeholder:text-white/10"
                   placeholder="ENTER ID..." autocomplete="off" spellcheck="false">
            <button (click)="applyOperatorName()" class="px-8 py-4 rounded font-mono text-[12px] uppercase tracking-[0.4em] border border-[color:var(--current-theme-color)]/50 text-[color:var(--current-theme-color)] hover:bg-[color:var(--current-theme-color)] hover:text-black transition-all duration-300">
              Sync
            </button>
          </div>
          @if (errorMsg()) {
             <p class="font-mono text-[11px] font-bold text-accent-magenta tracking-[0.2em] mt-3 animate-in shake">
               {{ errorMsg() }}
             </p>
          }
        </div>

        <!-- Module Grid -->
        <div class="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-6xl">
          <div class="glass-panel p-6 flex flex-col gap-4 border border-white/10">
            <div class="flex items-center justify-between">
              <mat-icon class="text-3xl text-[color:var(--current-theme-color)]">auto_stories</mat-icon>
              <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--current-theme-color)]">Story</span>
            </div>
            <div>
              <h3 class="font-display text-2xl uppercase">Story Mode</h3>
              <p class="text-white/60 text-xs mt-2">Mission-driven campaign with AI hints and badges.</p>
            </div>
            <button (click)="goToStory()" class="mt-auto px-4 py-3 border border-[color:var(--current-theme-color)]/50 text-[color:var(--current-theme-color)] uppercase tracking-widest text-[10px] hover:bg-[color:var(--current-theme-color)] hover:text-black transition-all">Enter Sector</button>
          </div>

          <div class="glass-panel p-6 flex flex-col gap-4 border border-white/10">
            <div class="flex items-center justify-between">
              <mat-icon class="text-3xl text-[color:var(--current-theme-color)]">groups</mat-icon>
              <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--current-theme-color)]">Live</span>
            </div>
            <div>
              <h3 class="font-display text-2xl uppercase">Multiplayer</h3>
              <p class="text-white/60 text-xs mt-2">Compete in real-time cipher duels and co-op races.</p>
            </div>
            <button (click)="goToMultiplayer()" class="mt-auto px-4 py-3 border border-[color:var(--current-theme-color)]/50 text-[color:var(--current-theme-color)] uppercase tracking-widest text-[10px] hover:bg-[color:var(--current-theme-color)] hover:text-black transition-all">Open Arena</button>
          </div>

          <div class="glass-panel p-6 flex flex-col gap-4 border border-white/10">
            <div class="flex items-center justify-between">
              <mat-icon class="text-3xl text-[color:var(--current-theme-color)]">science</mat-icon>
              <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--current-theme-color)]">Lab</span>
            </div>
            <div>
              <h3 class="font-display text-2xl uppercase">Cipher Lab</h3>
              <p class="text-white/60 text-xs mt-2">Explore custom ciphers and experiment with inputs.</p>
            </div>
            <button (click)="goToCipherLab()" class="mt-auto px-4 py-3 border border-[color:var(--current-theme-color)]/50 text-[color:var(--current-theme-color)] uppercase tracking-widest text-[10px] hover:bg-[color:var(--current-theme-color)] hover:text-black transition-all">Enter Lab</button>
          </div>

          <div class="glass-panel p-6 flex flex-col gap-4 border border-white/10 opacity-60">
            <div class="flex items-center justify-between">
              <mat-icon class="text-3xl text-white/40">school</mat-icon>
              <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Soon</span>
            </div>
            <div>
              <h3 class="font-display text-2xl uppercase">Tutorial</h3>
              <p class="text-white/50 text-xs mt-2">Guided lessons and onboarding flows.</p>
            </div>
            <button class="mt-auto px-4 py-3 border border-white/20 text-white/40 uppercase tracking-widest text-[10px] cursor-not-allowed">Staged</button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative z-10 px-10 pb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.4em] font-mono text-white/30">
        <span>Protocol: CQ-Home</span>
        <span>Secure Link Active</span>
      </div>
    </div>
  `
})
export class HomeComponent {
  private router = inject(Router);
  readonly gameData = inject(GameDataService);

  readonly avatars = AVATAR_VARIANTS;
  operatorName = this.gameData.operatorName();
  errorMsg = signal('');

  async applyOperatorName() {
    this.errorMsg.set('');
    const finalName = this.operatorName.trim() || 'OPERATOR';
    try {
        await this.gameData.setOperatorName(finalName);
        this.operatorName = finalName;
    } catch (e: any) {
        this.errorMsg.set(e.message);
        this.operatorName = this.gameData.operatorName();
    }
  }

  setAvatar(variant: typeof AVATAR_VARIANTS[number]) {
    this.gameData.setAvatar(variant);
  }

  goToStory() {
    this.applyOperatorName();
    this.router.navigate(['/dashboard']);
  }

  goToMultiplayer() {
    this.router.navigate(['/multiplayer']);
  }

  goToCipherLab() {
    this.router.navigate(['/cipher-lab']);
  }

  goToAuth() {
    this.router.navigate(['/auth']);
  }

  async doLogout() {
    await this.gameData.logout();
    this.operatorName = '';
  }
}

