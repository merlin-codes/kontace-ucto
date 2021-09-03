import { Request, Response, Router } from "express";
import { google } from "googleapis";
import request from "request";
import axios from "axios";
// import { query } from "query-parse";



const urlParse = require("url-parse")
const query = require("query-string")
const parser = require("body-parser");

const router = Router();
parser.urlencoded({extended: true})
const json = parser.json()

const client = new google.auth.OAuth2(
    process.env.CID,
    process.env.CSECREAT,
    "http://localhost:3103/google/well"
)


router.get("/", json, (_: Request, s: Response) => {

    const scopes = ["https://www.googleapis.com/auth/classroom.courses.readonly profile email openid"];

    const url = client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        state: JSON.stringify({
            callbackUrl: _.body.callbackUrl,
            userID: _.body.userid
        })
    })

    request(url, (e, r, body) => {
        console.error("e: ",e);
        console.log("code: ",r.statusCode);
        s.redirect(url)
    })
})

router.get("/well", async (_: Request, s: Response) => {
    const code = query.parse(new urlParse(_.url).query).code;

    const tokens = await client.getToken(code)
    console.log(tokens);
    s.send("work?");

    let courses = [];

    try {
        const result = await axios({
            method: "POST",
        })
    } catch (error) {
        console.error(error);
        
    }
})

module.exports = router