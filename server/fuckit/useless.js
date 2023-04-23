"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correctIt = exports.getNormal = exports.getCzechVersion = exports.refreshIt = void 0;
function refreshIt(client, token) {
    console.log("something");
    console.log(token);
    return new Promise((r, rej) => {
        if (token.refresh_token) {
            client.refreshAccessToken((e, token) => {
                if (e)
                    console.log(e);
                console.log(`token is: ${token}`);
                // @ts-ignore
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
function correctIt(opt, optDB) {
    if (opt.length != (optDB === null || optDB === void 0 ? void 0 : optDB.length) || !optDB)
        return 0;
    let correct = 0;
    if (opt && optDB)
        for (let i = 0; i < opt.length; i++) {
            // @ts-ignore 
            if (opt[i].umd == optDB[i].md)
                correct++;
            // @ts-ignore 
            if (opt[i].ud == optDB[i].d)
                correct++;
        }
    return correct;
}
exports.correctIt = correctIt;
