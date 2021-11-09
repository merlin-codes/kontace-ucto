"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshIt = void 0;
function refreshIt(client, token) {
    return new Promise((r, rej) => {
        if (token.refresh_token) {
            client.refreshAccessToken((e, token) => {
                if (e)
                    console.log(e);
                console.log(`token is: ${token}`);
                r(token);
            });
        }
        else
            throw new Error("Token can't be refreshed");
    });
}
exports.refreshIt = refreshIt;
