import { Credentials, OAuth2Client } from "google-auth-library";

export function refreshIt(client: OAuth2Client, token: Credentials): Promise<Credentials> {
    return new Promise((r, rej) => {
        if (token.refresh_token) {
            client.refreshAccessToken((e, token) => {
                if (e) console.log(e);
                console.log(`token is: ${token}`);
                
                r(token!);
            })
        } else throw new Error("Token can't be refreshed");
    })
}

export function getCzechVersion(data: string) {
    return data.replace(/Å¾/g, 'ž')
        .replace(/Ã©/g, 'é')
        .replace(/Ä\u008d/g, 'č')
        .replace(/Ãº/, 'ú')
        .replace(/Ã/, 'í')
        .replace(/Å¡/, 'š')
        .replace(/Ã½/, 'ý')
        .replace(/Ã¡/, 'á')
        .replace(/Ãº/, 'ú')
        .replace(/Å¯/, 'ů')
        .replace(/Ã\u009a/, 'Ú')
        .replace(/Å\u0099/, 'ř')
}

export function getNormal(content: string) {
    return content.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}












