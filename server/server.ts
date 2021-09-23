import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import { google, oauth2_v2 } from 'googleapis';
import { Operation } from './fuckit/mod/Operation';
import { GaxiosResponse } from 'gaxios';
import { version } from 'os';

require('dotenv').config();


/*

    Made by Miloslav Stekrt
    Let's create something new :D

*/

// making consts
const app: express.Application = express();
const bodyParser = require("body-parser");
const jsonBody = bodyParser.json();
const PORT: number = +(process.env.PORT || 3103);
const HTP = "https"
const SERVER = `${HTP}://kontace-ucto.herokuapp.com`

// for local server need enable this
// const SERVER = `${HTP}://localhost:${PORT}`

const SCOPES = [
    'https://www.googleapis.com/auth/classroom.coursework.me',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.rosters.readonly'
];
const client = new google.auth.OAuth2({
    clientId: process.env.CID, clientSecret: process.env.CSECREAT, redirectUri: `${SERVER}/auth`
})
const operationModel = Operation;

// use
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
// app.use("/opt", require("./fuckit/opt"))
app.use(bodyParser.urlencoded({ extended: true }));


// Creating session
app.use(require("cookie-session")({
    name: "cokkies",
    keys: ['key1', 'key2']
}))

// set
app.set("view engine", "ejs");


// Create new
app.get("/new", (_: Request, s: Response) => s.render("new"));
app.post("/create", jsonBody, async (req: Request, res: Response) => {
    const { operations, name } = req.body;
    client.setCredentials(req.session!.googletoken)

    await new operationModel({
        author: req.session?.googletoken,
        author_id: (await google.classroom({version: 'v1', auth: client})
                        .userProfiles.get({userId: "me"})).data.id,
        name: name,
        classroom: "",
        clasname: "",
        courseId: "",
        operations: operations
    }).save();
    return res.sendStatus(200);
});

// home page
app.get("/", async (req: Request, res: Response) => {
    let operations = await operationModel.find();

    res.render("index", {
        operations: operations.reverse(),
        auth: req.session?.googletoken,
        code: req.session?.myid,
        url: client.generateAuthUrl({ access_type: 'offline', scope: SCOPES })
    });
})

// Generation of new OAuth token
app.get("/auth", (req: Request, res: Response) => {
    const code = req.query.code || req.session?.googlecode;

    client.getToken(String(code), async (err, token) => {
        if (err) console.error(`Something wrong with token: ${err}`);
        req.session!.googletoken = token;
        client.setCredentials(req.session!.googletoken);
        const classroom = google.classroom({version: "v1", auth: client})

        const userinfo = await classroom.userProfiles.get({userId: "me"})

        req.session!.myid = userinfo.data.id;
        req.session!.name = userinfo.data.name;

        req.session!.googlecode = String(code);
        res.redirect("/save-token");
    })
})


app.get("/del/:id", async (req: Request, res: Response) => {
    const operation = await operationModel.findById(req.params.id);
    if (operation?.author_id == req.session?.myid)
        await operationModel.remove(operation);
    res.redirect("/");
})

// check if user is in students of course if not redirect 'no-access page'
app.get("/opt/:id", async (_, s) => {
    if (_.params.id.length != 24) return  s.redirect("/");

    let oper: any = (await operationModel.findById(_.params.id)) || null;
    if (oper == null) return s.redirect("/");

    let ope_edit: any = []
    oper.operations.map((o: any) => ope_edit.push({ ...o, umd: "", ud: "", correct: false }))

    if (oper.classroom != "") {
        if (!(_.session!.googletoken)) s.redirect("/?no-token-no-life")
        client.setCredentials(_.session?.googletoken);
        const classroom = google.classroom({version: "v1", "auth": client});
        classroom.courses.list({
            courseStates: ["ACTIVE"]
        }, (e, r) => {
            if (e) console.error(e);
            let courses = r?.data.courses?.filter(course => course.id == oper.classroom);
            if (courses && courses!.length == 1)
                return s.redirect("/?err=your-not-in-class")
            return s.render("user", {
                operations: JSON.stringify(ope_edit),
                name: oper.name,
                id: oper._id,
                class: true
            });
        })
    } else
        return s.render("user", {
            operations: JSON.stringify(ope_edit),
            name: oper.name,
            id: oper._id,
            class: false
        });
});


