import { Credentials, OAuth2Client } from "google-auth-library";
import { GoogleAuth } from "googleapis-common";

export function refreshIt(client: OAuth2Client, token: Credentials):Promise<Credentials> {
    return new Promise((r, rej) => {
        client.refreshAccessToken((e, token) => {
            if (e) return rej("fuck it")
            console.log(`token is: ${token}`);
            
            r(token!);
        })
    })
}