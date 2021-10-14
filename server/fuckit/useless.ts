import { Credentials, OAuth2Client } from "google-auth-library";

export function refreshIt(client: OAuth2Client, token: Credentials): Promise<Credentials> {
    return new Promise((r, rej) => {
        if (token.refresh_token) {
            client.refreshAccessToken((e, token) => {
                if (e) console.log(e);
                console.log(`token is: ${token}`);
                
                r(token!);
            })
        }
    })
}