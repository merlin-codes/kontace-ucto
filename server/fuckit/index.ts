import { Router, Request, Response } from "express";
import { client, jsonBody, SERVER } from "./client";
import { Operation } from "./mod/Operation";
import { Author, IAuthor } from "./mod/Author";

import { refreshIt } from "./useless";
import { google } from "googleapis";

const router = Router();
const SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students'
];

// routes

// home page
router.get("/", async (req: Request, res: Response) => {
    let operations = await Operation.find();

    res.render("index", {
        operations: operations.reverse(),
        auth: req.session?.googletoken,
        code: req.session?.myid,
        url: client.generateAuthUrl({ access_type: 'offline', scope: SCOPES })
    });
})

// API Request - remove before production version
router.get("/logout", async (req, res) => {req.session = null; res.redirect("/")})
router.get("/meme", async (req: Request, res: Response) => {
    const memes = require("random-memes");
    memes.random().then((meme: any) => res.render("meme", {meme}))
})


// Getting auth to the session
router.get("/auth", (req: Request, res: Response) => {
    const code = req.query.code || req.session?.googlecode;

    // if user is in DB find Refresh token and save it to session
    client.getToken(String(code), async (err, token) => {
        if (err) console.error(`Something wrong with token: ${err}`);
        if (token) client.setCredentials(token);
        else return res.redirect("/");

        const classroom = google.classroom({version: "v1", auth: client})
        const userinfo = (await classroom.userProfiles.get({ userId: "me" })).data;

        req.session!.myid = userinfo.id;
        req.session!.name = userinfo.name;
        
        const author = (await Author.find({author_id: userinfo.id || ""}))[0];

        if (author && typeof author.author_id == undefined) {
            new Author({
                refresh_token: token.refresh_token,
                author_id: userinfo.id
            }).save()
            req.session!.googletoken = token;
        } else if (token.refresh_token) {
            author.refresh_token = token.refresh_token;
            author.save();
            req.session!.googletoken = token;
        } else {

            token.refresh_token = author.refresh_token.toString();
            req.session!.googletoken = token;
        }
        req.session!.googlecode = String(code);
        return res.redirect("/save-token");
    })
})


// middleware get classes where is user teacher or redirect home
router.get("/back", async (req: Request, res: Response) => {
    if (req.session?.googletoken.expiry_date < new Date()) {
        let newtoken = await refreshIt(client, req.session?.googletoken);
        client.setCredentials(newtoken)
        req.session!.googletoken = newtoken;
    }
    else client.setCredentials(req.session?.googletoken);

    const classroom = google.classroom({version: "v1", auth: client});
    const operations = await Operation 
        .find(
            {$and: [{$or: [{'classroom': null || ""}, {'classroom': ""}]}, {'author_id': req.session?.myid || ""}]}
        );
    if (Operation.length < 0) return res.redirect("/");

    let courses;
    classroom.courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"]
    }, (e, res1) => {
        if (e) console.error(`Error i courses ${e}`);

        // @ts-ignore
        courses = res1?.data?.courses;
        console.log(courses);
        
        if (courses && courses.length)
            return res.render("select-course", { courses: courses, opt: operations.reverse() })
        return res.redirect("/");
    })
});

// Connect save and send 
    // send coursework(classroom) 
    // save classroom id to DB (author, classroomID)

// connecting classroom with operation and create coursework
router.post("/course", jsonBody, async (req: Request, res: Response) => {
    console.log(req.body);
    if (!req.session?.googletoken) return res.redirect("/back");

    console.log(req.session?.googletoken);
    
    if (req.session.googletoken.expiry_date < new Date()) {
        let newtoken = await refreshIt(client, req.session?.googletoken);
        client.setCredentials(newtoken)
        req.session!.googletoken = newtoken;
    } else client.setCredentials(req.session?.googletoken);

    const classroom = google.classroom({version: "v1", auth: client});
    const opt = await Operation.findById(req.body.optid);
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

router.post("/create", jsonBody, async (req: Request, res: Response) => {
    const { operations, name } = req.body;

    if (req.session!.googletoken) {
        if (req.session?.googletoken.expiry_date < new Date()) {
            let newtoken = await refreshIt(client, req.session?.googletoken);
            client.setCredentials(newtoken)
            req.session!.googletoken = newtoken;
        }  else client.setCredentials(req.session?.googletoken);
    } else return res.sendStatus(403);

    if (Author.find({ "author_id": req.session?.myid }))
        await new Operation({
            author: req.session?.myname,
            author_id: req.session?.myid,
            name: name,
            classroom: "",
            clasname: "",
            courseId: "",
            operations: operations
        }).save();
    return res.sendStatus(200);
});

router.get("/refreshit", async (req: Request, res: Response) => {
    let newtoken = await refreshIt(client, req.session?.googletoken);
    res.send([newtoken, req.session?.googletoken])
})

module.exports = router
