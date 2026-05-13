import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GameDataService } from './game-data.service';
import confetti from 'canvas-confetti';

interface SearchResult { uid: string; username: string; }
interface Invite { inviteId: string; fromUid: string; fromUsername: string; roundCount: number; }
interface LeaderboardEntry { uid: string; callsign: string; points: number; }
interface RoundResult { round: number; winnerUid: string | null; xp: number; }
interface MatchData {
  matchId: string; question: string; cipherType: string; cipherHint: string;
  status: 'open' | 'done'; myAnswered: boolean; opponentAnswered: boolean;
  myTries: number; opponentTries: number;
  totalRounds: number; currentRound: number;
  scores: Record<string, number>; roundResults: RoundResult[];
  winnerUid: string | null; loserUid: string | null; resultReason: string | null;
  xpReward: number; usernames: Record<string, string>; uids: string[];
}

@Component({
  selector: 'app-multiplayer',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-screen w-screen bg-void flex flex-col text-white relative overflow-hidden font-sans selection:bg-[color:var(--current-theme-color)]/30">
      <!-- Background -->
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0" style="background-image: url('/background.jpg'); background-size: cover; background-position: center; opacity: 0.12; mix-blend-mode: luminosity;"></div>
        <div class="absolute top-[10%] left-[5%] w-[35vw] h-[35vw] rounded-full mix-blend-screen opacity-40 pointer-events-none" style="background-color: color-mix(in srgb, var(--current-theme-color) 10%, transparent); filter: blur(160px)"></div>
        <div class="absolute bottom-[5%] right-[5%] w-[40vw] h-[40vw] rounded-full mix-blend-screen opacity-30 pointer-events-none" style="background-color: color-mix(in srgb, var(--current-theme-color) 8%, transparent); filter: blur(180px)"></div>
        <div class="absolute inset-0 grid-bg opacity-[0.08] pointer-events-none"></div>
        <div class="scanlines opacity-40"></div>
        <div class="absolute inset-0 bg-radial from-transparent to-black/90 pointer-events-none"></div>
      </div>

      <!-- Header -->
      <div class="relative z-10 flex items-center justify-between px-10 pt-8">
        <div class="flex items-center gap-3">
          <mat-icon class="text-[color:var(--current-theme-color)]">groups</mat-icon>
          <span class="font-display text-2xl uppercase tracking-widest">Multiplayer Duel</span>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-right flex flex-col items-end">
            <div class="text-[10px] uppercase font-mono tracking-[0.3em] text-white/40 mb-1">Operator</div>
            <div class="font-display text-lg uppercase tracking-widest text-[color:var(--current-theme-color)] flex items-center gap-2">
              <span [ngClass]="{'rainbow-text': gameData.isCipherMaster()}">{{ gameData.operatorName() || 'UNASSIGNED' }}</span>
              <mat-icon class="text-[18px]">{{ gameData.selectedAvatar().icon }}</mat-icon>
              @if (gameData.earnedBadges().length > 0) {
                <div class="flex items-center gap-1 ml-2 pl-2 border-l border-white/20">
                  @for (badge of gameData.earnedBadges(); track badge.id) {
                    <mat-icon class="text-[14px]" [ngClass]="{'rainbow-text': badge.id === 'badge-master'}" [title]="badge.name">{{ badge.icon }}</mat-icon>
                  }
                </div>
              }
            </div>
          </div>
          <button class="flex items-center gap-2 px-6 py-2 bg-surface-panel/80 hover:bg-surface-panel transition-all rounded outline-none" 
                   [style.borderColor]="'color-mix(in srgb, var(--current-theme-color) 20%, transparent)'"
                   [style.borderWidth]="'1px'"
                   [style.boxShadow]="'0 0 10px rgba(0,0,0,0.5)'"
                   (click)="goHome()">
               <mat-icon class="text-[18px] text-[color:var(--current-theme-color)]">home</mat-icon>
               <span class="font-mono text-[10px] text-white tracking-widest uppercase">Return to Nexus</span>
           </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="relative z-10 flex-1 overflow-y-auto px-8 py-8 hide-scrollbar">
        <div class="w-full space-y-8">

          <!-- Lobby (always visible when no active match) -->
          @if (!match()) {
            <!-- Hero Banner -->
            <div class="glass-panel border border-[color:var(--current-theme-color)]/20 p-10 relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-[color:var(--current-theme-color)]/10 via-transparent to-accent-magenta/5 pointer-events-none"></div>
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[color:var(--current-theme-color)] to-accent-magenta shadow-[0_0_15px_var(--current-theme-color)]"></div>
              <div class="absolute top-0 right-0 w-64 h-64 bg-[color:var(--current-theme-color)]/10 blur-[120px] pointer-events-none"></div>
              <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-6">
                  <div class="w-20 h-20 bg-surface-dark border border-[color:var(--current-theme-color)]/50 flex items-center justify-center rounded-lg shadow-[0_0_25px_color-mix(in_srgb,var(--current-theme-color)_40%,transparent)] relative overflow-hidden">
                    <div class="absolute inset-0 bg-[color:var(--current-theme-color)]/10 animate-[pulse_3s_ease-in-out_infinite]"></div>
                    <mat-icon class="text-4xl text-[color:var(--current-theme-color)] drop-shadow-[0_0_10px_var(--current-theme-color)]">{{ gameData.selectedAvatar().icon }}</mat-icon>
                  </div>
                  <div>
                    <div class="font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--current-theme-color)] mb-1 flex items-center gap-2">
                      > Arena Operative
                      @if (gameData.operatorName().toUpperCase() === 'ADMIN') {
                        <span class="px-2 py-0.5 bg-accent-magenta/20 border border-accent-magenta/50 text-accent-magenta text-[8px] font-bold rounded animate-pulse">ADMIN</span>
                      }
                    </div>
                    <h2 class="font-display text-4xl uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{{ gameData.operatorName() || 'UNASSIGNED' }}</h2>
                  </div>
                </div>
                <div class="flex items-center gap-8">
                  <div class="text-center">
                    <div class="font-display text-3xl text-[color:var(--current-theme-color)] drop-shadow-[0_0_8px_var(--current-theme-color)]">{{ gameData.authProfile()?.xp || 0 }}</div>
                    <div class="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">Total XP</div>
                  </div>
                  <div class="w-px h-10 bg-white/10"></div>
                  <div class="text-center">
                    <div class="font-display text-3xl text-white">{{ gameData.authProfile()?.level || 1 }}</div>
                    <div class="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">Level</div>
                  </div>
                  <div class="w-px h-10 bg-white/10"></div>
                  <div class="text-center">
                    <div class="font-display text-3xl text-accent-magenta">{{ invites().length }}</div>
                    <div class="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div class="lg:col-span-2 space-y-8">
                <!-- Search Panel -->
                <div class="glass-panel p-8 border border-[color:var(--current-theme-color)]/20 relative overflow-hidden group">
                  <div class="absolute inset-0 bg-gradient-to-br from-[color:var(--current-theme-color)]/5 to-transparent pointer-events-none"></div>
                  <div class="absolute top-0 right-0 w-48 h-48 bg-[color:var(--current-theme-color)]/10 blur-[80px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-2">
                      <mat-icon class="text-[color:var(--current-theme-color)] text-[16px] animate-pulse">radar</mat-icon>
                      <span class="font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--current-theme-color)]">> Challenge Friend</span>
                    </div>
                    <h2 class="font-display text-3xl uppercase mb-2 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Find Operative</h2>
                    <p class="text-white/40 text-xs mb-8">Enter a callsign to find your friend. Send a duel invite and wait for them to accept.</p>

                    @if (!gameData.isAuthenticated()) {
                      <div class="mb-6 p-5 bg-accent-magenta/10 border border-accent-magenta/30 rounded flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                          <mat-icon class="text-accent-magenta animate-pulse">lock</mat-icon>
                          <span class="font-mono text-[11px] text-white/70 uppercase tracking-widest">Sign in to challenge operatives</span>
                        </div>
                        <button (click)="router.navigate(['/auth'])" class="px-6 py-2 bg-accent-magenta/20 border border-accent-magenta/50 text-accent-magenta text-[10px] font-bold uppercase tracking-widest hover:bg-accent-magenta hover:text-white transition-all rounded whitespace-nowrap">Sign In</button>
                      </div>
                    }

                    <div class="flex flex-col md:flex-row gap-4 mb-6">
                      <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" (keydown.enter)="runSearch()"
                             class="flex-1 bg-surface-dark border border-white/20 focus:border-[color:var(--current-theme-color)] focus:shadow-[0_0_15px_color-mix(in_srgb,var(--current-theme-color)_30%,transparent)] text-white font-mono tracking-widest uppercase p-5 rounded outline-none transition-all placeholder:text-white/10"
                             placeholder="USERNAME..." maxlength="24" autocomplete="off">
                      <button (click)="runSearch()" class="px-10 py-5 bg-[color:var(--current-theme-color)]/10 border border-[color:var(--current-theme-color)]/50 text-[color:var(--current-theme-color)] hover:bg-[color:var(--current-theme-color)] hover:text-black font-bold font-mono text-[12px] uppercase tracking-[0.3em] hover:shadow-[0_0_20px_var(--current-theme-color)] transition-all rounded">Search</button>
                    </div>

                    @if (searchResults().length > 0) {
                      <div class="mb-4">
                        <div class="flex items-center gap-4 mb-4 p-4 bg-surface-dark/50 border border-white/10 rounded">
                          <span class="font-mono text-[10px] text-white/50 uppercase tracking-widest whitespace-nowrap">Rounds:</span>
                          <div class="flex gap-2">
                            @for (r of [3,5,7]; track r) {
                              <button (click)="selectedRounds = r" class="px-4 py-2 font-mono text-sm font-bold rounded transition-all" [ngClass]="selectedRounds === r ? 'bg-[color:var(--current-theme-color)] text-black shadow-[0_0_15px_var(--current-theme-color)]' : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/30'">Best of {{ r }}</button>
                            }
                          </div>
                        </div>
                      </div>
                      <div class="space-y-3 mb-4">
                        @for (u of searchResults(); track u.uid) {
                          <div class="flex items-center justify-between bg-black/40 border border-[color:var(--current-theme-color)]/20 px-6 py-4 rounded group/user hover:border-[color:var(--current-theme-color)]/60 transition-colors">
                            <div class="flex items-center gap-4">
                              <div class="w-8 h-8 rounded-full bg-[color:var(--current-theme-color)]/20 flex items-center justify-center border border-[color:var(--current-theme-color)]/30">
                                <mat-icon class="text-[16px] text-[color:var(--current-theme-color)]">person</mat-icon>
                              </div>
                              <span class="font-mono tracking-widest uppercase text-base text-white/90 group-hover/user:text-white transition-colors">{{ u.username }}</span>
                            </div>
                            <button (click)="sendInvite(u.uid)" class="px-6 py-3 border border-[color:var(--current-theme-color)]/50 text-[color:var(--current-theme-color)] hover:bg-[color:var(--current-theme-color)] hover:text-black font-bold font-mono text-[10px] uppercase tracking-[0.2em] transition-all rounded shadow-[inset_0_0_10px_color-mix(in_srgb,var(--current-theme-color)_10%,transparent)]">Challenge ({{ selectedRounds }}R)</button>
                          </div>
                        }
                      </div>
                    }

                    @if (searchHint()) {
                      <div class="mt-4 border-l-2 border-white/20 pl-4 py-1">
                        <p class="font-mono text-[10px] text-white/40 tracking-widest uppercase">{{ searchHint() }}</p>
                      </div>
                    }
                  </div>
                </div>



                <!-- Incoming Invites -->
                @if (invites().length > 0) {
                  <div class="glass-panel p-8 border border-accent-magenta/50 relative overflow-hidden shadow-[0_0_30px_rgba(255,0,92,0.15)]">
                    <div class="absolute inset-0 bg-gradient-to-r from-accent-magenta/10 to-transparent pointer-events-none"></div>
                    
                    <div class="relative z-10">
                      <div class="flex items-center gap-3 mb-2">
                        <mat-icon class="text-accent-magenta text-[16px] animate-[pulse_1s_infinite]">warning</mat-icon>
                        <span class="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-magenta">> Incoming Signal</span>
                      </div>
                      <h2 class="font-display text-3xl uppercase mb-6 text-white">Challenge Received</h2>
                      <div class="space-y-4">
                        @for (inv of invites(); track inv.inviteId) {
                          <div class="flex flex-col md:flex-row md:items-center justify-between bg-black/50 border border-accent-magenta/30 px-6 py-5 rounded gap-4 shadow-inner">
                            <div class="flex items-center gap-4">
                              <div class="w-10 h-10 rounded bg-accent-magenta/20 flex items-center justify-center border border-accent-magenta/50">
                                <mat-icon class="text-[20px] text-accent-magenta animate-pulse">priority_high</mat-icon>
                              </div>
                              <span class="font-mono text-base"><strong class="text-accent-magenta tracking-widest uppercase">{{ inv.fromUsername || 'Operative' }}</strong> has challenged you. <span class="text-white/40 text-xs">(Best of {{ inv.roundCount }})</span></span>
                            </div>
                            <div class="flex gap-3">
                              <button (click)="acceptInvite(inv.inviteId)" class="px-8 py-3 bg-accent-magenta text-white font-bold font-mono text-[11px] uppercase tracking-[0.3em] hover:bg-white hover:text-black hover:shadow-[0_0_20px_#ff005c] transition-all rounded shadow-[0_0_10px_rgba(255,0,92,0.5)]">Accept</button>
                              <button (click)="declineInvite(inv.inviteId)" class="px-6 py-3 border border-white/20 text-white/50 font-mono text-[11px] uppercase tracking-[0.3em] hover:border-white/50 hover:text-white transition-all rounded">Decline</button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Leaderboard -->
              <div class="lg:col-span-1">
                <div class="glass-panel border border-[color:var(--current-theme-color)]/30 overflow-hidden relative flex flex-col h-full">
                  <div class="absolute top-0 right-0 w-32 h-32 bg-[color:var(--current-theme-color)]/10 blur-[50px] pointer-events-none opacity-50"></div>
                  <div class="p-6 border-b border-white/10 relative z-10 flex items-center justify-between bg-surface-dark">
                    <div class="flex items-center gap-3">
                      <mat-icon class="text-[color:var(--current-theme-color)]">leaderboard</mat-icon>
                      <h3 class="font-display text-xl uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Top Operatives</h3>
                    </div>
                  </div>
                  
                  <div class="flex-1 overflow-y-auto p-2">
                    <div class="flex flex-col gap-1 p-4">
                      @for (lb of leaderboard(); track lb.uid; let i = $index) {
                        <div class="flex items-center justify-between py-3 px-4 rounded transition-colors group relative overflow-hidden" [ngClass]="i < 3 ? 'bg-[color:var(--current-theme-color)]/10 border border-[color:var(--current-theme-color)]/30' : 'hover:bg-white/5'">
                          <div class="flex items-center gap-4 relative z-10">
                            <span class="font-display text-xl font-bold w-6" [ngClass]="i === 0 ? 'text-yellow-400 drop-shadow-[0_0_10px_#facc15]' : (i === 1 ? 'text-gray-300' : (i === 2 ? 'text-amber-600' : 'text-white/30'))">#{{i+1}}</span>
                            <span class="font-mono text-sm tracking-widest uppercase text-white/90 group-hover:text-white">{{ lb.callsign }}</span>
                          </div>
                          <span class="font-mono text-xs text-[color:var(--current-theme-color)] font-bold relative z-10">{{ lb.points }} XP</span>
                        </div>
                      }
                      @if (leaderboard().length === 0) {
                        <div class="text-center py-8">
                           <mat-icon class="text-4xl text-white/20 mb-2">hourglass_empty</mat-icon>
                           <p class="font-mono text-[10px] text-white/40 uppercase tracking-widest">No intel acquired yet.</p>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Active Duel -->
          @if (match() && match()!.status === 'open') {
            <div class="glass-panel border border-[color:var(--current-theme-color)]/30 overflow-hidden relative group">
              <!-- Animated Background Elements -->
              <div class="absolute inset-0 bg-gradient-to-br from-[color:var(--current-theme-color)]/5 to-transparent pointer-events-none"></div>
              <div class="absolute top-0 right-0 w-64 h-64 bg-[color:var(--current-theme-color)]/10 blur-[100px] pointer-events-none"></div>
              
              <div class="p-8 pb-4 flex flex-col gap-4 border-b border-white/10 relative z-10">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-3">
                    <mat-icon class="text-[color:var(--current-theme-color)] animate-[pulse_2s_infinite]">bolt</mat-icon>
                    <span class="font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--current-theme-color)]">Live Duel</span>
                    <span class="font-mono text-[10px] px-3 py-1 bg-[color:var(--current-theme-color)]/20 border border-[color:var(--current-theme-color)]/30 rounded text-[color:var(--current-theme-color)]">Round {{ (match()!.currentRound || 0) + 1 }} / {{ match()!.totalRounds }}</span>
                  </div>

                  <!-- Score Display -->
                  <div class="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-white/10 shadow-inner">
                    <span class="font-display text-xl uppercase flex items-center gap-2 text-[color:var(--current-theme-color)]">
                      {{ myScore() }} <span class="font-mono text-[9px] text-white/40">PTS</span>
                    </span>
                    <span class="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">vs</span>
                    <span class="font-display text-xl uppercase flex items-center gap-2 text-accent-magenta">
                      {{ opponentScore() }} <span class="font-mono text-[9px] text-white/40">PTS</span>
                    </span>
                  </div>
                </div>

                <!-- Round Progress Dots -->
                <div class="flex items-center justify-center gap-2">
                  @for (r of roundDots(); track r.round) {
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all"
                         [ngClass]="r.status === 'won' ? 'bg-[color:var(--current-theme-color)] text-black shadow-[0_0_10px_var(--current-theme-color)]' : (r.status === 'lost' ? 'bg-accent-magenta text-white shadow-[0_0_10px_rgba(255,0,92,0.5)]' : (r.status === 'draw' ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50' : (r.status === 'active' ? 'bg-white/20 text-white border-2 border-[color:var(--current-theme-color)] animate-pulse' : 'bg-white/5 text-white/20 border border-white/10')))">
                      {{ r.round + 1 }}
                    </div>
                  }
                </div>
              </div>

              <div class="p-8 relative z-10">
                <div class="flex flex-col gap-6">
                  <!-- Ciphertext Display (Styled like lab plaintext) -->
                  <div class="bg-surface-panel/50 border border-white/10 backdrop-blur-xl rounded-xl p-10 relative overflow-hidden shadow-xl">
                    <div class="absolute left-0 top-0 h-full w-1 bg-white/20 animate-pulse"></div>
                    
                    <div class="font-sans font-bold text-[10px] text-[color:var(--current-theme-color)] uppercase tracking-[0.3em] mb-6 flex justify-between">
                      <span>Target Payload (Encrypted)</span>
                      <mat-icon class="text-[16px] animate-[pulse_2s_infinite]">bolt</mat-icon>
                    </div>
                    
                    <div class="font-mono text-[42px] leading-[1.2] text-white tracking-[0.1em] break-all drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                      <span class="text-white/10 select-none mr-4">></span>{{ match()!.question }}
                    </div>
                  </div>

                  <!-- Connector -->
                  <div class="flex flex-col items-center justify-center -my-6 z-20 h-20 relative">
                     <div class="w-[2px] h-full bg-gradient-to-b from-accent-cyan/0 via-accent-cyan to-accent-cyan/0 absolute opacity-50"></div>
                     <div class="w-1.5 h-6 bg-[color:var(--current-theme-color)] absolute animate-[bounce_2s_infinite] shadow-[0_0_15px_var(--current-theme-color)] rounded-full z-10"></div>
                     
                     <div class="px-6 py-2 bg-surface-dark border border-[color:var(--current-theme-color)]/50 rounded-full relative z-20 flex items-center gap-3 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        <mat-icon class="text-[color:var(--current-theme-color)] text-[16px] animate-[spin_4s_linear_infinite]">settings</mat-icon>
                        <span class="font-mono text-[10px] text-white/70 uppercase tracking-[0.3em]">Processing Node</span>
                        <mat-icon class="text-[color:var(--current-theme-color)] text-[16px]">sync_alt</mat-icon>
                     </div>
                  </div>

                  <!-- Plaintext Input Area (Styled like lab input) -->
                  <div class="glass-panel p-10 relative shadow-[0_40px_80px_rgba(0,0,0,0.5)] transition-all duration-500 rounded-xl border border-[color:var(--current-theme-color)]/30">
                    <div class="absolute left-0 top-0 h-full w-1 transition-colors duration-500 bg-[color:var(--current-theme-color)]"></div>

                    <div class="font-sans font-bold text-[10px] uppercase tracking-[0.3em] mb-8 flex justify-between text-[color:var(--current-theme-color)]">
                      <span>Encryption Protocol: {{ match()!.cipherType }}</span>
                      <span class="animate-pulse">[AWAITING DECRYPTION]</span>
                    </div>

                    @if (match()!.cipherHint) {
                      <div class="mb-6 font-mono text-[11px] text-white/70 bg-surface-dark/50 p-4 border border-white/5 rounded">
                        <span class="text-[color:var(--current-theme-color)] font-bold uppercase">> Intel:</span> {{ match()!.cipherHint }}
                      </div>
                    }

                    <div class="relative flex items-center bg-surface-dark/50 rounded-lg p-6 border border-white/5 focus-within:border-white/20 transition-colors">
                      <span class="font-mono text-[32px] text-white/20 select-none mr-4">></span>
                      <input 
                        type="text"
                        [(ngModel)]="answer"
                        (input)="answer = answer.toUpperCase()"
                        (keydown.enter)="!match()!.myAnswered && submitAnswer()"
                        [disabled]="match()!.myAnswered"
                        class="w-full bg-transparent text-white font-mono text-[40px] tracking-[0.1em] outline-none uppercase placeholder:text-white/10 disabled:opacity-40 disabled:border-white/5"
                        placeholder="ENTER PLAINTEXT..."
                        spellcheck="false"
                      />
                    </div>

                    <div class="mt-8 flex justify-end">
                       <button (click)="submitAnswer()" [disabled]="match()!.myAnswered"
                               class="px-10 py-5 bg-[color:var(--current-theme-color)] text-black font-bold font-mono text-[12px] uppercase tracking-[0.3em] hover:bg-white hover:shadow-[0_0_30px_var(--current-theme-color)] transition-all disabled:opacity-20 disabled:cursor-not-allowed rounded shadow-[0_0_15px_color-mix(in_srgb,var(--current-theme-color)_50%,transparent)] flex items-center gap-3">
                         Execute Decryption <mat-icon class="text-[16px]">send</mat-icon>
                       </button>
                    </div>

                    <div class="mt-6 flex justify-center">
                      <p class="font-mono text-[11px] px-4 py-2 rounded uppercase tracking-widest transition-colors" [ngClass]="match()!.myAnswered ? 'bg-[color:var(--current-theme-color)]/20 text-[color:var(--current-theme-color)]' : 'bg-white/5 text-white/50'">{{ duelStatus() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Match Results -->
          @if (match() && match()!.status === 'done') {
            <div class="glass-panel p-16 text-center border overflow-hidden relative" [ngClass]="match()!.winnerUid === gameData.authProfile()?.uid ? 'border-[color:var(--current-theme-color)]' : 'border-accent-magenta/50'">
              <div class="absolute inset-0 bg-radial from-transparent" [ngClass]="match()!.winnerUid === gameData.authProfile()?.uid ? 'to-[color:var(--current-theme-color)]/10' : 'to-accent-magenta/10'"></div>
              
              <mat-icon class="text-[80px] w-[80px] h-[80px] mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-[bounce_2s_infinite]" [ngClass]="resultClass()">
                {{ match()!.winnerUid === gameData.authProfile()?.uid ? 'emoji_events' : (match()!.winnerUid ? 'skull' : 'handshake') }}
              </mat-icon>
              
              <div class="relative z-10 font-display text-7xl uppercase mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" [ngClass]="resultClass()">{{ resultTitle() }}</div>
              <p class="relative z-10 text-white/80 text-lg mb-8 font-mono uppercase tracking-[0.2em]">{{ resultSub() }}</p>
              
              @if (resultXp()) {
                <div class="relative z-10 font-mono text-3xl font-bold mb-12 py-4 px-8 inline-block border rounded bg-black/40 shadow-inner" [ngClass]="resultXp()!.includes('+') ? 'text-[color:var(--current-theme-color)] border-[color:var(--current-theme-color)]/30' : 'text-white/40 border-white/10'">
                  {{ resultXp() }}
                </div>
              }
              
              <div class="relative z-10">
                <button (click)="ackMatch()" class="px-12 py-5 border border-white/20 text-white uppercase tracking-[0.4em] font-mono text-[12px] font-bold hover:bg-white hover:text-black hover:shadow-[0_0_30px_#ffffff] transition-all duration-300 outline-none focus-visible:ring-2">Return to Network</button>
              </div>
            </div>
          }

          <!-- Error -->
          @if (errorMsg()) {
            <div class="font-mono text-[11px] text-accent-magenta bg-accent-magenta/10 border border-accent-magenta/20 px-4 py-3 rounded flex items-center gap-2">
              <mat-icon class="text-[16px]">error_outline</mat-icon> {{ errorMsg() }}
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class MultiplayerComponent implements OnInit, OnDestroy {
  router = inject(Router);
  readonly gameData = inject(GameDataService);

  searchQuery = '';
  answer = '';
  searchResults = signal<SearchResult[]>([]);
  searchHint = signal('');
  invites = signal<Invite[]>([]);
  match = signal<MatchData | null>(null);
  leaderboard = signal<LeaderboardEntry[]>([]);
  errorMsg = signal('');

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private inviteInterval: ReturnType<typeof setInterval> | undefined;
  private matchInterval: ReturnType<typeof setInterval> | undefined;

  // Computed result fields
  duelStatus = signal('');
  resultTitle = signal('');
  resultSub = signal('');
  resultXp = signal('');
  resultClass = signal('');
  selectedRounds = 5;

  myScore(): number {
    const m = this.match();
    if (!m) return 0;
    const uid = this.gameData.authProfile()?.uid || '';
    return m.scores?.[uid] || 0;
  }

  opponentScore(): number {
    const m = this.match();
    if (!m) return 0;
    const uid = this.gameData.authProfile()?.uid || '';
    const opUid = m.uids?.find(u => u !== uid) || '';
    return m.scores?.[opUid] || 0;
  }

  roundDots(): { round: number; status: 'won' | 'lost' | 'draw' | 'active' | 'pending' }[] {
    const m = this.match();
    if (!m) return [];
    const uid = this.gameData.authProfile()?.uid || '';
    const dots: { round: number; status: 'won' | 'lost' | 'draw' | 'active' | 'pending' }[] = [];
    for (let i = 0; i < m.totalRounds; i++) {
      const result = m.roundResults?.find(r => r.round === i);
      if (result) {
        if (result.winnerUid === uid) dots.push({ round: i, status: 'won' });
        else if (result.winnerUid === null) dots.push({ round: i, status: 'draw' });
        else dots.push({ round: i, status: 'lost' });
      } else if (i === m.currentRound && m.status === 'open') {
        dots.push({ round: i, status: 'active' });
      } else {
        dots.push({ round: i, status: 'pending' });
      }
    }
    return dots;
  }

  private authStarted = false;
  private lastConfettiMatchId = '';

  constructor() {
    // Watch for auth state changes and start polling when authenticated
    effect(() => {
      const isAuth = this.gameData.isAuthenticated();
      if (isAuth && !this.authStarted) {
        this.authStarted = true;
        this.refreshLeaderboard();
        this.refreshInvites();
        this.refreshMatch();
        this.inviteInterval = setInterval(() => this.refreshInvites(), 1200);
        this.matchInterval = setInterval(() => this.refreshMatch(), 900);
      }
    });
  }

  ngOnInit() {
    this.refreshLeaderboard();
  }

  ngOnDestroy() {
    if (this.inviteInterval) clearInterval(this.inviteInterval);
    if (this.matchInterval) clearInterval(this.matchInterval);
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  goHome() { this.router.navigate(['/']); }

  private async api(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  onSearchChange(val: string) {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      if (val.trim().length >= 2) this.runSearch();
    }, 350);
  }

  async runSearch() {
    this.errorMsg.set('');
    const q = this.searchQuery.trim();
    if (q.length < 2) { this.searchHint.set('Type at least 2 characters.'); this.searchResults.set([]); return; }
    try {
      const data = await this.api(`/api/multiplayer/search?q=${encodeURIComponent(q)}`);
      this.searchResults.set(data.users || []);
      this.searchHint.set(!data.users?.length ? 'No operatives match that callsign.' : 'Select invite to send a duel signal.');
    } catch (e: any) {
      this.errorMsg.set(e.message);
      this.searchResults.set([]);
    }
  }

  async sendInvite(toUid: string) {
    this.errorMsg.set('');
    try {
      await this.api('/api/multiplayer/invite', { method: 'POST', body: JSON.stringify({ toUid, roundCount: this.selectedRounds }) });
      this.searchHint.set(`Invite sent (Best of ${this.selectedRounds}). Waiting for them to accept.`);
    } catch (e: any) { this.errorMsg.set(e.message); }
  }

  async acceptInvite(inviteId: string) {
    this.errorMsg.set('');
    try {
      await this.api(`/api/multiplayer/invite/${encodeURIComponent(inviteId)}/accept`, { method: 'POST' });
      this.refreshMatch();
    } catch (e: any) { this.errorMsg.set(e.message); }
  }

  async declineInvite(inviteId: string) {
    this.errorMsg.set('');
    try {
      await this.api(`/api/multiplayer/invite/${encodeURIComponent(inviteId)}/decline`, { method: 'POST' });
      this.refreshInvites();
    } catch (e: any) { this.errorMsg.set(e.message); }
  }

  async submitAnswer() {
    const m = this.match();
    if (!m || !m.matchId) return;
    this.errorMsg.set('');
    try {
      const data = await this.api(`/api/multiplayer/match/${encodeURIComponent(m.matchId)}/answer`, {
        method: 'POST', body: JSON.stringify({ answer: this.answer }),
      });
      this.answer = '';
      if (data.match) {
        this.match.set(data.match);
        this.computeMatchState();
      }
    } catch (e: any) { this.errorMsg.set(e.message); }
  }

  async ackMatch() {
    const m = this.match();
    if (!m || !m.matchId) return;
    this.errorMsg.set('');
    try {
      await this.api(`/api/multiplayer/match/${encodeURIComponent(m.matchId)}/ack`, { method: 'POST' });
      this.match.set(null);
      this.answer = '';
      this.refreshMatch();
    } catch (e: any) { this.errorMsg.set(e.message); }
  }

  private async refreshInvites() {
    try {
      const data = await this.api('/api/multiplayer/invites/incoming');
      this.invites.set(data.invites || []);
    } catch {}
  }

  private async refreshLeaderboard() {
    try {
      const data = await this.api('/api/multiplayer/leaderboard');
      if (data.entries) this.leaderboard.set(data.entries);
    } catch {}
  }

  private async refreshMatch() {
    try {
      const data = await this.api('/api/multiplayer/active-match');
      this.match.set(data.match);
      this.computeMatchState();
    } catch {}
  }

  private computeMatchState() {
    const m = this.match();
    if (!m) return;

    // Duel status
    if (m.status === 'open') {
      const roundNum = (m.currentRound || 0) + 1;
      if (m.myAnswered) {
        this.duelStatus.set(m.opponentAnswered ? 'Both exhausted tries. Advancing…' : `Round ${roundNum}: Answer locked. Waiting for opponent…`);
      } else {
        this.duelStatus.set(m.opponentAnswered ? `⚡ Opponent done with Round ${roundNum}! Hurry!` : `Round ${roundNum} of ${m.totalRounds}: Decrypt the cipher below.`);
      }
    }

    // Results
    if (m.status === 'done') {
      const uid = this.gameData.authProfile()?.uid;
      const myRoundWins = m.roundResults?.filter(r => r.winnerUid === uid).length || 0;
      const opUid = m.uids?.find(u => u !== uid) || '';
      const opRoundWins = m.roundResults?.filter(r => r.winnerUid === opUid).length || 0;
      const myPts = m.scores?.[uid || ''] || 0;
      const opPts = m.scores?.[opUid] || 0;

      if (m.resultReason === 'draw') {
        this.resultClass.set('text-yellow-400');
        this.resultTitle.set('Draw');
        this.resultSub.set(`Rounds: ${myRoundWins}–${opRoundWins}. Score: ${myPts}–${opPts}.`);
        this.resultXp.set('');
      } else if (m.winnerUid === uid) {
        this.resultClass.set('text-[color:var(--current-theme-color)]');
        this.resultTitle.set('Victory!');
        this.resultSub.set(`Rounds won: ${myRoundWins}–${opRoundWins}. Total: ${myPts} XP.`);
        this.resultXp.set(`+${myPts} XP earned`);
        if (this.lastConfettiMatchId !== m.matchId) {
          confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, colors: [this.gameData.selectedAvatar().colorHex, '#ffffff'] });
          this.lastConfettiMatchId = m.matchId;
        }
      } else if (m.winnerUid) {
        this.resultClass.set('text-accent-magenta');
        this.resultTitle.set('Defeat');
        const winnerName = m.usernames?.[m.winnerUid] || 'Opponent';
        this.resultSub.set(`${winnerName} won ${opRoundWins}–${myRoundWins} rounds.`);
        this.resultXp.set('-5 XP');
      } else {
        this.resultClass.set('text-yellow-400');
        this.resultTitle.set('No Contest');
        this.resultSub.set('Neither operative secured enough rounds.');
        this.resultXp.set('');
      }
    }
  }
}
