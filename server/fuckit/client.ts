import { google } from 'googleapis';
import { Operation } from "./mod/Operation";
import bodyParser from "body-parser";
require('dotenv').config();


export const jsonBody = bodyParser.json();

export const operationModel = Operation;

export const port: number = +(process.env.PORT || 3103);
let server= `https://fine-teal-uniform.cyclic.app/`;

if (process.env.ServerType == "local")
    server = `http://localhost:${port}`

export const SERVER = server;
export const PORT = port;
export const client = new google.auth.OAuth2({
    clientId: process.env.CID, clientSecret: process.env.CSECREAT, redirectUri: `${SERVER}/auth`
})



