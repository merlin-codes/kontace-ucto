"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.PORT = exports.SERVER = exports.port = exports.operationModel = exports.jsonBody = void 0;
const googleapis_1 = require("googleapis");
const Operation_1 = require("./mod/Operation");
const body_parser_1 = __importDefault(require("body-parser"));
require('dotenv').config();
exports.jsonBody = body_parser_1.default.json();
exports.operationModel = Operation_1.Operation;
exports.port = +(process.env.PORT || 3103);
let server = `https://fine-teal-uniform.cyclic.app/`;
if (process.env.ServerType == "local")
    server = `http://localhost:${exports.port}`;
exports.SERVER = server;
exports.PORT = exports.port;
exports.client = new googleapis_1.google.auth.OAuth2({
    clientId: process.env.CID, clientSecret: process.env.CSECREAT, redirectUri: `${exports.SERVER}/auth`
});
