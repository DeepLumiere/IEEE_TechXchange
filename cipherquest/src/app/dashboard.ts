
import { Component, inject, ElementRef, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameDataService, Chapter, Mission, Badge, AVATAR_VARIANTS } from './game-data.service';
import { MatIconModule } from '@angular/material/icon';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="h-screen w-screen relative overflow-hidden bg-transparent text-white font-sans selection:bg-[color:var(--current-theme-color)]/30">
      
      <!-- Screen Flash Overlay -->
      <div id="flash-overlay" class="absolute inset-0 bg-[color:var(--current-theme-color)] z-[100] pointer-events-none opacity-0"></div>
      
      <!-- Quantum Ascent Overlay -->
      @if (showQuantumOverlay()) {
        <div class="absolute inset-0 bg-void z-[110] flex flex-col justify-center items-center text-center p-8 overflow-hidden">
          <div class="absolute inset-0 grid-bg opacity-20 animate-pulse"></div>
          <div class="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] -translate-x-1/2 -translate-y-1/2 bg-[color:var(--current-theme-color)]/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>
          <h2 class="relative z-10 font-display text-7xl uppercase text-white drop-shadow-[0_0_20px_color-mix(in srgb, var(--current-theme-color) 80%, transparent)] mb-8 tracking-widest">Quantum Acceleration</h2>
          <div class="relative z-10 w-full max-w-2xl bg-surface-dark border border-[color:var(--current-theme-color)]/30 p-8 flex flex-col items-center gap-6 font-mono text-center rounded shadow-[0_0_50px_color-mix(in srgb, var(--current-theme-color) 10%, transparent)]">
             @if (quantumState() === 'story') {
                 <div class="text-left w-full space-y-4 font-mono text-sm mb-4 min-h-[150px]">
                     @for (line of quantumDialogue(); track $index) {
                         <div class="animate-in fade-in slide-in-from-bottom" [ngClass]="line.speaker === 'MALIQ' ? 'text-accent-magenta' : 'text-[color:var(--current-theme-color)]'">
                            <span class="font-bold">> {{ line.speaker }}:</span> {{ line.text }}
                         </div>
                     }
                 </div>
                 @if (quantumDialogueFinished()) {
                     <button (click)="beginQuantumPuzzle()" class="px-6 py-2 border border-[color:var(--current-theme-color)] text-[color:var(--current-theme-color)] hover:bg-[color:var(--current-theme-color)] hover:text-black uppercase tracking-widest font-bold transition-all text-xs outline-none focus-visible:ring-2">Initialize Qubits</button>
                 }
             } @else {
                 <div class="text-[color:var(--current-theme-color)] font-bold text-xl uppercase tracking-widest leading-loose">
                   @if (!quantumSolved()) {
                      <span>>> CORE ALIGNMENT REQUIRED // ALIGN ALL QUBITS</span>
                   } @else {
                      <span class="animate-pulse">>> MASTER CIPHER UNLOCKED. SYSTEM SECURED.</span>
                   }
                 </div>
                 <div class="text-white/50 text-[10px] uppercase mb-2 max-w-sm">
                    Warning: Re-aligning a qubit simultaneously flips the alignment of adjacent nodes. Establish full harmonic resonance to run Shor's Algorithm.
                 </div>
                 
                 <!-- Puzzle Grid -->
                 <div class="grid grid-cols-3 gap-4 p-6 bg-black/40 border border-white/5 rounded-xl shadow-inner mb-2 relative">
                   @for (node of quantumGrid(); track $index) {
                     <button (click)="toggleQuantumNode($index)" 
                             class="w-20 h-20 outline-none rounded-sm transition-all duration-300 relative overflow-hidden group flex items-center justify-center border hover:scale-105 active:scale-95"
                             [ngClass]="node ? 'bg-[color:var(--current-theme-color)]/20 border-[color:var(--current-theme-color)] shadow-[0_0_15px_color-mix(in_srgb,var(--current-theme-color)_60%,transparent)]' : 'bg-surface-panel/50 border-white/10 hover:border-[color:var(--current-theme-color)]/50'">
                        <!-- Inner Core -->
                        <div class="w-8 h-8 rounded-full transition-all duration-300 pointer-events-none display-flex items-center justify-center"
                             [ngClass]="node ? 'bg-[color:var(--current-theme-color)] shadow-[0_0_10px_var(--current-theme-color)] border-2 border-white' : 'bg-surface-dark border border-white/20'">
                             @if (node) {
                                <mat-icon class="text-white text-[16px] animate-[spin_3s_linear_infinite]">adjust</mat-icon>
                             }
                        </div>
                     </button>
                   }
                   @if (quantumSolved()) {
                      <div class="absolute inset-0 bg-[color:var(--current-theme-color)]/20 mix-blend-screen pointer-events-none rounded-xl z-20"></div>
                   }
                 </div>
                 
                 @if (!quantumSolved()) {
                    <div class="w-full flex flex-col gap-2 relative">
                       <button (click)="requestQuantumHint()" [disabled]="isFetchingQuantumHint()" class="text-[10px] uppercase tracking-widest text-[color:var(--current-theme-color)]/70 hover:text-[color:var(--current-theme-color)] outline-none disabled:opacity-50">
                           {{ isFetchingQuantumHint() ? '>> Calculating heuristic branch...' : '>> Request System Intel (Hint)' }}
                       </button>
                       @if (currentQuantumHint()) {
                           <div class="text-xs font-mono text-[color:var(--current-theme-color)] border border-[color:var(--current-theme-color)]/20 bg-[color:var(--current-theme-color)]/10 p-3 rounded text-left leading-relaxed">
                               {{ currentQuantumHint() }}
                           </div>
                       }
                    </div>
                 }
             }
          </div>
          <button (click)="closeQuantumOverlay()" class="relative z-10 mt-12 px-8 py-3 outline-none border border-[color:var(--current-theme-color)]/50 hover:bg-[color:var(--current-theme-color)] hover:text-black transition-all text-sm uppercase tracking-widest font-bold">Close Terminal</button>
        </div>
      }

      <!-- Badges Overlay -->
      @if (showBadgesOverlay()) {
        <div class="absolute inset-0 bg-void/90 backdrop-blur-xl z-[90] flex p-12 overflow-y-auto">
          <div class="w-full max-w-6xl mx-auto flex flex-col pt-12">
            <div class="flex justify-between items-center mb-16">
              <h2 class="font-display text-5xl uppercase tracking-widest">Acquired Intel Badges</h2>
              <button (click)="showBadgesOverlay.set(false)" class="text-white/50 hover:text-white transition-colors outline-none"><mat-icon class="text-4xl">close</mat-icon></button>
            </div>
            
            @if (gameData.earnedBadges().length === 0) {
               <div class="w-full py-24 text-center border border-white/10 border-dashed rounded-xl flex flex-col items-center">
                  <mat-icon class="text-6xl text-white/10 mb-4">military_tech</mat-icon>
                  <p class="font-mono text-white/30 uppercase tracking-widest text-lg">No Masteries Yet</p>
               </div>
            } @else {
               <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                 @for (badge of gameData.earnedBadges(); track badge.id) {
                     <div class="relative bg-[color-mix(in_srgb,var(--current-theme-color)_5%,transparent)] border border-[color:var(--current-theme-color)]/30 p-6 pt-12 pb-8 rounded flex flex-col items-center text-center group hover:border-[color:var(--current-theme-color)] shadow-[0_0_20px_color-mix(in_srgb,var(--current-theme-color)_0%,transparent)] hover:shadow-[0_0_20px_color-mix(in_srgb,var(--current-theme-color)_30%,transparent)] transition-all overflow-hidden cursor-default">
                        
                        <!-- Technical Corner Info -->
                        <div class="absolute top-3 left-4 font-mono text-[9px] text-[color:var(--current-theme-color)]/80 text-left uppercase leading-tight tracking-[0.2em]">
                           OP: {{ gameData.operatorName() }}<br>
                           TS: {{ badge.earnedAt | date:'HH:mm:ss' }}
                        </div>
                        <div class="absolute top-3 right-4 font-mono text-[9px] text-[color:var(--current-theme-color)]/80 text-right uppercase leading-tight tracking-[0.2em]">
                           TAG_ID: {{ badge.id }}<br>
                           [SECURE]
                        </div>

                        <!-- Scanlines & Inner background -->
                        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[color:var(--current-theme-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[2s]"></div>
                        
                        <!-- Corner accents -->
                        <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-[color:var(--current-theme-color)]"></div>
                        <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-[color:var(--current-theme-color)]"></div>
                        <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[color:var(--current-theme-color)]"></div>
                        <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[color:var(--current-theme-color)]"></div>

                        <div class="w-24 h-24 rounded-full border border-[color:var(--current-theme-color)]/40 flex items-center justify-center mb-6 z-10 bg-[color-mix(in_srgb,var(--current-theme-color)_5%,transparent)] shadow-[inset_0_0_15px_color-mix(in_srgb,var(--current-theme-color)_20%,transparent)] group-hover:scale-110 transition-transform duration-500">
                           <div class="w-20 h-20 rounded-full border border-dashed border-[color:var(--current-theme-color)]/30 flex items-center justify-center group-hover:animate-[spin_4s_linear_infinite]">
                              <mat-icon class="text-[40px] text-[color:var(--current-theme-color)] drop-shadow-[0_0_10px_color-mix(in_srgb,var(--current-theme-color)_80%,transparent)] group-hover:animate-none">{{ badge.icon }}</mat-icon>
                           </div>
                        </div>
                        
                        <h3 class="font-display font-medium text-xl uppercase tracking-wide mb-2 z-10 text-white group-hover:text-[color:var(--current-theme-color)] transition-colors">{{ badge.name }}</h3>
                        <div class="w-8 h-px bg-[color:var(--current-theme-color)]/50 mb-3 z-10"></div>
                        <p class="font-mono text-[10px] text-white/60 mb-8 z-10 px-2 tracking-widest leading-relaxed">{{ badge.description }}</p>
                        
                        <button (click)="downloadBadge(badge)" class="mt-auto flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-sm transition-all text-white outline-none z-10 border border-[color:var(--current-theme-color)] hover:bg-[color:var(--current-theme-color)] hover:text-black">
                           <mat-icon class="text-[14px]">file_download</mat-icon> Extract Certificate
                        </button>
                     </div>
                 }
               </div>
            }
          </div>
        </div>
      }

      <!-- High-End Dynamic Background -->
      <div class="absolute inset-0 z-0 bg-[#050505]">
        <!-- Image Overlay -->
        <div class="absolute inset-0 z-0" style="background-image: url('/background.jpg'); background-size: cover; background-position: center; opacity: 0.15; mix-blend-mode: luminosity;"></div>
        
        <!-- Subtle gradient spots -->
        <div class="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full mix-blend-screen opacity-60 pointer-events-none" [style.backgroundColor]="'color-mix(in srgb, var(--current-theme-color) 5%, transparent)'" style="filter: blur(100px)"></div>
        <div class="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full mix-blend-screen opacity-50 pointer-events-none" [style.backgroundColor]="'color-mix(in srgb, var(--current-theme-color) 3%, transparent)'" style="filter: blur(100px)"></div>
        
        <!-- Architectural Grid -->
        <div class="absolute inset-0 grid-bg opacity-[0.15] pointer-events-none"></div>
        
        <!-- Vignette -->
        <div class="absolute inset-0 bg-radial from-transparent to-black/80 pointer-events-none"></div>
      </div>

      <!-- Top Navigation / Player Tag -->
      <div class="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-50 pointer-events-none">
        
        <div class="flex items-center gap-6 pointer-events-auto">
          <div class="flex items-center gap-4 group cursor-pointer" (click)="showBadgesOverlay.set(true)" tabindex="0" (keydown.enter)="showBadgesOverlay.set(true)">
            <!-- Dynamic Avatar Frame -->
            <div class="w-14 h-14 bg-surface-dark border flex justify-center items-center cursor-pointer border-[color:var(--current-theme-color)]/30 text-[color:var(--current-theme-color)] overflow-hidden relative shadow-[0_0_15px_var(--current-theme-color)] group-hover:scale-105 transition-transform duration-300 rounded">
              <div class="absolute inset-0 bg-[color:var(--current-theme-color)]/10 group-hover:bg-[color:var(--current-theme-color)]/20 transition-colors animate-[pulse_3s_ease-in-out_infinite]"></div>
              <mat-icon class="text-3xl drop-shadow-[0_0_8px_var(--current-theme-color)] animate-[bounce_2s_ease-in-out_infinite]">{{ gameData.selectedAvatar().icon }}</mat-icon>
            </div>
            
            <div class="flex flex-col cursor-pointer">
              <span class="text-[11px] text-white/50 uppercase tracking-[0.2em] font-medium leading-none mb-1">Architect Id (Click for Intel)</span>
              <span class="text-3xl font-display font-medium tracking-wide uppercase leading-none text-white glow-text-theme flex items-center gap-3">
                 <span [ngClass]="{'rainbow-text': gameData.isCipherMaster()}">{{ gameData.operatorName() }}</span>
                 @if (gameData.earnedBadges().length > 0) {
                     <mat-icon class="text-[color:var(--current-theme-color)] text-[18px]">verified</mat-icon>
                 }
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 pointer-events-auto mt-2">
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

      <!-- Horizons / Node Map Layout -->
      <div #scrollContainer 
           class="absolute inset-0 flex items-center overflow-x-auto overflow-y-hidden gap-x-16 px-[10vw] hide-scrollbar z-10 pt-12 pb-24 cursor-grab active:cursor-grabbing select-none" 
           (wheel)="onWheel($event)"
           (mousedown)="onMouseDown($event)"
           (mouseleave)="onMouseLeave()"
           (mouseup)="onMouseUp()"
           (mousemove)="onMouseMove($event)"
           (touchstart)="onTouchStart($event)"
           (touchend)="onTouchEnd()"
           (touchmove)="onTouchMove($event)">
        
        <!-- Main timeline connector -->
        <div class="absolute top-[50%] left-0 right-0 min-w-max h-[2px] bg-gradient-to-r from-transparent via-[var(--current-theme-color)] to-transparent -translate-y-1/2 z-0 pointer-events-none opacity-20"></div>

        @for (chapter of gameData.chapters(); track chapter.id; let cIndex = $index) {
          
          <div class="relative flex items-center flex-shrink-0 min-w-[70vw] lg:minw-[50vw]">
            
            <div class="grid grid-cols-[auto_1fr] flex-col lg:flex-row gap-12 w-full h-full pb-10">
              
              <!-- Chapter Header Plate -->
              <div class="relative z-20 flex flex-col justify-end pb-8 h-[550px] w-[320px]">
                
                 <!-- Floating Chapter Marker -->
                 <div class="absolute -top-10 -left-10 font-display text-[180px] font-bold text-[var(--current-theme-color)] opacity-30 leading-none select-none z-0 pointer-events-none group-hover:opacity-50 transition-opacity duration-700">
                    0{{chapter.id}}
                 </div>

                 <div class="glass-panel p-8 relative overflow-hidden group transition-all duration-700 z-10 w-full h-[320px] flex flex-col justify-between"
                      [style.borderColor]="getChapterProgress(chapter) === 100 ? 'var(--current-theme-color)' : ''"
                      [style.boxShadow]="getChapterProgress(chapter) === 100 ? '0 0 30px ' + gameData.selectedAvatar().colorHex : ''"
                      [style.backgroundColor]="getChapterProgress(chapter) === 100 ? 'color-mix(in srgb, var(--current-theme-color) 10%, transparent)' : ''"
                      [ngClass]="getChapterProgress(chapter) === 100 ? '' : 'hover:border-white/20'">
                    <div class="flex justify-between items-start">
                       <mat-icon class="text-4xl mb-6 transition-colors duration-700" [ngClass]="getChapterProgress(chapter) === 100 ? 'text-[var(--current-theme-color)]' : 'text-white/20'">
                          {{ getChapterProgress(chapter) === 100 ? 'verified' : getChapterIcon(cIndex) }}
                       </mat-icon>
                       <span class="text-[10px] font-mono tracking-[0.2em] uppercase px-2 py-1 rounded transition-colors duration-700"
                             [style.color]="getChapterProgress(chapter) === 100 ? 'var(--current-theme-color)' : ''"
                             [style.backgroundColor]="getChapterProgress(chapter) === 100 ? 'color-mix(in srgb, var(--current-theme-color) 20%, transparent)' : ''"
                             [ngClass]="getChapterProgress(chapter) === 100 ? '' : 'bg-[color:var(--current-theme-color)]/10 text-[color:var(--current-theme-color)]'">
                          Phase 0{{chapter.id}}
                       </span>
                    </div>

                    <div>
                      <h2 class="font-display text-5xl font-semibold tracking-tight text-white mb-2 leading-none uppercase transition-colors" [innerHTML]="formatChapterTitle(chapter.title, getChapterProgress(chapter) === 100)"></h2>
                      
                      <div class="mt-6">
                        <div class="flex justify-between text-xs font-mono uppercase tracking-widest mb-2 transition-colors" [ngClass]="getChapterProgress(chapter) === 100 ? 'text-[color:var(--current-theme-color)]' : 'text-white/50'">
                           <span>{{ getChapterProgress(chapter) === 100 ? 'Protocol Mastered' : 'Progress' }}</span>
                           <span [ngClass]="getChapterProgress(chapter) === 100 ? 'text-[var(--current-theme-color)]' : 'text-white'">{{ getChapterProgress(chapter) }}%</span>
                        </div>
                        <div class="w-full h-1 bg-surface-dark overflow-hidden mb-4">
                           <div class="h-full transition-all duration-700 ease-out" 
                                [style.backgroundColor]="'var(--current-theme-color)'"
                                [style.boxShadow]="'0 0 10px ' + gameData.selectedAvatar().colorHex"
                                [style.width.%]="getChapterProgress(chapter)"></div>
                        </div>
                        
                        @if (getChapterProgress(chapter) === 100) {
                          <button (click)="downloadChapterCertificate(chapter)" class="w-full mt-2 font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 px-4 py-2 flex items-center justify-center gap-2 rounded transition-all outline-none"
                                  [style.color]="'var(--current-theme-color)'"
                                  [style.borderColor]="'var(--current-theme-color)'"
                                  [style.borderWidth]="'1px'"
                                  [style.backgroundColor]="'color-mix(in srgb, var(--current-theme-color) 10%, transparent)'">
                             <mat-icon class="text-[16px]">military_tech</mat-icon> Download Certificate
                          </button>
                        }
                      </div>
                    </div>
                 </div>
              </div>

              <!-- Mission Gallery -->
              <div class="relative z-10 flex items-center gap-6 overflow-visible py-16 h-[550px] w-max pr-12">
                @for (mission of chapter.missions; track mission.id; let i = $index) {
                  
                  <!-- Mission Card -->
                  <div class="relative group cursor-pointer outline-none w-[260px] h-[360px] flex-shrink-0" 
                       [ngClass]="getMissionVerticalOffset(i)"
                       [attr.data-mission-id]="mission.id"
                       (click)="goToLab(mission.id)" tabindex="0" (keydown.enter)="goToLab(mission.id)">
                    
                    <div class="mission-card-inner absolute inset-0 bg-surface-panel/80 rounded-xl border border-white/10 backdrop-blur-3xl overflow-hidden transition-all duration-500 group-hover:border-white/30 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] group-hover:-translate-y-4 group-focus-visible:-translate-y-4 group-focus-visible:border-[color:var(--current-theme-color)] flex flex-col"
                         [ngClass]="isCompleted(mission.id) && !isJustCompleted(mission.id) ? 'border-[var(--current-theme-color)]/50' : ''"
                         [style.boxShadow]="isCompleted(mission.id) && !isJustCompleted(mission.id) ? '0 0 20px color-mix(in srgb, var(--current-theme-color) 10%, transparent)' : ''">
                      
                      <!-- Mission Identity Area -->
                      <div class="h-36 bg-surface-highlight/50 relative overflow-hidden flex items-center justify-center p-6 border-b border-white/5 transition-colors">
                         
                         <div class="completion-check absolute top-3 right-3 text-[color:var(--current-theme-color)] z-20"
                              [ngStyle]="{ 'opacity': isCompleted(mission.id) && !isJustCompleted(mission.id) ? 1 : 0, 'transform': isCompleted(mission.id) && !isJustCompleted(mission.id) ? 'scale(1)' : 'scale(0.5)' }">
                            <mat-icon class="text-xl" [style.filter]="'drop-shadow(0 0 8px ' + gameData.selectedAvatar().colorHex + ')'" [style.color]="'var(--current-theme-color)'">check_circle</mat-icon>
                         </div>
                         <span class="absolute bottom-2 left-3 font-mono text-[10px] text-white/20 tracking-wider">ID: {{mission.id}}</span>
                         <mat-icon class="mission-icon text-6xl text-white/20 group-hover:text-white group-hover:scale-110 group-focus-visible:scale-110 transition-all duration-500 ease-out" 
                            [ngClass]="isCompleted(mission.id) && !isJustCompleted(mission.id) ? 'text-[color:var(--current-theme-color)]/80' : ''">
                            {{ getIconForMission(i) }}
                         </mat-icon>
                      </div>

                      <!-- Mission Details Area -->
                      <div class="flex-1 p-6 flex flex-col relative z-10 justify-between">
                        <div>
                           <span class="font-mono text-[10px] tracking-[0.2em] uppercase mb-2 block transition-colors"
                                 [ngClass]="isCompleted(mission.id) && !isJustCompleted(mission.id) ? 'text-[color:var(--current-theme-color)]' : 'text-[color:var(--current-theme-color)]'">
                             {{ isCompleted(mission.id) && !isJustCompleted(mission.id) ? 'COMPLETED' : mission.type }}
                           </span>
                           <h3 class="font-sans text-xl font-bold uppercase leading-tight text-white/90 group-hover:text-white transition-colors">{{ mission.name }}</h3>
                        </div>
                        
                        <div class="pt-4 flex items-center justify-between border-t border-white/5 group-hover:border-white/20 transition-colors">
                           <span class="text-xs font-semibold uppercase tracking-widest text-white/40 group-hover:text-white/80 transition-colors">
                             {{ isCompleted(mission.id) && !isJustCompleted(mission.id) ? 'Re-Execute' : 'Execute' }}
                           </span>
                           <mat-icon class="text-sm text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all">
                             {{ isCompleted(mission.id) && !isJustCompleted(mission.id) ? 'refresh' : 'arrow_forward' }}
                           </mat-icon>
                        </div>
                      </div>

                      <!-- Hover accent line -->
                      <div class="mission-accent-line absolute bottom-0 left-0 h-1 bg-[--color-white] w-0 group-hover:w-full transition-all duration-500 ease-out delay-75"
                           [ngStyle]="{ 'width': isCompleted(mission.id) && !isJustCompleted(mission.id) ? '100%' : '', 'backgroundColor': isCompleted(mission.id) && !isJustCompleted(mission.id) ? 'var(--current-theme-color)' : '', 'boxShadow': isCompleted(mission.id) && !isJustCompleted(mission.id) ? '0 0 10px ' + gameData.selectedAvatar().colorHex : '' }"></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Ultimate Capstone / Ascent Module -->
        <div class="flex-shrink-0 ml-12 pr-32 z-20 flex items-center h-[550px] w-max">
          <div (click)="startQuantum()" tabindex="0" (keydown.enter)="startQuantum()" [ngClass]="gameData.isQuantumAscentUnlocked() ? 'cursor-pointer hover:border-[color:var(--current-theme-color)]/80' : 'cursor-not-allowed opacity-50'" class="glass-panel w-[400px] h-[400px] border border-white/10 flex flex-col justify-center items-center relative overflow-hidden group transition-all duration-700">
             <div class="absolute inset-0 bg-gradient-to-b from-transparent to-accent-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             
             <!-- Rotating Rings -->
             <div class="absolute w-[280px] h-[280px] border border-white/5 rounded-full z-0 group-hover:border-[color:var(--current-theme-color)]/20 transition-colors duration-700 group-hover:animate-[spin_20s_linear_infinite]"></div>
             <div class="absolute w-[320px] h-[320px] border border-dashed border-white/5 rounded-full z-0 group-hover:border-[color:var(--current-theme-color)]/10 transition-colors duration-700 group-hover:animate-[spin_30s_linear_infinite_reverse]"></div>

             <div class="z-10 flex flex-col items-center text-center p-8">
                <mat-icon class="text-[64px] w-[64px] h-[64px] text-white/20 mb-6 group-hover:text-[color:var(--current-theme-color)] group-hover:drop-shadow-[0_0_15px_color-mix(in srgb, var(--current-theme-color) 60%, transparent)] transition-all duration-500">{{ gameData.isQuantumAscentUnlocked() ? 'vpn_key' : 'lock' }}</mat-icon>
                <h3 class="font-display text-4xl font-bold uppercase leading-none text-white tracking-widest mb-2">Quantum<br>Ascent</h3>
                <p class="font-sans text-xs tracking-wide uppercase font-semibold" [ngClass]="gameData.isQuantumAscentUnlocked() ? 'text-[color:var(--current-theme-color)] text-pulse animate-pulse' : 'text-white/50'">{{ gameData.isQuantumAscentUnlocked() ? 'Ascend Protocol Ready' : 'Clear All Protocols First' }}</p>
             </div>
          </div>
        </div>

      </div>

      <!-- Bottom Nav / Mastery Status -->
      <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent h-32 flex items-end px-12 pb-8 z-50 pointer-events-none">
        
        <div class="w-full flex justify-between items-end">
          
          <div class="flex flex-col gap-2 items-start pointer-events-auto shadow-2xl">
            <span class="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">Global Completion</span>
            <div class="flex items-center gap-6 bg-surface-dark/90 backdrop-blur-md border border-white/10 px-8 py-4 rounded-full">
              <div class="flex items-baseline gap-1">
                 <span class="font-display text-4xl font-bold text-white">{{ gameData.progressPercentage() }}</span>
                 <span class="font-display text-xl text-white/50">%</span>
              </div>
              
              <div class="w-64 h-1.5 bg-surface-highlight rounded-full overflow-hidden shrink-0">
                <div class="h-full bg-white transition-all duration-1000 ease-out" [style.width.%]="gameData.progressPercentage()"></div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-6 pointer-events-auto">
             <div class="font-sans text-xs text-white/40 tracking-wider">Drag to navigate</div>
             <mat-icon class="text-white/20 animate-bounce">sync_alt</mat-icon>
          </div>

        </div>

      </div>
    </div>
  `
})
export class DashboardComponent implements AfterViewInit {
  gameData = inject(GameDataService);
  router = inject(Router);
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  
  showBadgesOverlay = signal(false);
  showQuantumOverlay = signal(false);
  
  quantumState = signal<'story' | 'puzzle'>('story');
  quantumDialogue = signal<{speaker: string, text: string}[]>([]);
  quantumDialogueFinished = signal(false);
  
  quantumGrid = signal<boolean[]>(Array(9).fill(false));
  quantumSolved = signal(false);
  
  currentQuantumHint = signal<string | null>(null);
  isFetchingQuantumHint = signal(false);
  quantumDialogueTimer: ReturnType<typeof setInterval> | undefined;

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.scrollContainer || !this.scrollContainer.nativeElement) return;
      const justCompleted = this.gameData.justCompletedMissionId();

      if (justCompleted) {
        const el = document.querySelector(`[data-mission-id="${justCompleted}"]`) as HTMLElement;
        if (el) {
          const containerLeft = this.scrollContainer.nativeElement.getBoundingClientRect().left;
          const elLeft = el.getBoundingClientRect().left;
          const scrollPos = elLeft - containerLeft + this.scrollContainer.nativeElement.scrollLeft - (window.innerWidth / 2 - 130);
          this.scrollContainer.nativeElement.scrollTo({ left: scrollPos, behavior: 'smooth' });

          setTimeout(() => {
            import('motion').then(({ animate, spring }) => {
              const overlay = document.getElementById('flash-overlay');
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (overlay) (animate as any)(overlay, { opacity: [0, 0.4, 0] }, { duration: 0.6 });

              const cardInner = el.querySelector('.mission-card-inner');
              const hex = this.gameData.selectedAvatar().colorHex;
              if (cardInner) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (animate as any)(cardInner, 
                  { scale: [1, 1.05, 1], borderColor: ['rgba(255,255,255,0.1)', hex, 'rgba(255,255,255,0.1)'], boxShadow: ['none', '0 0 50px ' + hex, 'none'] }, 
                  { duration: 1, easing: spring() }
                );
              }

              const icon = el.querySelector('.mission-icon');
              if (icon) {
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 (animate as any)(icon, { color: ['rgba(255,255,255,0.2)', hex, hex] }, { duration: 0.8 });
              }

              const check = el.querySelector('.completion-check');
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (check) (animate as any)(check, { opacity: [0, 1], scale: [0, 1.3, 1] }, { duration: 0.8, easing: spring() });

              const line = el.querySelector('.mission-accent-line');
              if (line) {
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 (animate as any)(line, { width: ['0%', '100%'], backgroundColor: ['#ffffff', hex] }, { duration: 0.6, delay: 0.2 });
              }
              
              if (this.gameData.justCompletedChapterId()) {
                  // Screen flashes
                  const flashOverlay = document.getElementById('flash-overlay');
                  if (flashOverlay) {
                     flashOverlay.style.transition = 'none';
                     flashOverlay.style.opacity = '0.8';
                     flashOverlay.style.background = this.gameData.selectedAvatar().colorHex;
                     flashOverlay.style.mixBlendMode = 'overlay';
                     setTimeout(() => {
                         flashOverlay.style.transition = 'opacity 1.5s ease-out';
                         flashOverlay.style.opacity = '0';
                     }, 50);
                     
                     setTimeout(() => {
                         flashOverlay.style.transition = 'none';
                         flashOverlay.style.opacity = '0.5';
                         setTimeout(() => {
                             flashOverlay.style.transition = 'opacity 1.5s ease-out';
                             flashOverlay.style.opacity = '0';
                         }, 50);
                     }, 300);
                  }
                  
                  setTimeout(() => {
                      // Multi-burst confetti
                      const fireworks = confetti.create(undefined, { resize: true, useWorker: true });
                      const count = 300;
                      const defaults = { origin: { y: 0.7 }, colors: [this.gameData.selectedAvatar().colorHex, '#ffffff'] };
                      
                      function fire(particleRatio: number, opts: confetti.Options) {
                        fireworks(Object.assign({}, defaults, opts, {
                          particleCount: Math.floor(count * particleRatio)
                        }));
                      }

                      fire(0.25, { spread: 26, startVelocity: 55 });
                      fire(0.2, { spread: 60 });
                      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
                      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
                      fire(0.1, { spread: 120, startVelocity: 45 });
                  }, 200);
                  setTimeout(() => {
                      confetti({
                          particleCount: 150,
                          spread: 180,
                          angle: 60,
                          origin: { x: 0, y: 0.8 },
                          colors: [this.gameData.selectedAvatar().colorHex, '#ffffff']
                      });
                      confetti({
                          particleCount: 150,
                          spread: 180,
                          angle: 120,
                          origin: { x: 1, y: 0.8 },
                          colors: [this.gameData.selectedAvatar().colorHex, '#ffffff']
                      });
                  }, 800);
              }

              this.gameData.clearJustCompleted();
            });
          }, 800);
        }
      } else {
        this.scrollContainer.nativeElement.scrollTo({ left: 150, behavior: 'smooth' });
        setTimeout(() => {
          this.scrollContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
        }, 600);
      }
    }, 800);
  }

  isCompleted(id: string) { return this.gameData.completedMissions().has(id); }
  isJustCompleted(id: string) { return this.gameData.justCompletedMissionId() === id; }
  goToLab(id: string) { this.router.navigate(['/lab', id]); }

  isDragging = false;
  startX = 0;
  scrollLeftOffset = 0;
  momentumID = 0;
  velX = 0;

  onTouchStart(event: TouchEvent) {
    this.isDragging = true;
    this.startX = event.touches[0].pageX - this.scrollContainer.nativeElement.offsetLeft;
    this.scrollLeftOffset = this.scrollContainer.nativeElement.scrollLeft;
    this.cancelMomentum();
  }
  
  onTouchEnd() {
    this.isDragging = false;
    this.beginMomentum();
  }
  
  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    const x = event.touches[0].pageX - this.scrollContainer.nativeElement.offsetLeft;
    const walk = (x - this.startX) * 1.5;
    const prevScroll = this.scrollContainer.nativeElement.scrollLeft;
    this.scrollContainer.nativeElement.scrollLeft = this.scrollLeftOffset - walk;
    this.velX = this.scrollContainer.nativeElement.scrollLeft - prevScroll;
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.pageX - this.scrollContainer.nativeElement.offsetLeft;
    this.scrollLeftOffset = this.scrollContainer.nativeElement.scrollLeft;
    this.cancelMomentum();
  }

  onMouseLeave() {
    if (this.isDragging) {
      this.isDragging = false;
      this.beginMomentum();
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.beginMomentum();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    const x = event.pageX - this.scrollContainer.nativeElement.offsetLeft;
    const walk = (x - this.startX) * 1.5;
    const prevScroll = this.scrollContainer.nativeElement.scrollLeft;
    this.scrollContainer.nativeElement.scrollLeft = this.scrollLeftOffset - walk;
    this.velX = this.scrollContainer.nativeElement.scrollLeft - prevScroll;
  }

  onWheel(event: WheelEvent) {
    if (this.scrollContainer && this.scrollContainer.nativeElement) {
      this.cancelMomentum();
      this.scrollContainer.nativeElement.scrollLeft += (event.deltaY + event.deltaX) * 1.5;
      event.preventDefault();
    }
  }

  beginMomentum() {
    this.cancelMomentum();
    const step = () => {
      if (Math.abs(this.velX) > 0.5) {
        this.scrollContainer.nativeElement.scrollLeft += this.velX;
        this.velX *= 0.95;
        this.momentumID = requestAnimationFrame(step);
      }
    };
    this.momentumID = requestAnimationFrame(step);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  cancelMomentum() {
    if (this.momentumID) {
      cancelAnimationFrame(this.momentumID);
      this.momentumID = 0;
    }
  }

  getMissionVerticalOffset(index: number) {
    const offsets = ['translate-y-[0px]', 'translate-y-[40px]', 'translate-y-[-20px]', 'translate-y-[60px]', 'translate-y-[10px]'];
    return offsets[index % offsets.length];
  }

  getIconForMission(index: number) {
    const icons = ['swap_horiz', 'extension', 'sort_by_alpha', 'key', 'fingerprint'];
    return icons[index % icons.length];
  }
  
  getChapterIcon(index: number) {
    const icons = ['shield', 'memory', 'calculate', 'admin_panel_settings'];
    return icons[index % icons.length];
  }

  formatChapterTitle(title: string, isCompleted = false): string {
    const parts = title.split(':');
    const colorClass = isCompleted ? 'text-[color:var(--current-theme-color)]' : 'text-white/50';
    return parts[0] + `<br/><span class="${colorClass} text-4xl">` + (parts[1] ? parts[1].trim() : '') + '</span>';
  }

  getCompletedInChapter(chapter: Chapter): number {
    return chapter.missions.filter((m: Mission) => this.isCompleted(m.id)).length;
  }

  getChapterProgress(chapter: Chapter): number {
    const total = chapter.missions.length;
    const completed = this.getCompletedInChapter(chapter);
    return Math.round((completed / total) * 100) || 0;
  }
  
  downloadChapterCertificate(chapter: Chapter) {
      const canvas = document.createElement('canvas');
      canvas.width = 1000; canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          // Dark void background
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, 0, 1000, 700);
          
          // Outer Tech Border
          ctx.strokeStyle = '#222222';
          ctx.lineWidth = 4;
          ctx.strokeRect(30, 30, 940, 640);
          
          // Inner Neon Box (using selected theme color)
          const themeColor = this.gameData.selectedAvatar().colorHex;
          ctx.strokeStyle = themeColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(40, 40, 920, 620);
          
          // Corner accents
          ctx.fillStyle = themeColor;
          ctx.fillRect(35, 35, 20, 5); ctx.fillRect(35, 35, 5, 20); // Top Left
          ctx.fillRect(945, 35, 20, 5); ctx.fillRect(960, 35, 5, 20); // Top Right
          ctx.fillRect(35, 660, 20, 5); ctx.fillRect(35, 645, 5, 20); // Bottom Left
          ctx.fillRect(945, 660, 20, 5); ctx.fillRect(960, 645, 5, 20); // Bottom Right
          
          // Top Security Header
          ctx.textAlign = 'center';
          ctx.fillStyle = themeColor;
          ctx.font = 'bold 20px monospace';
          ctx.fillText('// SYNDICATE NETWORK DEFEATED - SECTOR SECURED //', 500, 80);
          
          // Title
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 64px sans-serif';
          ctx.fillText('PROTOCOL MASTERY', 500, 220);
          
          // Subtitle
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = 'italic 32px sans-serif';
          ctx.fillText('Official Resistance Clearance', 500, 280);
          
          // Chapter Info
          ctx.fillStyle = themeColor;
          ctx.font = '80px sans-serif';
          ctx.fillText(`PHASE 0${chapter.id}`, 500, 410);

          ctx.fillStyle = '#ffffff';
          ctx.font = '24px monospace';
          ctx.fillText(chapter.title.toUpperCase(), 500, 460);
          
          // Operative details
          ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '20px monospace';
          ctx.fillText('OPERATIVE CALLSIGN:', 100, 550);
          ctx.fillText('TIMESTAMP OF CLEARANCE:', 100, 590);
          
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'right';
          ctx.fillText(this.gameData.operatorName().toUpperCase(), 900, 550);
          ctx.fillText(new Date().toLocaleString(), 900, 590);
          
          // Hex decorative elements
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.beginPath();
          ctx.arc(500, 370, 180, 0, Math.PI * 2);
          ctx.fill();
          
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = `cipherquest-clearance-phase${chapter.id}.png`;
          a.click();
      }
  }
  
  downloadBadge(badge: Badge) {
      // Create a canvas to draw the badge certificate
      const canvas = document.createElement('canvas');
      canvas.width = 800; canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          // Inner bg
          const grad = ctx.createLinearGradient(0, 0, 0, 1000);
          grad.addColorStop(0, '#020202');
          grad.addColorStop(1, '#0a0a0c');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 800, 1000);
          
          const themeColor = this.gameData.selectedAvatar().colorHex;

          // Technical grid background
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.lineWidth = 1;
          for(let i = 0; i < 800; i += 40) {
              ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1000); ctx.stroke();
          }
          for(let i = 0; i < 1000; i += 40) {
              ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
          }

          // Complex Border
          ctx.strokeStyle = themeColor;
          ctx.lineWidth = 4;
          ctx.strokeRect(40, 40, 720, 920);
          
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(50, 50, 700, 900);
          
          // Corner accents (cyberpunk style)
          ctx.fillStyle = themeColor;
          const cornerLen = 60; const cornerThick = 6;
          // TL
          ctx.fillRect(30, 30, cornerLen, cornerThick); ctx.fillRect(30, 30, cornerThick, cornerLen);
          // TR
          ctx.fillRect(800-30-cornerLen, 30, cornerLen, cornerThick); ctx.fillRect(800-30-cornerThick, 30, cornerThick, cornerLen);
          // BL
          ctx.fillRect(30, 1000-30-cornerThick, cornerLen, cornerThick); ctx.fillRect(30, 1000-30-cornerLen, cornerThick, cornerLen);
          // BR
          ctx.fillRect(800-30-cornerLen, 1000-30-cornerThick, cornerLen, cornerThick); ctx.fillRect(800-30-cornerThick, 1000-30-cornerLen, cornerThick, cornerLen);
          
          ctx.textAlign = 'center';
          ctx.fillStyle = themeColor;
          ctx.font = 'bold 24px monospace';
          ctx.fillText('// HIGH CLEARANCE INTEL DECRYPTED //', 400, 120);

          // Central Badge Circle
          ctx.save();
          ctx.translate(400, 360);
          ctx.beginPath();
          ctx.arc(0, 0, 120, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.02)';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = themeColor;
          ctx.stroke();
          
          // Inner dotted ring
          ctx.setLineDash([5, 15]);
          ctx.beginPath();
          ctx.arc(0, 0, 100, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          
          ctx.fillStyle = themeColor;
          ctx.font = '60px Arial, sans-serif'; 
          ctx.fillText('★', 400, 380); // Using a star as a safe fallback since Material Icons might not be loaded in canvas context reliably

          // Badge text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 48px sans-serif';
          ctx.fillText(badge.name.toUpperCase(), 400, 560);
          
          // Decoded data and description
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '24px monospace';
          // Split wrap text
          const words = badge.description.split(' ');
          let line = '';
          let y = 640;
          for(let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > 600 && n > 0) {
                  ctx.fillText(line.trim(), 400, y);
                  line = words[n] + ' ';
                  y += 35;
              } else {
                  line = testLine;
              }
          }
          ctx.fillText(line.trim(), 400, y);
          
          // Operative details (Corner 1)
          ctx.textAlign = 'left';
          ctx.fillStyle = themeColor;
          ctx.font = '16px monospace';
          ctx.fillText('OPERATIVE CALLSIGN:', 80, 850);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px monospace';
          ctx.fillText(this.gameData.operatorName().toUpperCase(), 80, 875);
          
          ctx.fillStyle = themeColor;
          ctx.font = '16px monospace';
          ctx.fillText('TIMESTAMP:', 80, 915);
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '18px monospace';
          ctx.fillText(new Date(badge.earnedAt).toLocaleString(), 80, 935);

          // Tags in (Corner 2)
          ctx.textAlign = 'right';
          ctx.fillStyle = themeColor;
          ctx.font = '16px monospace';
          ctx.fillText('CLASSIFICATION TAGS:', 720, 850);
          ctx.fillStyle = '#ffffff';
          ctx.font = '18px monospace';
          ctx.fillText('[ ENCRYPTED ]', 720, 880);
          ctx.fillText(`[ ID: ${badge.id.toUpperCase()} ]`, 720, 905);
          ctx.fillText('[ APPROVED ]', 720, 930);
          
          // Decorative barcode
          ctx.fillStyle = themeColor;
          for(let i=0; i<30; i++) {
              ctx.fillRect(80 + i*10 + (Math.random()*5), 150, Math.random()*5 + 1, 40);
          }
          for(let i=0; i<30; i++) {
              ctx.fillRect(720 - i*10 - (Math.random()*5), 150, Math.random()*5 + 1, 40);
          }

          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = `cipherquest-${badge.id}.png`;
          a.click();
      }
  }
  
  startQuantum() {
      if (!this.gameData.isQuantumAscentUnlocked()) return;
      this.showQuantumOverlay.set(true);
      this.quantumSolved.set(false);
      this.quantumState.set('story');
      this.quantumDialogue.set([]);
      this.quantumDialogueFinished.set(false);
      this.currentQuantumHint.set(null);
      
      const storyLines = [
          { speaker: 'KNOX', text: 'Operator, the Syndicate mainframe is shielded by RSA-2048 asymmetric encryption. It is impenetrable.' },
          { speaker: 'MALIQ', text: 'Nothing is impenetrable if you have the right keys. Or in this case, the right hardware.' },
          { speaker: 'KNOX', text: 'Warning: Unauthorized connection detected. Maliq, how did you bypass the firewall?' },
          { speaker: 'MALIQ', text: 'Nevermind that. I just routed an experimental quantum co-processor to your terminal. Align the qubits into harmonic resonance.' },
          { speaker: 'KNOX', text: 'If the Operator can stabilize the grid, I can execute Shor\'s Algorithm. Awaiting alignment.' }
      ];
      
      let step = 0;
      if (this.quantumDialogueTimer) clearInterval(this.quantumDialogueTimer);
      this.quantumDialogueTimer = setInterval(() => {
          if (step < storyLines.length) {
              this.quantumDialogue.update(d => [...d, storyLines[step]]);
              step++;
          } else {
              this.quantumDialogueFinished.set(true);
              clearInterval(this.quantumDialogueTimer);
          }
      }, 1500);
      
      const grid = Array(9).fill(true);
      const click = (idx: number, g: boolean[]) => {
          const x = idx % 3;
          const y = Math.floor(idx / 3);
          const targets = [
              [x, y], [x-1, y], [x+1, y], [x, y-1], [x, y+1]
          ];
          targets.forEach(([tx, ty]) => {
              if (tx >= 0 && tx < 3 && ty >= 0 && ty < 3) {
                 const tidx = ty * 3 + tx;
                 g[tidx] = !g[tidx];
              }
          });
      };
      
      // Shuffle puzzle to make it winnable
      for(let i=0; i<7; i++) {
         click(Math.floor(Math.random() * 9), grid);
      }
      if (grid.every(v => v)) click(4, grid); // prevent auto-solve
      
      this.quantumGrid.set(grid);
  }

  beginQuantumPuzzle() {
      this.quantumState.set('puzzle');
  }
  
  async requestQuantumHint() {
      if (this.isFetchingQuantumHint()) return;
      this.isFetchingQuantumHint.set(true);
      
      try {
          const gridState = this.quantumGrid().map(b => b ? '1' : '0').join('');
          const response = await fetch('/api/quantum-hint', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gridState })
          });
          const data = await response.json();
          this.currentQuantumHint.set(data.hint || 'Realignment is complex. Trial and error often reveals the pattern.');
      } catch (err) {
          console.error(err);
          this.currentQuantumHint.set('Try focusing on the corners first to clear the center.');
      } finally {
          this.isFetchingQuantumHint.set(false);
      }
  }

  toggleQuantumNode(idx: number) {
      if (this.quantumSolved()) return;
      
      const grid = [...this.quantumGrid()];
      const x = idx % 3;
      const y = Math.floor(idx / 3);
      const targets = [
          [x, y], [x-1, y], [x+1, y], [x, y-1], [x, y+1]
      ];
      targets.forEach(([tx, ty]) => {
          if (tx >= 0 && tx < 3 && ty >= 0 && ty < 3) {
             const tidx = ty * 3 + tx;
             grid[tidx] = !grid[tidx];
          }
      });
      this.quantumGrid.set(grid);
      
      if (grid.every(v => v)) {
         this.quantumSolved.set(true);
         // Visual effect for finishing
         setTimeout(() => {
             confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 },
                colors: [this.gameData.selectedAvatar().colorHex, '#ffffff']
             });
         }, 200);
      }
  }
  
  closeQuantumOverlay() {
      this.showQuantumOverlay.set(false);
      if (this.quantumDialogueTimer) clearInterval(this.quantumDialogueTimer);
  }
}