// middleware between course and home(
app.get("/back", async (req: Request, res: Response) => {
    client.setCredentials(req.session?.googletoken);

    let userinfo: string | GaxiosResponse<oauth2_v2.Schema$Userinfo>;

    const classroom = google.classroom({version: "v1", auth: client});
    // @ts-ignore
    const operations = await operationModel
        .find( // {$or: [{'classroom': !null}, {'classroom': ""}]}
            {$and: [{$or: [{'classroom': null}, {'classroom': ""}]}, {'author_id': req.session?.myid}]}
        );
    if (operationModel.length < 0) return res.redirect("/");

    google.oauth2({version: "v2", auth: client}).userinfo.get((e, s) => {
        if (e) console.error(e);
        else userinfo = s || "fuckit"
        console.log(userinfo)
        let courses;
        classroom.courses.list({
            teacherId: "me",
            courseStates: ["ACTIVE"]
        }, (e, res1) => {
            if (e) console.error(`Error i courses ${e}`);
            courses = res1?.data.courses;
            if (courses && courses.length)
                return res.render("select-course", { courses: courses, opt: operations.reverse() })
            return res.redirect("/");
        })
    })
});

// connecting classroom with operation and create coursework
app.post("/course", jsonBody, async (req: Request, res: Response) => {
    console.log(req.body);
    if (!req.session?.googletoken) return res.redirect("/back")

    client.setCredentials(req.session?.googletoken);

    const classroom = google.classroom({version: "v1", auth: client});
    const opt = await operationModel.findById(req.body.optid);
    let name: String = (await classroom.courses.get({id: req.body.courseid})).data.name || "";

    if (opt == null) res.redirect("/back");

    // @ts-ignore
    const coureswork = await classroom.courses.courseWork.create({
      courseId: req.body.courseid,
      requestBody: {
        title: opt?.name || "NO title has been found",
        description: `${SERVER}/opt/${opt?._id}`,
        workType: 'ASSIGNMENT',
        state: 'PUBLISHED',
        maxPoints: 100
      }
    });

    opt!.classroom = req.body.courseid;
    opt!.classname = name;
    opt!.courseId = coureswork.data.id!;

    await opt!.save()
    res.redirect("/")
})

// this was hard to do
app.post("/nope", async (req: Request, res: Response) => {
    let correct = 0;

    let opt = req.body.opt;
    await opt.map((o: {correct: string}) => {
        if (o.correct == "true") correct++
    })

    let id = req.body.this;

    const original = await operationModel.findById(id);
    const all = original?.operations?.length || 0;

    console.log(req.body.opt);
    console.log(correct);

    client.setCredentials(original!.author);
    client.refreshAccessToken(async (err, token) => {
        if (err) console.error(err);
        console.log(token);

        const classroom = google.classroom({version: 'v1', auth: client});

        // cannot find submission 404
        // set userid back to test id /*'107300509570721804058'*/
        const assigment = (await classroom.courses.courseWork.studentSubmissions.list({
                userId: String(req.session!.myid),
                states: ['CREATED'],
                courseId: String(original!.classroom),
                courseWorkId: String(original!.courseId)
            })).data.studentSubmissions;
        if (!assigment) return;

        const mark = Math.floor((correct / all) * 100) || 0;
        const propably = (await classroom.courses.courseWork.studentSubmissions.patch({
            courseWorkId: String(original!.courseId), courseId: String(original!.classroom),
            id: String(assigment![0].id), updateMask: "assignedGrade,draftGrade",
            requestBody: {
                assignedGrade: mark,
                draftGrade: mark
            }
        }))

        console.log(propably);
    })
    res.send("success");
})


// google blbosti
app.get("/privacy", (req, res) => res.render("privacy"))
app.get("/terms", (req, res) => res.render("terms"))
app.get("/map", (req, res) =>{
  res.type('application/xml');
  res.sendFile(__dirname+"../public/sitemap.xml")
});


// API Request - remove before production version
app.get("/getall", async (req, res) => res.send(await (operationModel.find())))
app.get("/logout", async (req, res) => {req.session = null; res.redirect("/")})
app.get("/get/:id", async (r, s) => s.send(await (operationModel.findById(r.params.id))))
app.get("/remove/classroom/:id", async (req, res) => res.send(
    await (operationModel.updateOne({"_id": req.params.id}, {classroom: ""}))
));

app.get("/meme", async (req, res) => {
    const memes = require("random-memes");
    memes.random().then((meme: any) => res.render("meme", {meme}))
})

// app.get("/getcourses", async (req, res) => {
//     client.setCredentials(req.session!.googletoken);
//     const clas = google.classroom({version: "v1", auth: client}).courses.list({
//         teacherId: "me",
//         courseStates: ["ACTIVE"]
//     }, (e, response) => {
//         if (e) console.error(e);
//         console.log(response?.data.courses);
//         res.redirect("/")
//     });
// });



// Manipulation with Gcode from login
app.post("/get-code", jsonBody, (req, res) => {
    req.session!.googlecode = req.body.code;
    return res.send("Code saved");
})
app.get("/save-token", (req, res) => res.render("local", { code: req.session!.googlecode }));
app.get("/show-token", (req, res) => res.send(req.session?.googletoken));


app.listen(PORT, () => console.log("[SERVER]: running on " + SERVER));
mongoose.connect(process.env.URI || "").then(() => {
    console.log("Connected to Database...");
})
