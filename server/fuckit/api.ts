import { Router, Request, Response } from "express";
import { client, SERVER } from "./client";
import { refreshIt, correctIt } from "./useless";
import { Operation } from "./mod/Operation";
import { google } from "googleapis";
import bodyParser from 'body-parser';

const router = Router();
const jsonBody = bodyParser.json();

// Manipulation with Gcode from login
router.post("/get-code", jsonBody, (req, res) => {
    req.session!.googlecode = req.body.code;
    return res.send("Code saved");
})
router.get("/save-token", (req, res) => res.render("local", { code: req.session!.googlecode }));
router.get("/show-token", (req, res) => res.send(req.session?.googletoken));

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

// this was hard to do
// nope is granting marks to student by teacher auth
router.post("/nope", async (req: Request, res: Response) => {
    console.log(req.session?.googletoken)
    // cannot find submission 404
    // set userid back to test id /*'107300509570721804058'*/

    let opt = req.body.opt;
    const original = await Operation.findById(req.body.this);
    let optDB = original?.operations;

    let all = optDB!.length || 0;

    let correct: Number= correctIt(opt, optDB || [])

    client.setCredentials(original!.author);
    
    client.refreshAccessToken(async (err, token) => {
        if (err) console.error(err);
        if (token)
            await Operation.findByIdAndUpdate(original?.id, {author: token})
        
        const classroom = google.classroom({version: 'v1', auth: client});
        const assigment = (
            await classroom.courses.courseWork.studentSubmissions.list({
                userId: String(req.session!.myid),
                states: ['CREATED'],
                courseId: String(original!.classroom),
                courseWorkId: String(original!.courseId)
            })).data.studentSubmissions;
        if (!assigment) return res.send("notstudent");
        let loopse = 1;
        if (all != correct) 
            loopse = correct/(2*all) || 0;
        const mark = Math.floor((loopse) * 100) || 0;

        await classroom.courses.courseWork.studentSubmissions.patch({
            courseWorkId: String(original!.courseId), courseId: String(original!.classroom),
            id: String(assigment![0].id), updateMask: "assignedGrade,draftGrade",
            requestBody: {
                assignedGrade: mark,
                draftGrade: mark
            }
        })
        res.send(String(mark));
    })
})

module.exports = router;
