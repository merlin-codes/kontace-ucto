import { Credentials, OAuth2Client } from "google-auth-library";
import {IOperation} from "./mod/Operation";

export function refreshIt(client: OAuth2Client, token: Credentials): Promise<Credentials> {
    console.log("something");
    console.log(token);
    return new Promise((r, rej) => {
        if (token.refresh_token) {
            client.refreshAccessToken((e, token) => {
                if (e) console.log(e);
                console.log(`token is: ${token}`);
                
                // @ts-ignore
                r(token);
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


export function correctIt(opt: any, optDB: IOperation[]): number {
    if (opt.length != optDB?.length || !optDB) return 0;

    let correct: number = 0

    if (opt && optDB)
        for (let i = 0; i < opt.length; i++ ) {
            // @ts-ignore 
            if (opt[i].umd == optDB[i].md) correct++;
            // @ts-ignore 
            if (opt[i].ud == optDB[i].d) correct++;
        }
    return correct;
}









