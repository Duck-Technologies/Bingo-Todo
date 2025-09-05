import { Routes } from '@angular/router';
import { ProfilePage } from './features/init/profile-page/profile-page';
import { MsalGuard } from '@azure/msal-angular';
import { boardResolver } from './pages/board-page/board-resolver';
import { boardToCopyResolver } from './pages/board-setup-page/board-resolver';
import { userResolver } from './pages/user-resolver';

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
    resolve: {
      user: userResolver,
    },
  },
  {
    path: 'board/copy/local',
    loadComponent: () =>
      import('./pages/board-setup-page/board-setup').then((m) => m.BoardSetup),
    resolve: {
      board: boardToCopyResolver,
    },
  },
  {
    path: 'board/copy/:id',
    loadComponent: () =>
      import('./pages/board-setup-page/board-setup').then((m) => m.BoardSetup),
    resolve: {
      board: boardToCopyResolver,
      user: userResolver,
    },
    canActivate: [MsalGuard],
  },
  {
    path: 'board/local',
    loadComponent: () =>
      import('./pages/board-page/board-page').then((m) => m.BoardPage),
    resolve: {
      board: boardResolver,
    },
  },
  {
    path: 'board/:id',
    loadComponent: () =>
      import('./pages/board-page/board-page').then((m) => m.BoardPage),
    resolve: {
      board: boardResolver,
    },
    canActivate: [MsalGuard],
  },
  {
    path: '**',
    redirectTo: 'board/local',
  },
];
