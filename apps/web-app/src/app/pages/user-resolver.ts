import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { User } from '../core/auth/user';
import { Observable } from 'rxjs';
import { AccountInfo } from '@azure/msal-browser';

export const userResolver: ResolveFn<Observable<AccountInfo | null>> = (
  route,
  state
) => {
  const userService = inject(User);

  return userService.user$;
};
