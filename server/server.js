"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
// import jwt from "jsonwebtoken";
const googleapis_1 = require("googleapis");
const cors_1 = __importDefault(require("cors"));
require('dotenv').config();
// making consts
const PORT = +(process.env.PORT || 3103);
const app = (0, express_1.default)();
const bodyParser = require("body-parser");
const jsonBody = bodyParser.json();
const auth = googleapis_1.google.auth.OAuth2;
const client = new auth(process.env.CID, process.env.CSECREAT, process.env.REDIRECT);
// set
app.set("view engine", "ejs");
// use
app.use((0, cors_1.default)());
app.use(jsonBody);
app.use(express_1.default.static("public"));
app.use(require("cookie-parser"));
app.use("/", require("./cio/kontace"));
// app.use("/g", require("./cio/classroom"));
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/login", (req, res) => {
    const googlelink = client.generateAuthUrl({
        access_type: 'offline',
        scope: process.env.S_view_courses
    });
    return res.render("login", { login: googlelink });
});
app.get("/back", (_, s) => s.redirect("/"));
mongoose_1.default.connect(process.env.URI || "").then(() => {
    app.listen(PORT, () => console.log("[SERVER]: running on " + "http://localhost:" + PORT));
});
