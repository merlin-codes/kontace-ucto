import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { google } from 'googleapis';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import { client, PORT, SERVER } from "./fuckit/client";
import { Operation } from "./fuckit/mod/Operation";


require('dotenv').config();


/*

    Made by Miloslav Stekrt
    Let's create something new :D

*/


// making consts
const app: express.Application = express();

// use
app.use(fileUpload({
    createParentPath: true
}));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));


// Creating session
app.use(require("cookie-session")({
    name: "tridentonezero",
    keys: ['fuckinggodisdeaddearnewgod', 'helpmenowyouknowyouareidiot']
}))

// set
app.set("view engine", "ejs");


// new routes
app.use("/opt", require("./fuckit/opt"));
app.use("/epic", require("./fuckit/epic"));
app.use("/google", require("./fuckit/gblbosti"));
app.use("/", require("./fuckit/api"));
app.use("/", require("./fuckit/index"));
app.use("/", require("./fuckit/gblbosti"));



app.get("/get/:id", async (r, s) => s.send(await (Operation.findById(r.params.id))))
app.get("/remove/classroom/:id", async (req, res) => res.send(
    await (Operation.updateOne({"_id": req.params.id}, {classroom: ""}))
));

app.listen(PORT, () => console.log("[SERVER]: running on " + SERVER));

mongoose.connect(process.env.URI || "").then(() => {
    console.log("Connected to Database...");
})
