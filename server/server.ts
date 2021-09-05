import express, { Request, Response } from 'express';
import mongoose, { ObjectId, Schema } from 'mongoose';
// import jwt from "jsonwebtoken";
import { google } from "googleapis";
import cors from "cors";
require('dotenv').config();


// making consts
const PORT: number = +(process.env.PORT || 3103);
const app: express.Application = express();
const bodyParser = require("body-parser");
const jsonBody = bodyParser.json();
const auth = google.auth.OAuth2;
const client = new auth(
    process.env.CID, 
    process.env.CSECREAT, 
    process.env.REDIRECT
);


// set
app.set("view engine", "ejs");
// use
app.use(cors());
app.use(jsonBody)
app.use(express.static("public"));
app.use(require("cookie-parser"));
app.use("/", require("./cio/kontace"));
// app.use("/g", require("./cio/classroom"));
app.use(bodyParser.urlencoded({extended: true}))


app.get("/login", (req: Request, res: Response) => {
    const googlelink = client.generateAuthUrl({
        access_type: 'offline',
        scope: process.env.S_view_courses
    })
    return res.render("login", {login: googlelink})
})
app.get("/back", (_, s) => s.redirect("/"));



mongoose.connect(process.env.URI || "").then(() => {
    app.listen(PORT, () => console.log("[SERVER]: running on "+"http://localhost:"+PORT));
});
