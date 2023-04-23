"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("./client");
const Operation_1 = require("./mod/Operation");
const Author_1 = require("./mod/Author");
const useless_1 = require("./useless");
const googleapis_1 = require("googleapis");
const router = (0, express_1.Router)();
const SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students'
];
// routes
// home page
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let operations = yield Operation_1.Operation.find();
    res.render("index", {
        operations: operations.reverse(),
        auth: (_a = req.session) === null || _a === void 0 ? void 0 : _a.googletoken,
        code: (_b = req.session) === null || _b === void 0 ? void 0 : _b.myid,
        url: client_1.client.generateAuthUrl({ access_type: 'offline', scope: SCOPES })
    });
}));
// API Request - remove before production version
router.get("/logout", (req, res) => __awaiter(void 0, void 0, void 0, function* () { req.session = null; res.redirect("/"); }));
router.get("/meme", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const memes = require("random-memes");
    memes.random().then((meme) => res.render("meme", { meme }));
}));
// Getting auth to the session
router.get("/auth", (req, res) => {
    var _a;
    const code = req.query.code || ((_a = req.session) === null || _a === void 0 ? void 0 : _a.googlecode);
    // if user is in DB find Refresh token and save it to session
    client_1.client.getToken(String(code), (err, token) => __awaiter(void 0, void 0, void 0, function* () {
        if (err)
            console.error(`Something wrong with token: ${err}`);
        if (token)
            client_1.client.setCredentials(token);
        else
            return res.redirect("/");
        const classroom = googleapis_1.google.classroom({ version: "v1", auth: client_1.client });
        const userinfo = (yield classroom.userProfiles.get({ userId: "me" })).data;
        req.session.myid = userinfo.id;
        req.session.name = userinfo.name;
        const author = (yield Author_1.Author.find({ author_id: userinfo.id || "" }))[0];
        if (author && typeof author.author_id == undefined) {
            new Author_1.Author({
                refresh_token: token.refresh_token,
                author_id: userinfo.id
            }).save();
            req.session.googletoken = token;
        }
        else if (token.refresh_token) {
            author.refresh_token = token.refresh_token;
            author.save();
            req.session.googletoken = token;
        }
        else {
            token.refresh_token = author.refresh_token.toString();
            req.session.googletoken = token;
        }
        req.session.googlecode = String(code);
        return res.redirect("/save-token");
    }));
});
// middleware get classes where is user teacher or redirect home
router.get("/back", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e, _f;
    if (((_c = req.session) === null || _c === void 0 ? void 0 : _c.googletoken.expiry_date) < new Date()) {
        let newtoken = yield (0, useless_1.refreshIt)(client_1.client, (_d = req.session) === null || _d === void 0 ? void 0 : _d.googletoken);
        client_1.client.setCredentials(newtoken);
        req.session.googletoken = newtoken;
    }
    else
        client_1.client.setCredentials((_e = req.session) === null || _e === void 0 ? void 0 : _e.googletoken);
    const classroom = googleapis_1.google.classroom({ version: "v1", auth: client_1.client });
    const operations = yield Operation_1.Operation
        .find({ $and: [{ $or: [{ 'classroom': null || "" }, { 'classroom': "" }] }, { 'author_id': ((_f = req.session) === null || _f === void 0 ? void 0 : _f.myid) || "" }] });
    if (Operation_1.Operation.length < 0)
        return res.redirect("/");
    let courses;
    classroom.courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"]
    }, (e, res1) => {
        var _a;
        if (e)
            console.error(`Error i courses ${e}`);
        // @ts-ignore
        courses = (_a = res1 === null || res1 === void 0 ? void 0 : res1.data) === null || _a === void 0 ? void 0 : _a.courses;
        console.log(courses);
        if (courses && courses.length)
            return res.render("select-course", { courses: courses, opt: operations.reverse() });
        return res.redirect("/");
    });
}));
// Connect save and send 
// send coursework(classroom) 
// save classroom id to DB (author, classroomID)
// connecting classroom with operation and create coursework
router.post("/course", client_1.jsonBody, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k;
    console.log(req.body);
    if (!((_g = req.session) === null || _g === void 0 ? void 0 : _g.googletoken))
        return res.redirect("/back");
    console.log((_h = req.session) === null || _h === void 0 ? void 0 : _h.googletoken);
    if (req.session.googletoken.expiry_date < new Date()) {
        let newtoken = yield (0, useless_1.refreshIt)(client_1.client, (_j = req.session) === null || _j === void 0 ? void 0 : _j.googletoken);
        client_1.client.setCredentials(newtoken);
        req.session.googletoken = newtoken;
    }
    else
        client_1.client.setCredentials((_k = req.session) === null || _k === void 0 ? void 0 : _k.googletoken);
    const classroom = googleapis_1.google.classroom({ version: "v1", auth: client_1.client });
    const opt = yield Operation_1.Operation.findById(req.body.optid);
    let name = (yield classroom.courses.get({ id: req.body.courseid })).data.name || "";
    if (opt == null)
        res.redirect("/back");
    // @ts-ignore
    const coureswork = yield classroom.courses.courseWork.create({
        courseId: req.body.courseid,
        requestBody: {
            title: (opt === null || opt === void 0 ? void 0 : opt.name) || "NO title has been found",
            description: `${client_1.SERVER}/opt/${opt === null || opt === void 0 ? void 0 : opt._id}`,
            workType: 'ASSIGNMENT',
            state: 'PUBLISHED',
            maxPoints: 100
        }
    });
    opt.classroom = req.body.courseid;
    opt.classname = name;
    opt.courseId = coureswork.data.id;
    yield opt.save();
    res.redirect("/");
}));
router.post("/create", client_1.jsonBody, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m, _o, _p, _q, _r;
    const { operations, name } = req.body;
    if (req.session.googletoken) {
        if (((_l = req.session) === null || _l === void 0 ? void 0 : _l.googletoken.expiry_date) < new Date()) {
            let newtoken = yield (0, useless_1.refreshIt)(client_1.client, (_m = req.session) === null || _m === void 0 ? void 0 : _m.googletoken);
            client_1.client.setCredentials(newtoken);
            req.session.googletoken = newtoken;
        }
        else
            client_1.client.setCredentials((_o = req.session) === null || _o === void 0 ? void 0 : _o.googletoken);
    }
    else
        return res.sendStatus(403);
    if (Author_1.Author.find({ "author_id": (_p = req.session) === null || _p === void 0 ? void 0 : _p.myid }))
        yield new Operation_1.Operation({
            author: (_q = req.session) === null || _q === void 0 ? void 0 : _q.myname,
            author_id: (_r = req.session) === null || _r === void 0 ? void 0 : _r.myid,
            name: name,
            classroom: "",
            clasname: "",
            courseId: "",
            operations: operations
        }).save();
    return res.sendStatus(200);
}));
router.get("/refreshit", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _s, _t;
    let newtoken = yield (0, useless_1.refreshIt)(client_1.client, (_s = req.session) === null || _s === void 0 ? void 0 : _s.googletoken);
    res.send([newtoken, (_t = req.session) === null || _t === void 0 ? void 0 : _t.googletoken]);
}));
module.exports = router;
