import { Inject, inject, Injectable } from '@angular/core';
import { MsalBroadcastService, MsalService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, RedirectRequest } from '@azure/msal-browser';
import { filter, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthOperations {

  private msalBroadcastService = inject(MsalBroadcastService);
  private authService = inject(MsalService);
  public activeAccountChanged$ = new Subject<boolean>();

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration
  ) { 
    this.authService.handleRedirectObservable().subscribe();

    this.authService.instance.enableAccountStorageEvents(); // Optional - This will enable ACCOUNT_ADDED and ACCOUNT_REMOVED events emitted when a user logs in or out of another tab or window
    this.msalBroadcastService.inProgress$
      .pipe(
        filter(
          (status: InteractionStatus) => status === InteractionStatus.None
        ),
        tap(_ => {
          const activeAccounts = this.authService.instance.getAllAccounts();

          if (!this.authService.instance.getActiveAccount() && activeAccounts.length) {
            this.authService.instance.setActiveAccount(activeAccounts[0]);
            this.activeAccountChanged$.next(true);
          }
        })
      ).subscribe();
  }



    public loginRedirect() {
      if (this.msalGuardConfig.authRequest) {
        this.authService.loginRedirect({
          ...this.msalGuardConfig.authRequest,
        } as RedirectRequest);
      } else {
        this.authService.loginRedirect();
      }
    }

    public logout(popup?: boolean) {
        this.authService.logoutRedirect();
    }
}
