import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { GameDataService } from './game-data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { GoogleGenAI } from "@google/genai";

interface DialogueLine {
  speaker: string;
  text: string;
}

@Component({
  selector: 'app-lab',
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
          <button routerLink="/dashboard" class="text-white/40 hover:text-white transition-all duration-300 p-2 flex items-center justify-center group outline-none">
            <div class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[color:var(--current-theme-color)] group-hover:bg-[color:var(--current-theme-color)]/10 transition-colors shadow-lg">
              <mat-icon class="text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
            </div>
            <span class="ml-4 font-sans font-bold tracking-[0.2em] text-[11px] uppercase group-hover:text-[color:var(--current-theme-color)] transition-colors">Abort & Retreat</span>
          </button>
        </div>

        <div class="flex items-center gap-8">
          <div class="flex flex-col items-end">
            <span class="font-mono text-[9px] uppercase tracking-[0.3em] transition-colors duration-500" [ngClass]="missionState() === 'failed' ? 'text-accent-magenta' : 'text-[color:var(--current-theme-color)]'">System Integrity //</span>
            <div class="h-1.5 w-64 bg-surface-panel overflow-hidden mt-2 flex rounded-full">
              <div class="h-full shadow-[0_0_15px_currentColor] transition-all duration-500 ease-out" 
                   [ngClass]="missionState() === 'failed' ? 'bg-accent-magenta' : 'bg-[color:var(--current-theme-color)]'"
                   [style.width.%]="energy()"></div>
            </div>
          </div>
          <div class="w-14 h-14 flex items-center justify-center glass-panel border rounded-lg transition-colors duration-500" [ngClass]="missionState() === 'failed' ? 'border-accent-magenta/50' : 'border-[color:var(--current-theme-color)]/30'">
            <mat-icon class="text-3xl transition-colors duration-500" 
                      [ngClass]="missionState() === 'failed' ? 'text-accent-magenta drop-shadow-[0_0_10px_rgba(255,0,92,0.8)]' : 'text-[color:var(--current-theme-color)] drop-shadow-[0_0_20px_color-mix(in srgb, var(--current-theme-color) 80%, transparent)]'" 
                      [class.animate-pulse]="energy() < 50">shield</mat-icon>
          </div>
        </div>
      </header>

      @if (mission()) {
        <div class="flex-1 overflow-y-auto overflow-x-hidden z-10 flex flex-col items-center py-12 relative hide-scrollbar">
          <div class="w-full max-w-[1400px] px-8 flex flex-col xl:flex-row gap-16 items-stretch min-h-full">
            
            @if (missionState() === 'intercept' || missionState() === 'story') {
                <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
                   <div class="bg-surface-dark/90 border border-white/10 rounded-xl p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                       <div class="absolute top-0 left-0 w-1 h-full bg-accent-magenta"></div>
                       
                       @if (missionState() === 'intercept') {
                           <div class="flex flex-col items-center justify-center py-20 text-center">
                              <mat-icon class="text-6xl text-white/20 animate-spin mb-6">radar</mat-icon>
                              <h2 class="font-display font-bold uppercase tracking-[0.3em] text-white/50 text-2xl">Intercepting Comms...</h2>
                              <p class="font-mono text-xs text-[color:var(--current-theme-color)] mt-4 animate-pulse">> Routing through proxy...</p>
                           </div>
                       } @else if (missionState() === 'story') {
                           <div class="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
                              <mat-icon class="text-accent-magenta animate-pulse text-[20px]">warning</mat-icon>
                              <h2 class="font-sans text-xs tracking-[0.4em] uppercase text-accent-magenta font-bold">Unsecured Channel Intercepted</h2>
                           </div>
                           
                           <div class="flex flex-col gap-8 mb-12 min-h-[200px]">
                              @for (line of visibleDialogue(); track $index) {
                                  <div class="flex flex-col animate-in fade-in slide-in-from-bottom border-l-2 pl-6" 
                                       [ngClass]="line.speaker.toUpperCase().includes('MALIQ') ? 'border-accent-magenta bg-accent-magenta/5 p-4 rounded-r-lg' : 'border-[color:var(--current-theme-color)] bg-[color:var(--current-theme-color)]/5 p-4 rounded-r-lg'">
                                     <span class="font-mono text-[10px] tracking-widest uppercase mb-2 flex items-center gap-2"
                                           [ngClass]="line.speaker.toUpperCase().includes('MALIQ') ? 'text-accent-magenta' : 'text-[color:var(--current-theme-color)]'">
                                        <mat-icon class="text-[14px]">
                                           {{ line.speaker.toUpperCase().includes('MALIQ') ? 'warning' : 'admin_panel_settings' }}
                                        </mat-icon>
                                        {{ line.speaker.toUpperCase().includes('MALIQ') ? 'MALIQ [HACKER]' : 'KNOX [ASSISTANT]' }}
                                     </span>
                                     <p class="font-sans text-xl leading-relaxed text-white/90">
                                         @if (line.speaker.toUpperCase().includes('KNOX') && operatorName) {
                                             <span class="text-[color:var(--current-theme-color)] mr-1 font-bold">{{ operatorName }},</span>
                                         }
                                         {{ line.text }}
                                     </p>
                                  </div>
                              }
                           </div>
                           
                           <div class="flex justify-end pt-8 border-t border-white/5">
                              <button (click)="engageCipher()" class="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-sans font-bold uppercase tracking-[0.2em] text-[12px] py-4 px-10 rounded transition-all duration-300 outline-none flex items-center gap-3 group">
                                Deploy Defense Protocol <mat-icon class="text-[18px] group-hover:translate-x-1 transition-transform border border-transparent rounded-full overflow-hidden">send</mat-icon>
                              </button>
                           </div>
                       }
                   </div>
                </div>
            } @else if (missionState() === 'failed') {
                <div class="flex-1 flex flex-col justify-center items-center text-center max-w-2xl mx-auto w-full animate-in zoom-in fade-in duration-500">
                    <mat-icon class="text-9xl text-accent-magenta drop-shadow-[0_0_50px_rgba(255,0,92,0.6)] mb-8">gpp_bad</mat-icon>
                    <h1 class="font-display text-6xl uppercase font-bold text-white tracking-widest mb-4">Integrity Compromised</h1>
                    <p class="font-mono text-white/50 tracking-wider mb-12 leading-relaxed">The Syndicate breached our defenses. Data package stolen. We must fortify and try again.</p>
                    
                    <div class="flex gap-6">
                       <button (click)="returnToDashboard()" class="border border-white/10 hover:border-white/30 hover:bg-white/5 text-white py-4 px-8 tracking-widest uppercase text-xs font-bold transition-all w-48">Abandon</button>
                       <button (click)="retryMission()" class="bg-accent-magenta hover:bg-accent-magenta/80 text-white py-4 px-8 tracking-widest uppercase text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,0,92,0.4)] w-48">Re-Deploy</button>
                    </div>
                </div>
            } @else {
                <!-- Left Column: Mission Brief & Tactical logs -->
                <div class="flex-1 flex flex-col gap-8 max-w-[500px]">
                  
                  <div>
                    <div class="font-mono text-[color:var(--current-theme-color)] text-[10px] tracking-[0.3em] mb-3 flex items-center gap-3 uppercase">
                       <span class="w-2 h-2 bg-[color:var(--current-theme-color)] animate-pulse rounded-full shadow-[0_0_8px_var(--color-accent-cyan)]"></span>
                       Active Operation_
                    </div>
                    <h1 class="font-display text-[64px] font-bold uppercase tracking-wide leading-[0.9] text-white drop-shadow-2xl">{{ mission()?.name }}</h1>
                    <p class="text-white/40 font-sans text-sm mt-8 border-l-2 border-l-accent-cyan/50 pl-5 leading-relaxed tracking-wide">{{ mission()?.description }}</p>
                  </div>

                  <!-- Terminal Output (Helper Logs) -->
                  <div class="flex-1 min-h-[300px] glass-panel p-6 flex flex-col relative overflow-hidden group border border-white/5 shadow-2xl rounded-xl">
                    <div class="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 to-transparent opacity-50 z-0 pointer-events-none"></div>
                    
                    <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-6 relative z-10">
                       <div class="flex items-center gap-3">
                         <mat-icon class="text-[18px] text-white/50">terminal</mat-icon>
                         <span class="font-sans font-bold tracking-[0.2em] text-white/50 uppercase text-[10px]">Command Feed</span>
                       </div>
                       <span class="font-mono text-white/20 text-[10px] tracking-widest">>>SYS:ROOT</span>
                    </div>
                    
                    <div class="relative z-10 space-y-3 font-mono text-[11px] leading-relaxed flex flex-col h-full">
                      <p class="text-[color:var(--current-theme-color)]/40">>> Firewall online.</p>
                      
                      @if (dialogue().length > 0) {
                         <p class="text-white/40 italic mb-4">"{{ dialogue()[1]?.text || 'Defend the data.' }}"</p>
                      }
                      
                      <div class="mt-2 border border-[color:var(--current-theme-color)]/20 bg-[color:var(--current-theme-color)]/5 p-3 rounded mb-4">
                         <span class="text-[color:var(--current-theme-color)] font-bold tracking-[0.2em] uppercase text-[9px]">> Known Protocol Parameters:</span>
                         <div class="text-white mt-1 font-mono text-[11px]">{{ missionRuleParam }}</div>
                      </div>
                      
                      <div class="mt-auto pt-4 border-t border-white/5">
                         @if (currentHint()) {
                             <div class="bg-surface-dark border border-[var(--current-theme-color)]/30 p-4 rounded mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
                                <div class="absolute inset-0 bg-[var(--current-theme-color)]/5 opacity-50"></div>
                                <div class="relative z-10 flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                                  <p class="text-[var(--current-theme-color)] uppercase tracking-widest font-bold flex items-center gap-2 text-[10px]"><mat-icon class="text-[14px]">lightbulb</mat-icon> Tactical Intel [{{hintIndex + 1}}/{{hints().length}}]</p>
                                  <button (click)="requestHint()" class="text-[9px] font-bold uppercase tracking-widest text-[var(--current-theme-color)] px-2 py-1 bg-[var(--current-theme-color)]/10 hover:bg-[var(--current-theme-color)]/20 border border-[var(--current-theme-color)]/30 rounded transition-colors shadow-[0_0_10px_var(--current-theme-color)] relative z-20 cursor-pointer">Follow Up Intel</button>
                                </div>
                                <p class="text-white/80 font-mono text-[11px] leading-relaxed relative z-10">{{ currentHint() }}</p>
                             </div>
                         }
                         
                         @if(isFetchingHint()) {
                             <p class="text-[var(--current-theme-color)] text-[11px] animate-pulse font-mono tracking-widest">> Decrypting heuristic hint from AI core...</p>
                         } @else if (!currentHint() && !isSuccess()) {
                             <button (click)="requestHint()" class="text-xs uppercase tracking-widest text-white/50 hover:text-[var(--current-theme-color)] border border-white/10 hover:border-[var(--current-theme-color)] bg-surface-dark px-4 py-2 w-full text-left transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">>> Request Support Intel</button>
                         }
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right Column: The "Engine" / I/O -->
                <div class="flex-[1.5] flex flex-col gap-6 w-full">
                  
                  <!-- Input Data Display -->
                  <div class="bg-surface-panel/50 border border-white/10 backdrop-blur-xl rounded-xl p-10 relative overflow-hidden shadow-xl">
                    <div class="absolute left-0 top-0 h-full w-1 bg-white/20 animate-pulse"></div>
                    
                    <div class="font-sans font-bold text-[10px] text-white/30 uppercase tracking-[0.3em] mb-6 flex justify-between">
                      <span>Intercepted Feed (Plaintext)</span>
                      <mat-icon class="text-[16px] text-accent-magenta">warning</mat-icon>
                    </div>
                    
                    <div class="font-mono text-[42px] leading-[1.2] text-white tracking-[0.1em] break-all">
                      <span class="text-white/10 select-none mr-4">></span>{{ currentPlaintext }}
                    </div>
                  </div>

                  <!-- Data Transfer Connector -->
                  <div class="flex flex-col items-center justify-center -my-6 z-20 h-20 relative">
                     <!-- Data Stream Line -->
                     <div class="w-[2px] h-full bg-gradient-to-b from-accent-cyan/0 via-accent-cyan to-accent-cyan/0 absolute opacity-50"></div>
                     <!-- Data Packet -->
                     <div class="w-1.5 h-6 bg-[color:var(--current-theme-color)] absolute animate-[bounce_2s_infinite] shadow-[0_0_15px_var(--current-theme-color)] rounded-full z-10"></div>
                     
                     <div class="px-6 py-2 bg-surface-dark border border-[color:var(--current-theme-color)]/50 rounded-full relative z-20 flex items-center gap-3 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        <mat-icon class="text-[color:var(--current-theme-color)] text-[16px] animate-[spin_4s_linear_infinite]">settings</mat-icon>
                        <span class="font-mono text-[10px] text-white/70 uppercase tracking-[0.3em]">Processing Node</span>
                        <mat-icon class="text-[color:var(--current-theme-color)] text-[16px]">sync_alt</mat-icon>
                     </div>
                  </div>

                  <!-- Ciphertext Input Area -->
                  <div class="glass-panel p-10 relative shadow-[0_40px_80px_rgba(0,0,0,0.5)] transition-all duration-500 rounded-xl" 
                       [ngClass]="isSuccess() ? 'border shadow-none' : 'border border-[color:var(--current-theme-color)]/30'"
                       [style.borderColor]="isSuccess() ? 'color-mix(in srgb, var(--current-theme-color) 50%, transparent)' : ''"
                       [style.boxShadow]="isSuccess() ? '0 0 50px color-mix(in srgb, var(--current-theme-color) 10%, transparent)' : ''">
                    
                    <div class="absolute left-0 top-0 h-full w-1 transition-colors duration-500" [ngClass]="isSuccess() ? 'bg-[color:var(--current-theme-color)]' : 'bg-[color:var(--current-theme-color)]'"></div>

                    <div class="font-sans font-bold text-[10px] uppercase tracking-[0.3em] mb-8 flex justify-between" 
                         [ngClass]="isSuccess() ? 'text-[color:var(--current-theme-color)]' : 'text-[color:var(--current-theme-color)]'">
                      <span>Encryption Protocol</span>
                      @if (isSuccess()) { <span>[PROTOCOL SECURED]</span> }
                      @else { <span class="animate-pulse">[AWAITING ENCRYPTION]</span> }
                    </div>

                    <div class="relative flex items-center bg-surface-dark/50 rounded-lg p-6 border border-white/5 focus-within:border-white/20 transition-colors">
                      <span class="font-mono text-[32px] text-white/20 select-none mr-4">></span>
                      <input 
                        type="text"
                        [(ngModel)]="userInput"
                        (input)="userInput = userInput.toUpperCase()"
                        (keydown.enter)="!isSuccess() && verify()"
                        [disabled]="isSuccess()"
                        class="w-full bg-transparent text-white font-mono text-[40px] tracking-[0.1em] outline-none uppercase placeholder:text-white/10"
                        placeholder="ENTER CIPHER..."
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
                    <div class="mt-8 flex justify-end">
                      @if (!isSuccess()) {
                        <button (click)="verify()" class="bg-[color:var(--current-theme-color)] text-surface-dark font-sans font-bold uppercase tracking-[0.2em] text-[14px] py-5 px-14 rounded transition-all duration-300 hover:shadow-[0_0_30px_color-mix(in srgb, var(--current-theme-color) 40%, transparent)] hover:-translate-y-1 active:translate-y-0 active:scale-95 outline-none focus-visible:ring-4 ring-[color:var(--current-theme-color)]/50">
                          EXECUTE CIPHER
                        </button>
                      } @else {
                        <button (click)="returnToDashboard()" class="relative overflow-hidden text-surface-dark font-sans font-bold uppercase tracking-[0.2em] text-[14px] py-5 px-14 rounded hover:bg-white transition-all duration-300 outline-none group focus-visible:ring-4"
                                [style.backgroundColor]="'var(--current-theme-color)'"
                                [style.boxShadow]="'0 0 30px color-mix(in srgb, var(--current-theme-color) 40%, transparent)'"
                                [style.ringColor]="'color-mix(in srgb, var(--current-theme-color) 50%, transparent)'">
                          <div class="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                          RESUME OPERATIONS
                        </button>
                      }
                    </div>
                    
                    @if (isSuccess()) {
                      <div class="absolute inset-0 bg-[color:var(--current-theme-color)]/5 mix-blend-screen pointer-events-none rounded-xl"></div>
                    }
                  </div>

                </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class LabComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  gameData = inject(GameDataService);
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY }); // Assuming GEMINI_API_KEY is available globally from globals.d.ts

  missionId = this.route.snapshot.paramMap.get('id');
  mission = computed(() => {
    for (const chapter of this.gameData.chapters()) {
      const found = chapter.missions.find(m => m.id === this.missionId);
      if (found) return found;
    }
    return null;
  });

  missionState = signal<'intercept' | 'story' | 'cipher' | 'failed'>('intercept');
  dialogue = signal<DialogueLine[]>([]);
  visibleDialogue = signal<DialogueLine[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dialogueTimer: any;
  energy = signal(100);
  userInput = '';
  isSuccess = signal(false);
  errorMsg = signal('');
  
  attempts = 0;
  startTime = 0;

  get operatorName() { return this.gameData.operatorName(); }
  
  currentPlaintext = '';
  expectedCiphertext = '';
  missionRuleParam = ''; 
  
  currentHint = signal<string | null>(null);
  hints = signal<string[]>([]);
  hintIndex = 0;
  isFetchingHint = signal(false);

  ngOnInit() {
    this.startMissionSequence();
  }
  
  async startMissionSequence() {
      this.attempts = 0;
      this.startTime = Date.now();
      this.missionState.set('intercept');
      this.generatePuzzleLevel();
      await this.generateStoryContext();
      this.missionState.set('story');
  }

  async generatePuzzleLevel() {
    const m = this.mission();
    if (!m) return;

    try {
        const rxjs = await import('rxjs');
        const res = await rxjs.firstValueFrom(this.http.get<{plaintext: string, expectedCiphertext: string, rule: string}>(`/api/mission/${m.id}`));
        if (res) {
            this.currentPlaintext = res.plaintext;
            this.expectedCiphertext = res.expectedCiphertext;
            this.missionRuleParam = res.rule;
            return;
        }
    } catch (error) {
        console.error("Backend failed, using fallback:", error);
    }
    
    // Fallback logic
    const category = ["FIREWALL", "ENCRYPT", "SYSTEM"];
    this.currentPlaintext = category[Math.floor(Math.random() * category.length)];
    this.expectedCiphertext = this.currentPlaintext.split('').reverse().join('');
    this.missionRuleParam = "REVERSE STRING";
  }

  async generateStoryContext() {
      const m = this.mission();
      if (!m) return;
      
      try {
          const prompt = `You are generating a short two line dialogue sequence in a cyberwar between a hacker 'MALIQ' (taunting) and a defensive sysadmin AI 'KNOX' (responding). 
          The current defensive mechanism is "${m.name}".
          Do NOT explain how the cipher works, do NOT mention the plaintext "${this.currentPlaintext}" or the ciphertext. 
          Line 1: MALIQ taunts or threatens.
          Line 2: KNOX responds tersely that the ${m.name} protocol is engaging. 
          Make it sound like a cool sci-fi cyber thriller.
          Return ONLY a JSON array of two objects exactly like this: [{"speaker": "MALIQ", "text": "taunt"}, {"speaker": "KNOX", "text": "response"}]`;
          
          const response = await this.ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                  responseMimeType: "application/json"
              }
          });
          
          let responseText = response.text || "[]";
          if (responseText.startsWith('```json')) {
              responseText = responseText.replace(/```json\n?/, '').replace(/```\n?$/, '');
          } else if (responseText.startsWith('```')) {
              responseText = responseText.replace(/```\n?/, '').replace(/```\n?$/, '');
          }
          const parsed = JSON.parse(responseText.trim());
          this.dialogue.set(parsed);
      } catch (error: unknown) {
          console.error("Story API error", error);
          this.dialogue.set([
             { speaker: 'MALIQ', text: 'I see your data. It is unguarded.' },
             { speaker: 'KNOX', text: `Deploying ${m.name} to secure operations.` }
          ]);
      }
      
      this.visibleDialogue.set([]);
      if (this.dialogueTimer) clearInterval(this.dialogueTimer);
      
      let step = 0;
      const allLines = this.dialogue();
      this.dialogueTimer = setInterval(() => {
          if (step < allLines.length) {
              this.visibleDialogue.update(d => [...d, allLines[step]]);
              step++;
          } else {
              clearInterval(this.dialogueTimer);
          }
      }, 1500);
  }

  engageCipher() {
      if (this.dialogueTimer) clearInterval(this.dialogueTimer);
      this.missionState.set('cipher');
  }
  
  retryMission() {
      if (this.dialogueTimer) clearInterval(this.dialogueTimer);
      this.energy.set(100);
      this.userInput = '';
      this.errorMsg.set('');
      this.currentHint.set(null);
      this.startMissionSequence();
  }

  requestHint() {
      if (this.hints().length > 0) {
          this.hintIndex = (this.hintIndex + 1) % this.hints().length;
          this.currentHint.set(this.hints()[this.hintIndex]);
      } else {
          this.fetchHints();
      }
  }

  http = inject(HttpClient);

  async fetchHints() {
    if (this.isFetchingHint()) return;
    this.isFetchingHint.set(true);

    try {
        const reqBody = {
           plaintext: this.currentPlaintext,
           expectedCiphertext: this.expectedCiphertext,
           rule: this.missionRuleParam,
           userInput: this.userInput
        };
        
        // Ensure there is some input logic sent
        this.http.post<{hints: string[]}>('/api/hint', reqBody).subscribe({
           next: (res) => {
               if (res.hints && res.hints.length) {
                   this.hints.set(res.hints);
                   this.hintIndex = 0;
                   this.currentHint.set(this.hints()[0]);
               }
               this.isFetchingHint.set(false);
           },
           error: (err) => {
               console.error("Hint API error", err);
               this.currentHint.set('Analyze the parameters carefully to find the pattern. Match the length and format.');
               this.isFetchingHint.set(false);
           }
        });
    } catch (error: unknown) {
        console.error("Hint fetch error", error);
        this.isFetchingHint.set(false);
    }
  }

  applyCaesar(text: string, shift: number): string {
    return text.split('').map(c => {
      if (c >= 'A' && c <= 'Z') {
        let n = c.charCodeAt(0) - 65 + shift;
        while(n < 0) n += 26;
        return String.fromCharCode((n % 26) + 65);
      }
      return c;
    }).join('');
  }

  applyAtbash(text: string): string {
    return text.split('').map(c => c >= 'A' && c <= 'Z' ? String.fromCharCode(90 - (c.charCodeAt(0) - 65)) : c).join('');
  }

  applyMonoalphabetic(text: string): string {
    const map: Record<string, string> = {'A':'Q','B':'W','C':'E','D':'R','E':'T','F':'Y','G':'U','H':'I','I':'O','J':'P','K':'A','L':'S','M':'D','N':'F','O':'G','P':'H','Q':'J','R':'K','S':'L','T':'Z','U':'X','V':'C','W':'V','X':'B','Y':'N','Z':'M'};
    return text.split('').map(c => map[c] || c).join('');
  }

  applyFixedNumber(text: string): string {
    return text.split('').map(c => c >= 'A' && c <= 'Z' ? (c.charCodeAt(0) - 65 + 10).toString() : c).join('');
  }

  applyAlternating(text: string, s1: number, s2: number): string {
    return text.split('').map((c, i) => this.applyCaesar(c, i % 2 === 0 ? s1 : s2)).join('');
  }

  applyPositional(text: string): string {
    return text.split('').map((c, i) => this.applyCaesar(c, i + 1)).join('');
  }

  applyVowelScrambler(text: string): string {
    const v: Record<string, string> = { 'A':'1', 'E':'2', 'I':'3', 'O':'4', 'U':'5' };
    return text.split('').map(c => v[c] || c).join('');
  }

  applyKeyedSub(text: string, key: string): string {
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const mapped = Array.from(new Set((key + alpha).split(''))).join('');
    return text.split('').map(c => {
      const idx = alpha.indexOf(c);
      return idx > -1 ? mapped[idx] : c;
    }).join('');
  }

  applyVigenere(text: string, key: string): string {
    return text.split('').map((c, i) => {
      if (c >= 'A' && c <= 'Z') {
        const shift = key[i % key.length].charCodeAt(0) - 65;
        return this.applyCaesar(c, shift);
      }
      return c;
    }).join('');
  }

  applyAffine(text: string, a: number, b: number): string {
    return text.split('').map(c => {
      if (c >= 'A' && c <= 'Z') {
        const x = c.charCodeAt(0) - 65;
        return String.fromCharCode(((a * x + b) % 26) + 65);
      }
      return c;
    }).join('');
  }

  applyPermutation(text: string): string {
    const evens = text.split('').filter((_, i) => i % 2 === 0).join('');
    const odds = text.split('').filter((_, i) => i % 2 !== 0).join('');
    return evens + odds;
  }

  applyBlockedRotate(text: string, blockSize: number, shift: number): string {
    let result = '';
    for (let i = 0; i < text.length; i += blockSize) {
      const block = text.slice(i, i + blockSize);
      const reversedBlock = block.split('').reverse().join('');
      result += this.applyCaesar(reversedBlock, shift);
    }
    return result;
  }

  applyPairing(text: string): string {
    let res = "";
    for(let i=0; i<text.length; i+=2) {
      if(i+1 < text.length) {
         const v1 = text.charCodeAt(i)-65;
         const v2 = text.charCodeAt(i+1)-65;
         res += String.fromCharCode(((v1+v2)%26)+65);
         res += String.fromCharCode(((v1*v2)%26)+65);
      } else {
         res += text[i];
      }
    }
    return res;
  }

  applyRotateAdd(text: string): string {
    const rev = text.split('').reverse();
    return text.split('').map((c, i) => {
        const shift = rev[i].charCodeAt(0) - 65;
        return this.applyCaesar(c, shift);
    }).join('');
  }

  applyEncryptAdditively(text: string): string {
    const shifts = [1, 3, 5, 7];
    const shifted = text.split('').map((c, i) => this.applyCaesar(c, shifts[i % shifts.length])).join('');
    return shifted.split('').reverse().join('');
  }

  applyMiniRsa(text: string): string {
    return text.split('').map(c => {
      if (c >= 'A' && c <= 'Z') {
        const m = c.charCodeAt(0) - 65; // 0-25
        const c_enc = Math.pow(m, 3) % 26; // a=3, n=26 simplified
        return String.fromCharCode(c_enc + 65);
      }
      return c;
    }).join('');
  }

  applyMerkle(text: string): string {
    let hash = 0;
    for(let i=0; i<text.length; i++) {
       const val = text.charCodeAt(i) - 65;
       hash = (hash + val * 3 + 7) % 26;
    }
    return String.fromCharCode(hash + 65) + String.fromCharCode((hash*2)%26 + 65);
  }

  verify() {
    this.attempts++;
    if (this.userInput.trim().toUpperCase() === this.expectedCiphertext) {
      this.isSuccess.set(true);
      this.errorMsg.set('');
      if (this.missionId) {
        const timeMs = Date.now() - this.startTime;
        this.gameData.saveMissionProgress(this.missionId, this.attempts, timeMs);
      }
    } else {
      const currentE = this.energy();
      const newE = Math.max(0, currentE - 34); // takes ~3 tries to fail
      this.energy.set(newE);
      
      this.errorMsg.set('INTEGRITY FAILURE: MISMATCH DETECTED.');
      this.userInput = '';
      
      if (newE === 0) {
        this.missionState.set('failed');
      } else {
         // Auto fetch hint on failure to help them
         this.requestHint();
      }
    }
  }

  returnToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
