export interface Configuration {
    AzureAd: AzureAd;
    BingoApi: BingoApi;
}

interface AzureAd {
    ClientId: string;
    Authority: string;
    RedirectUri: string;
}

interface BingoApi {
    Uri: string;
    Scopes: string[];
}