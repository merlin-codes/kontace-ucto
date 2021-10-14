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
const useless_1 = require("./fuckit/useless");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
// @ts-ignore
const docx_tables_1 = __importDefault(require("docx-tables"));
const path_1 = __importDefault(require("path"));
require('dotenv').config();
/*

    Made by Miloslav Stekrt
    Let's create something new :D

*/
// making consts
const app = (0, express_1.default)();
const bodyParser = require("body-parser");
const jsonBody = bodyParser.json();
const PORT = +(process.env.PORT || 3103);
let SERVER = `https://kontace-ucto.herokuapp.com`;
if (process.env.ServerType == "local")
    SERVER = `http://localhost:${PORT}`;
const SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students'
];
const client = new googleapis_1.google.auth.OAuth2({
    clientId: process.env.CID, clientSecret: process.env.CSECREAT, redirectUri: `${SERVER}/auth`
});
const operationModel = Operation_1.Operation;
// use
app.use((0, express_fileupload_1.default)({
    createParentPath: true
}));
app.use((0, cors_1.default)());
app.use(bodyParser.json());
app.use(express_1.default.static("public"));
// app.use("/opt", require("./fuckit/opt"))
app.use(bodyParser.urlencoded({ extended: true }));
// Creating session
app.use(require("cookie-session")({
    name: "tridentonezero",
    keys: ['fuckinggodisdeaddearnewgod', 'helpmenowyouknowyouareidiot']
}));
// set
app.set("view engine", "ejs");
// Create new
app.get("/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.googletoken))
        return res.redirect("/");
    try {
        if (((_b = req.session) === null || _b === void 0 ? void 0 : _b.googletoken.expiry_date) < new Date())
            client.setCredentials(yield (0, useless_1.refreshIt)(client, (_c = req.session) === null || _c === void 0 ? void 0 : _c.googletoken));
        else
            client.setCredentials((_d = req.session) === null || _d === void 0 ? void 0 : _d.googletoken);
    }
    catch (error) {
        return res.redirect("/");
    }
    googleapis_1.google.classroom({ version: "v1", auth: client }).courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"]
    }, (e, res1) => {
        if (e)
            console.error(`Error i courses ${e}`);
        let courses = res1 === null || res1 === void 0 ? void 0 : res1.data.courses;
        if (courses && courses.length)
            return res.render("new");
        return res.redirect("/");
    });
}));
app.post("/create", jsonBody, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h;
    const { operations, name } = req.body;
    if (req.session.googletoken) {
        if (((_e = req.session) === null || _e === void 0 ? void 0 : _e.googletoken.expiry_date) < new Date())
            client.setCredentials(yield (0, useless_1.refreshIt)(client, (_f = req.session) === null || _f === void 0 ? void 0 : _f.googletoken));
        else
            client.setCredentials((_g = req.session) === null || _g === void 0 ? void 0 : _g.googletoken);
    }
    else
        return res.sendStatus(403);
    yield new operationModel({
        author: (_h = req.session) === null || _h === void 0 ? void 0 : _h.googletoken,
        author_id: (yield googleapis_1.google.classroom({ version: 'v1', auth: client })
            .userProfiles.get({ userId: "me" })).data.id,
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
    var _j, _k;
    let operations = yield operationModel.find();
    res.render("index", {
        operations: operations.reverse(),
        auth: (_j = req.session) === null || _j === void 0 ? void 0 : _j.googletoken,
        code: (_k = req.session) === null || _k === void 0 ? void 0 : _k.myid,
        url: client.generateAuthUrl({ access_type: 'offline', scope: SCOPES })
    });
}));
// Generation of new OAuth token
app.get("/auth", (req, res) => {
    var _a;
    const code = req.query.code || ((_a = req.session) === null || _a === void 0 ? void 0 : _a.googlecode);
    client.getToken(String(code), (err, token) => __awaiter(void 0, void 0, void 0, function* () {
        if (err)
            console.error(`Something wrong with token: ${err}`);
        req.session.googletoken = token;
        if (token)
            client.setCredentials(token);
        else
            return res.redirect("/");
        const classroom = googleapis_1.google.classroom({ version: "v1", auth: client });
        const userinfo = (yield classroom.userProfiles.get({ userId: "me" })).data;
        req.session.myid = userinfo.id;
        req.session.name = userinfo.name;
        req.session.googlecode = String(code);
        res.redirect("/save-token");
    }));
});
app.get("/del/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _l;
    const operation = yield operationModel.findById(req.params.id);
    if ((operation === null || operation === void 0 ? void 0 : operation.author_id) == ((_l = req.session) === null || _l === void 0 ? void 0 : _l.myid))
        yield operationModel.remove(operation);
    res.redirect("/");
}));
// check if user is in students of course if not redirect 'no-access page'
app.get("/opt/:id", (_, s) => __awaiter(void 0, void 0, void 0, function* () {
    var _m, _o, _p;
    if (_.params.id.length != 24)
        return s.redirect("/");
    let oper = (yield operationModel.findById(_.params.id)) || null;
    if (oper == null)
        return s.redirect("/");
    let ope_edit = [];
    oper.operations.map((o) => ope_edit.push(Object.assign(Object.assign({}, o), { umd: "", ud: "", correct: false })));
    if (oper.classroom != "") {
        if (!(_.session.googletoken))
            return s.redirect("/?err=no-token-no-life");
        if (((_m = _.session) === null || _m === void 0 ? void 0 : _m.googletoken.expiry_date) < new Date())
            client.setCredentials(yield (0, useless_1.refreshIt)(client, (_o = _.session) === null || _o === void 0 ? void 0 : _o.googletoken));
        else
            client.setCredentials((_p = _.session) === null || _p === void 0 ? void 0 : _p.googletoken);
        const classroom = googleapis_1.google.classroom({ version: "v1", "auth": client });
        classroom.courses.get({ id: oper.classroom }, (e, r) => {
            if (e)
                console.log(e);
            let courses = r === null || r === void 0 ? void 0 : r.data;
            // @ts-ignore
            if (courses && courses.length == 0 || (e === null || e === void 0 ? void 0 : e.code) == 404)
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
// middleware between course and home(
app.get("/back", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _q, _r, _s, _t;
    if (((_q = req.session) === null || _q === void 0 ? void 0 : _q.googletoken.expiry_date) < new Date())
        client.setCredentials(yield (0, useless_1.refreshIt)(client, (_r = req.session) === null || _r === void 0 ? void 0 : _r.googletoken));
    else
        client.setCredentials((_s = req.session) === null || _s === void 0 ? void 0 : _s.googletoken);
    const classroom = googleapis_1.google.classroom({ version: "v1", auth: client });
    // @ts-ignore
    const operations = yield operationModel
        .find({ $and: [{ $or: [{ 'classroom': null }, { 'classroom': "" }] }, { 'author_id': (_t = req.session) === null || _t === void 0 ? void 0 : _t.myid }] });
    if (operationModel.length < 0)
        return res.redirect("/");
    let courses;
    classroom.courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"]
    }, (e, res1) => {
        if (e)
            console.error(`Error i courses ${e}`);
        courses = res1 === null || res1 === void 0 ? void 0 : res1.data.courses;
        console.log(courses);
        if (courses && courses.length)
            return res.render("select-course", { courses: courses, opt: operations.reverse() });
        return res.redirect("/");
    });
}));
// connecting classroom with operation and create coursework
app.post("/course", jsonBody, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _u, _v, _w, _x;
    console.log(req.body);
    if (!((_u = req.session) === null || _u === void 0 ? void 0 : _u.googletoken))
        return res.redirect("/back");
    console.log((_v = req.session) === null || _v === void 0 ? void 0 : _v.googletoken);
    if (req.session.googletoken.expiry_date < new Date())
        client.setCredentials(yield (0, useless_1.refreshIt)(client, (_w = req.session) === null || _w === void 0 ? void 0 : _w.googletoken));
    else
        client.setCredentials((_x = req.session) === null || _x === void 0 ? void 0 : _x.googletoken);
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
    res.redirect("/");
}));
// this was hard to do
// nope is granting marks to student by teacher auth
app.post("/nope", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // cannot find submission 404
    // set userid back to test id /*'107300509570721804058'*/
    var _y;
    let correct = 0;
    let opt = req.body.opt;
    const original = yield operationModel.findById(req.body.this);
    let optDB = original === null || original === void 0 ? void 0 : original.operations;
    if (opt && optDB) {
        for (let i = 0; i < opt.length; i++) {
            // @ts-ignore 
            if (opt[i].umd == optDB[i].md)
                correct++;
            if (opt[i].ud == optDB[i].d)
                correct++;
        }
        if (opt.length != ((_y = original === null || original === void 0 ? void 0 : original.operations) === null || _y === void 0 ? void 0 : _y.length) || !optDB)
            return res.send("fuck it");
    }
    let all = optDB.length || 0;
    client.setCredentials(original.author);
    client.refreshAccessToken((err, token) => __awaiter(void 0, void 0, void 0, function* () {
        if (err)
            console.error(err);
        if (token)
            yield operationModel.findByIdAndUpdate(original === null || original === void 0 ? void 0 : original.id, { author: token });
        const classroom = googleapis_1.google.classroom({ version: 'v1', auth: client });
        const assigment = (yield classroom.courses.courseWork.studentSubmissions.list({
            userId: String(req.session.myid),
            states: ['CREATED'],
            courseId: String(original.classroom),
            courseWorkId: String(original.courseId)
        })).data.studentSubmissions;
        if (!assigment)
            return res.send("notstudent");
        let loopse = 1;
        if (all != correct)
            loopse = correct / (2 * all);
        const mark = Math.floor((loopse) * 100) || 0;
        yield classroom.courses.courseWork.studentSubmissions.patch({
            courseWorkId: String(original.courseId), courseId: String(original.classroom),
            id: String(assigment[0].id), updateMask: "assignedGrade,draftGrade",
            requestBody: {
                assignedGrade: mark,
                draftGrade: mark
            }
        });
        res.send(String(mark));
    }));
}));
// google blbosti
app.get("/privacy", (req, res) => res.render("privacy"));
app.get("/terms", (req, res) => res.render("terms"));
app.get("/sitemap.xml", (req, res) => {
    res.header('Content-Type', 'text/xml');
    res.sendFile("/sitemap.xml", { root: '.' });
});
// API Request - remove before production version
app.get("/logout", (req, res) => __awaiter(void 0, void 0, void 0, function* () { req.session = null; res.redirect("/"); }));
app.get("/meme", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const memes = require("random-memes");
    memes.random().then((meme) => res.render("meme", { meme }));
}));
app.get("/get/:id", (r, s) => __awaiter(void 0, void 0, void 0, function* () { return s.send(yield (operationModel.findById(r.params.id))); }));
app.get("/remove/classroom/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.send(yield (operationModel.updateOne({ "_id": req.params.id }, { classroom: "" })));
}));
// Epic time
app.get("/epic", (r, s) => s.render("epic"));
app.post("/epic/do", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.files);
        if (!req.files)
            res.send({ status: false, message: 'File not found.' });
        else {
            let file = req.files.die;
            // @ts-ignore
            file.mv('./epic/' + (file === null || file === void 0 ? void 0 : file.name));
            // @ts-ignore
            req.session.filename = file.name;
            return res.redirect("/epic/make");
        }
    }
    catch (error) {
        res.send(500).send(error);
    }
}));
app.get("/epic/make", (req, res) => {
    var _a;
    let pathone = path_1.default.join(__dirname, "..", "epic", (_a = req.session) === null || _a === void 0 ? void 0 : _a.filename); // '/epic/'+req.session?.filename
    console.log(pathone);
    (0, docx_tables_1.default)({
        file: pathone
    }).then((data) => {
        // .docx table data
        console.log(data);
    }).catch((err) => {
        console.error(err);
    });
    res.send("completed");
});
// Manipulation with Gcode from login
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
