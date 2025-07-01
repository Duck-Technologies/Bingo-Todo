import { AsyncPipe, JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

type ProfileType = {
  businessPhones?: string,
  displayName?: string,
  givenName?: string,
  jobTitle?: string,
  mail?: string,
  mobilePhone?: string,
  officeLocation?: string,
  preferredLanguage?: string,
  surname?: string,
  userPrincipalName?: string,
  id?: string
}

@Component({
  selector: 'app-profile-page',
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePage {
  private http = inject(HttpClient);
  
  public profile$: Observable<ProfileType> = this.http.get<ProfileType>('https://graph.microsoft.com/v1.0/me');
  public books$: Observable<any[]> = this.http.get<any[]>(`${environment.BingoApi.Uri}/books`);

}
