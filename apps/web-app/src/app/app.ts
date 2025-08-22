import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { User } from './core/auth/user';
import { AsyncPipe } from '@angular/common';
import { AuthOperations } from './core/auth/auth-operations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { GameModeIcon } from './features/game-mode-icon/game-mode-icon';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    AsyncPipe,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    GameModeIcon
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private userProvider = inject(User);
  private authOperations = inject(AuthOperations);
  public user$ = this.userProvider.user$;

  protected title = 'web-app';

  public login() {
    this.authOperations.loginRedirect();
  }

  public logout() {
    this.authOperations.logout();
  }
}
