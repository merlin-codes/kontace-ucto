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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const googleapis_1 = require("googleapis");
const Operation_1 = require("./fuckit/mod/Operation");
require('dotenv').config();
/*

    Maybe save user data with token to Database for effectivity

*/
// making consts
const ftokens = "name the random guy from the store ixd lolo".split(" ");
const app = (0, express_1.default)();
const bodyParser = require("body-parser");
const jsonBody = bodyParser.json();
const PORT = +(process.env.PORT || 3103);
const HTP = "https";
const SERVER = `${HTP}://kontace-ucto.herokuapp.com`;
// const SERVER = `${HTP}://localhost:${PORT}`
const SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/classroom.coursework.me',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.rosters.readonly'
];
const client = new googleapis_1.google.auth.OAuth2({
    clientId: process.env.CID, clientSecret: process.env.CSECREAT, redirectUri: `${SERVER}/auth`
});
const operationModel = Operation_1.Operation;
// use
app.use((0, cors_1.default)());
app.use(bodyParser.json());
app.use(express_1.default.static("public"));
// app.use("/opt", require("./fuckit/opt"))
app.use(bodyParser.urlencoded({ extended: true }));
// Creating session
app.use(require("cookie-session")({
    name: "cokkies",
    keys: ['key1', 'key2']
}));
// set
app.set("view engine", "ejs");
// new one
app.get("/new", (_, s) => s.render("new"));
app.post("/create", jsonBody, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(req.body);
    const { operations, name } = req.body;
    client.setCredentials(req.session.googletoken);
    yield new operationModel({
        author: (_a = req.session) === null || _a === void 0 ? void 0 : _a.googletoken,
        author_id: (yield googleapis_1.google.classroom({ version: 'v1', auth: client }).userProfiles.get({ userId: "me" })).data.id,
        name: name,
        classroom: "",
        clasname: "",
        courseId: "",
        operations: operations
    }).save();
    return res.sendStatus(200);
}));
// home page
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    let operations = yield operationModel.find();
    res.render("index", {
        operations: operations.reverse(),
        auth: (_b = req.session) === null || _b === void 0 ? void 0 : _b.googletoken,
        code: (_c = req.session) === null || _c === void 0 ? void 0 : _c.myid,
        url: client.generateAuthUrl({ access_type: 'offline', scope: SCOPES })
    });
}));
// Generating new token 
app.get("/auth", (req, res) => {
    var _a;
    const code = req.query.code || ((_a = req.session) === null || _a === void 0 ? void 0 : _a.googlecode);
    client.getToken(String(code), (err, token) => __awaiter(void 0, void 0, void 0, function* () {
        if (err)
            console.error(`Something wrong with token: ${err}`);
        req.session.googletoken = token;
        client.setCredentials(req.session.googletoken);
        const classroom = googleapis_1.google.classroom({ version: "v1", auth: client });
        const userinfo = yield classroom.userProfiles.get({ userId: "me" });
        req.session.myid = userinfo.data.id;
        req.session.name = userinfo.data.name;
        req.session.googlecode = String(code);
        res.redirect("/save-token");
    }));
});
// check if user is in students of course if not redirect 'no-access page'
app.get("/opt/:id", (_, s) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    if (_.params.id.length != 24)
        return s.redirect("/");
    let oper = (yield operationModel.findById(_.params.id)) || null;
    if (oper == null || _.session.googletoken || _.session.googlecode)
        return s.redirect("/");
    let ope_edit = [];
    oper.operations.map((o) => ope_edit.push(Object.assign(Object.assign({}, o), { umd: "", ud: "", correct: false })));
    if (oper.classroom != "") {
        client.setCredentials((_d = _.session) === null || _d === void 0 ? void 0 : _d.googletoken);
        const classroom = googleapis_1.google.classroom({ version: "v1", "auth": client });
        classroom.courses.list({
            courseStates: ["ACTIVE"]
        }, (e, r) => {
            var _a;
            if (e)
                console.error(e);
            let courses = (_a = r === null || r === void 0 ? void 0 : r.data.courses) === null || _a === void 0 ? void 0 : _a.filter(course => course.id == oper.classroom);
            if (courses.length < 1)
                return s.redirect("/?err=your-not-in-class");
            return s.render("user", {
                operations: JSON.stringify(ope_edit),
                name: oper.name,
                id: oper._id,
                class: true
            });
        });
    }
    else
        return s.render("user", {
            operations: JSON.stringify(ope_edit),
            name: oper.name,
            id: oper._id,
            class: false
        });
}));
app.get("/del/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const operation = yield operationModel.findById(req.params.id);
    if ((operation === null || operation === void 0 ? void 0 : operation.author_id) == ((_e = req.session) === null || _e === void 0 ? void 0 : _e.myid))
        yield operationModel.remove(operation);
    res.redirect("/");
}));
// middleware between course and home
app.get("/back", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    client.setCredentials((_f = req.session) === null || _f === void 0 ? void 0 : _f.googletoken);
    let userinfo;
    const classroom = googleapis_1.google.classroom({ version: "v1", auth: client });
    // @ts-ignore
    const operations = yield operationModel
        .find(// {$or: [{'classroom': !null}, {'classroom': ""}]}
    { $and: [{ $or: [{ 'classroom': null }, { 'classroom': "" }] }, { 'author_id': (_g = req.session) === null || _g === void 0 ? void 0 : _g.myid }] });
    if (operationModel.length < 0)
        return res.redirect("/");
    googleapis_1.google.oauth2({ version: "v2", auth: client }).userinfo.get((e, s) => {
        if (e)
            console.error(e);
        else
            userinfo = s || "fuckit";
        console.log(userinfo);
        let courses;
        classroom.courses.list({
            teacherId: "me",
            courseStates: ["ACTIVE"]
        }, (e, res1) => {
            if (e)
                console.error(`Error i courses ${e}`);
            courses = res1 === null || res1 === void 0 ? void 0 : res1.data.courses;
            if (courses && courses.length)
                return res.render("select-course", { courses: courses, opt: operations.reverse() });
            return res.redirect("/");
        });
    });
}));
// connecting classroom with operation and create coursework
app.post("/course", jsonBody, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j;
    console.log(req.body);
    if (!((_h = req.session) === null || _h === void 0 ? void 0 : _h.googletoken))
        return res.redirect("/back");
    client.setCredentials((_j = req.session) === null || _j === void 0 ? void 0 : _j.googletoken);
    const classroom = googleapis_1.google.classroom({ version: "v1", auth: client });
    const opt = yield operationModel.findById(req.body.optid);
    let name = (yield classroom.courses.get({ id: req.body.courseid })).data.name || "";
    if (opt == null)
        res.redirect("/back");
    // @ts-ignore
    const coureswork = yield classroom.courses.courseWork.create({
        courseId: req.body.courseid,
        requestBody: {
            title: (opt === null || opt === void 0 ? void 0 : opt.name) || "NO title has been found",
            description: `${SERVER}/opt/${opt === null || opt === void 0 ? void 0 : opt._id}`,
            workType: 'ASSIGNMENT',
            state: 'PUBLISHED',
            maxPoints: 100
        }
    });
    opt.classroom = req.body.courseid;
    opt.classname = name;
    opt.courseId = coureswork.data.id;
    yield opt.save();
    // need run this
    console.log(coureswork);
    res.redirect("/");
}));
// this was hard to do
app.post("/nope", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    let correct = 0;
    let opt = req.body.opt;
    yield opt.map((o) => {
        if (o.correct == "true")
            correct++;
    });
    let id = req.body.this;
    const original = yield operationModel.findById(id);
    const all = ((_k = original === null || original === void 0 ? void 0 : original.operations) === null || _k === void 0 ? void 0 : _k.length) || 0;
    console.log(req.body.opt);
    console.log(correct);
    client.setCredentials(original.author);
    client.refreshAccessToken((err, token) => __awaiter(void 0, void 0, void 0, function* () {
        if (err)
            console.error(err);
        console.log(token);
        const classroom = googleapis_1.google.classroom({ version: 'v1', auth: client });
        // cannot find submission 404 
        // set userid back to test id /*'107300509570721804058'*/
        const assigment = (yield classroom.courses.courseWork.studentSubmissions.list({
            userId: String(req.session.myid),
            states: ['CREATED'],
            courseId: String(original.classroom),
            courseWorkId: String(original.courseId)
        })).data.studentSubmissions;
        if (!assigment)
            return;
        const mark = Math.floor((correct / all) * 100) || 0;
        const propably = (yield classroom.courses.courseWork.studentSubmissions.patch({
            courseWorkId: String(original.courseId), courseId: String(original.classroom),
            id: String(assigment[0].id), updateMask: "assignedGrade,draftGrade",
            requestBody: {
                assignedGrade: mark,
                draftGrade: mark
            }
        }));
        console.log(propably);
    }));
    res.send("success");
}));
// google blbosti
app.get("/privacy", (req, res) => res.render("privacy"));
app.get("/terms", (req, res) => res.render("terms"));
// API Request - remove before production version
app.get("/getall", (req, res) => __awaiter(void 0, void 0, void 0, function* () { return res.send(yield (operationModel.find())); }));
app.get("/getcourses", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    client.setCredentials(req.session.googletoken);
    const clas = googleapis_1.google.classroom({ version: "v1", auth: client }).courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"]
    }, (e, response) => {
        if (e)
            console.error(e);
        console.log(response === null || response === void 0 ? void 0 : response.data.courses);
        res.redirect("/");
    });
}));
app.get("/logout", (req, res) => __awaiter(void 0, void 0, void 0, function* () { req.session = null; res.redirect("/"); }));
// get operations by id
app.get("/get/:id", (r, s) => __awaiter(void 0, void 0, void 0, function* () { return s.send(yield (operationModel.findById(r.params.id))); }));
// remove classroom connection
app.get("/remove/classroom/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () { return res.send(yield (operationModel.updateOne({ "_id": req.params.id }, { classroom: "" }))); }));
// getting code from localstorage
app.post("/get-code", jsonBody, (req, res) => {
    req.session.googlecode = req.body.code;
    return res.send("Code saved");
});
app.get("/save-token", (req, res) => res.render("local", { code: req.session.googlecode }));
app.get("/show-token", (req, res) => { var _a; return res.send((_a = req.session) === null || _a === void 0 ? void 0 : _a.googletoken); });
app.listen(PORT, () => console.log("[SERVER]: running on " + SERVER));
mongoose_1.default.connect(process.env.URI || "").then(() => {
    console.log("Connected to Database...");
});
