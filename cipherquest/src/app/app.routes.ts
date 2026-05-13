import { Routes } from '@angular/router';
import { HomeComponent } from './home';
import { DashboardComponent } from './dashboard';
import { LabComponent } from './lab';
import { MultiplayerComponent } from './multiplayer';
import { CipherLabComponent } from './cipher-lab';
import { AuthComponent } from './auth';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'story', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'lab/:id', component: LabComponent },
  { path: 'multiplayer', component: MultiplayerComponent },
  { path: 'cipher-lab', component: CipherLabComponent },
  { path: '**', redirectTo: '' }
];
