"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNormal = exports.getCzechVersion = exports.refreshIt = void 0;
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
function getCzechVersion(data) {
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
        .replace(/Å\u0099/, 'ř');
}
exports.getCzechVersion = getCzechVersion;
function getNormal(content) {
    return content.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
exports.getNormal = getNormal;
