import {
    IPublicClientApplication,
    PublicClientApplication,
    InteractionType,
    BrowserCacheLocation,
    LogLevel,
} from '@azure/msal-browser';
import {
    MsalInterceptorConfiguration,
    MsalGuardConfiguration
} from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

function loggerCallback(logLevel: LogLevel, message: string) {
  console.log(message);
}

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.AzureAd.ClientId,
      authority: environment.AzureAd.Authority,
      redirectUri: environment.AzureAd.RedirectUri,
      postLogoutRedirectUri: '/',
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
    system: {
      allowPlatformBroker: false, // Disables WAM Broker
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false,
      },
    },
  });
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set(
    'https://graph.microsoft.com/v1.0/me',
    ['user.read']
  );
  protectedResourceMap.set(
    environment.BingoApi.Uri,
    environment.BingoApi.Scopes
  );

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [...environment.BingoApi.Scopes],
    },
    loginFailedRoute: '/',
  };
}