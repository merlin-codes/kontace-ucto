import express, { Request, Response } from 'express';
import mongoose, { ObjectId, Schema } from 'mongoose';
import cors from "cors";
import { google } from 'googleapis';
// import request from "request";
// import readline from 'readline';
// import { google } from 'googleapis';
// import { authorize, LCourses } from "./g.apis";
// import fs from 'fs';
require('dotenv').config();


// making consts
const app: express.Application = express();
const bodyParser = require("body-parser");
const jsonBody = bodyParser.json();
const PORT: number = +(process.env.PORT || 3103);
const SCOPES = ['https://www.googleapis.com/auth/classroom.courses.readonly'];
const auth = new google.auth.OAuth2({
    clientId: process.env.CID, clientSecret: process.env.CSECREAT, redirectUri: `http://localhost:${PORT}/auth`
})

// Schema
const TokenSchema = new Schema({
    author: String,
    token: String
});
interface IToken extends Document{
    author: String,
    token: String
}
const tModel = mongoose.model<IToken>("token", TokenSchema);


const OperationSchema = new Schema({
    author: {type: mongoose.Schema.Types.ObjectId, ref: '_id'},
    name: String,
    operations: []
});
interface IOperation extends Document {
    author: {type: mongoose.Schema.Types.ObjectId, ref: '_id'},
    user: String,
    name: String,
    operations: []
}
const qModel = mongoose.model<IOperation>("question", OperationSchema);


// use
app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
// app.use("/google", require("./cio/GClass"))


// set
app.set("view engine", "ejs");


// routes
app.get("/new", (_: Request, s: Response) => {
    s.render("new");
});

app.post("/create",jsonBody, async (r: Request, s: Response) => {
    // redirect using client
    const {operations, token, name} = r.body;
    const author: any = await tModel.findOne({token: token});
    try {
        if (author != null || mongoose.isValidObjectId(author._id)) {
            const question = new qModel({
                author: author._id,
                name: name,
                operations: operations
            });
            await question.save();
            return s.sendStatus(200);
        } else {
            return s.sendStatus(403);
        }
    } catch (error) {
        s.sendStatus(403)
    }
});

app.get("/", async (_, s) => {
    let operations = await qModel.find();
    const users = await tModel.find();
    let operation_ful = Array();

    // operations.map(o => users.map(u => u._id == o.author ? o.push()))

    operations.map(operation  => {
        users.map(user => {   
            if (user._id.toString() == (operation.author.toString())){
                operation_ful.push({
                    name: operation.name,
                    user: user.author,
                    id: operation._id
                })
            }
        })
    })
    s.render("index", {
        operations: operation_ful.reverse()
    })
})

app.get("/opt/:id", async (_, s) => {
    let oper: any = (await qModel.findById(_.params.id));
    let ope_edit: any = []
    oper.operations.map((o: any) => {
        ope_edit.push({...o, umd: "", ud: "", correct: false})
    })
    s.render("user", {
        operations: JSON.stringify(ope_edit),
        name: oper.name,
        id: oper._id
    })
})

app.post("/del", jsonBody, async (_, s) => {
    console.log(_);
    
    const user: any = (await tModel.find({token: _.body.token}))[0] || {_id: ""};
    const oper: any = (await qModel.find({_id: _.body.id}))[0];
    console.log(user._id == oper.author);
    console.log(user);
    
    if (String(user._id) ==  String(oper.author))
        await qModel.findByIdAndRemove(oper._id);
    else return s.sendStatus(403);
    s.sendStatus(200);
})


app.get("/login", (req: Request, res: Response) => {
    const loginurl = auth.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    })

    res.render("login", { url: loginurl })
})

app.get("/auth", (req: Request, res: Response) => {
    res.send("it works")
})

app.get("/back", (_, s) => s.redirect("/"));


app.listen(PORT, () => console.log("HIPE"));

mongoose.connect(process.env.URI || "").then(() => {
    // app.listen(PORT);
    console.log("[SERVER]: running on "+"/"+PORT);
});
