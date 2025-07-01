import { inject, Injectable } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AccountInfo, EventMessage, EventType } from '@azure/msal-browser';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
  startWith,
} from 'rxjs';
import { AuthOperations } from './auth-operations';

@Injectable({
  providedIn: 'root',
})
export class User {
  private msalBroadcastService = inject(MsalBroadcastService);
  private authService = inject(MsalService);
  private operationsService = inject(AuthOperations);

  public user$: Observable<AccountInfo | null> = combineLatest([
    this.msalBroadcastService.msalSubject$.pipe(
      filter((msg: EventMessage) =>
        (
          [
            EventType.ACCOUNT_ADDED,
            EventType.ACCOUNT_REMOVED,
            EventType.ACTIVE_ACCOUNT_CHANGED,
            EventType.LOGIN_SUCCESS,
            EventType.LOGOUT_SUCCESS,
            EventType.HANDLE_REDIRECT_END,
          ] as EventType[]
        ).includes(msg.eventType)
      )
    ),
    this.operationsService.activeAccountChanged$,
  ]).pipe(
    startWith(this.authService.instance.getActiveAccount()),
    map((_) => this.authService.instance.getActiveAccount()),
    distinctUntilChanged((prev, curr) => prev?.homeAccountId === curr?.homeAccountId),
    shareReplay(1)
  );
}
