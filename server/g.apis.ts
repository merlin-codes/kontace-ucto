import fs, { PathOrFileDescriptor } from "fs";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import readline from "readline";

function getNewToken(client: OAuth2Client) {
    const AUTH_URL = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/classroom.courses.readonly']
    })
    console.log('Authorize app using '+AUTH_URL);
    
    return {url: AUTH_URL, client: client};
}

export async function authorize(credit: any, T_PATH: string) {
    const {client_secret, client_id, redirect_uris} = credit.web;
    let client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    let url: string = "/before";
    let isToken: number = 0;
    let tk: string = "";
    fs.readFile(T_PATH, (e, token) => {
        if (e) isToken = 1;
        else {
            isToken = 2;
            tk = token.toString()
        }
        while (isToken == 0) {
            console.log("I didn't get the fucking token");
        }
        if (isToken == 1) {
            const die = getNewToken(client);
            url = die.url;
            client = die.client
        } else {
            client.setCredentials(JSON.parse(tk))
        }
        return {url: url, client: client};
    })
}
export function LCourses(auth: OAuth2Client) {
    const classroom = google.classroom({version: 'v1', auth});
    classroom.courses.list({
        pageSize: 10,
    }, (err, res) => {
        if (err) return console.error('The API returned an error: ' + err);
        const courses = res ? res.data.courses : [];

        return courses;
    });
  }