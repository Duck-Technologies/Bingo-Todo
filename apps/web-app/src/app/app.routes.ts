import { Routes } from '@angular/router';
import { ProfilePage } from './features/init/profile-page/profile-page';
import { MsalGuard } from '@azure/msal-angular';
import { boardResolver } from './pages/board-page/board-resolver';

export const routes: Routes = [
  // {
  //   path: 'profile',
  //   component: ProfilePage,
  //   canActivate: [MsalGuard],
  // },
  {
    path: 'board/create',
    loadComponent: () =>
      import('./pages/board-setup-page/board-setup').then((m) => m.BoardSetup),
  },
  {
    path: 'board/local',
    loadComponent: () =>
      import('./pages/board-page/board-page').then((m) => m.BoardPage),
    resolve: {
      board: boardResolver,
    },
  },
  // {
  //   path: 'board/:id',
  //   loadComponent: () =>
  //     import('./pages/board-page/board-page').then((m) => m.BoardPage),
  //   resolve: {
  //     board: boardResolver,
  //   },
  //   canActivate: [MsalGuard],
  // },
  {
    path: '**',
    redirectTo: 'board/local',
  },
];
