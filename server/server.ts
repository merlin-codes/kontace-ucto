import express, { Request, Response } from 'express';
import mongoose, { ObjectId, Schema } from 'mongoose';
import cors from "cors";
import { google } from 'googleapis';
require('dotenv').config();


// making consts
const app: express.Application = express();
const bodyParser = require("body-parser");
const jsonBody = bodyParser.json();
const PORT: number = +(process.env.PORT || 3103);
const SCOPES = [
    'https://www.googleapis.com/auth/classroom.coursework.me',
    'https://www.googleapis.com/auth/classroom.courses.readonly', 
    'https://www.googleapis.com/auth/classroom.coursework.students'
];
const auth = new google.auth.OAuth2({
    clientId: process.env.CID, clientSecret: process.env.CSECREAT, redirectUri: `http://localhost:${PORT}/auth`
})

// Schema
const TokenSchema = new Schema({
    author: String,
    token: String
});
interface IToken extends Document {
    author: String,
    token: String
}
const tModel = mongoose.model<IToken>("token", TokenSchema);


const OperationSchema = new Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: '_id' },
    name: String,
    operations: []
});
interface IOperation extends Document {
    author: { type: mongoose.Schema.Types.ObjectId, ref: '_id' },
    user: String,
    name: String,
    operations: []
}
const qModel = mongoose.model<IOperation>("question", OperationSchema);


// use
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
// Creating session 
app.use(require("cookie-session")({
    name: "cokkies",
    keys: ['key1', 'key2']
}))


// set
app.set("view engine", "ejs");


// routes
app.get("/new", (_: Request, s: Response) => {
    s.render("new");
});

app.post("/create", jsonBody, async (r: Request, s: Response) => {
    // redirect using client
    const { operations, token, name } = r.body;
    const author: any = await tModel.findOne({ token: token });
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

app.get("/", async (_: Request, s: Response) => {

    if (!(_.session?.googletoken)) return s.redirect("/login")

    let operations = await qModel.find();
    const users = await tModel.find();
    let operation_ful = Array();

    // operations.map(o => users.map(u => u._id == o.author ? o.push()))

    operations.map(operation => {
        users.map(user => {
            if (user._id.toString() == (operation.author.toString())) {
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
        ope_edit.push({ ...o, umd: "", ud: "", correct: false })
    })
    s.render("user", {
        operations: JSON.stringify(ope_edit),
        name: oper.name,
        id: oper._id
    })
})

app.post("/del", jsonBody, async (_, s) => {
    console.log(_);

    const user: any = (await tModel.find({ token: _.body.token }))[0] || { _id: "" };
    const oper: any = (await qModel.find({ _id: _.body.id }))[0];
    console.log(user._id == oper.author);
    console.log(user);

    if (String(user._id) == String(oper.author))
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
    const code = req.query.code || "";

    auth.getToken(String(code), (err, token) => {
        if (err) console.error(`Something wrong with token: ${err}`);
        // const user = auth.getTokenInfo
        console.log(auth)
        req.session = {...req.session, googletoken: token}
        res.redirect("/");
    })
})

app.get("/back", async (_, s) => {
    auth.setCredentials(_.session?.googletoken);

    const classroom = google.classroom({version: "v1", auth})

    let courses;
    classroom.courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"]
    }, (e, res) => {
        if (e) console.error(`Error i courses ${e}`);
        courses = res?.data.courses;
        
        if (courses && courses.length){
            s.render("select-course", {
                courses: courses
            })
            // s.send("You have some courses here");
        }else{ 
            // s.send("I dont find any courses");
            s.redirect("/login");
        }
    })
    // s.redirect("/");
});

app.post("/course", jsonBody, async (req: Request, res: Response) => {
    console.log(req.body.courseid);

    const classroom = google.classroom({version: "v1", auth});

    const coureswork = await classroom.courses.courseWork.create({
        courseId: req.body.courseid,
        fields: "Random Text"
    }) 
    // list({
    //     courseId: req.body.courseid
    // }); // courses.get({id: req.body.courseid})
    console.log(coureswork);
    
    res.redirect("/back");
})


app.listen(PORT, () => console.log("HIPE"));

mongoose.connect(process.env.URI || "").then(() => {
    // app.listen(PORT);
    console.log("[SERVER]: running on http://localhost:" + PORT);
})
