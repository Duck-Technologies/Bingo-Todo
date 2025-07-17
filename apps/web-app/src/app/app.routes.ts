import { Routes } from '@angular/router';
import { ProfilePage } from './features/init/profile-page/profile-page';
import { Home } from './features/init/home/home';
import { MsalGuard } from '@azure/msal-angular';
import { Board } from './features/board/board';

export const routes: Routes = [
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [MsalGuard],
  },
  {
    path: '**',
    component: Home,
  },
];
