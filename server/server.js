"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const mongoose_1 = __importStar(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const googleapis_1 = require("googleapis");
const bcrypt_1 = __importDefault(require("bcrypt"));
require('dotenv').config();
// making consts
const app = (0, express_1.default)();
const bodyParser = require("body-parser");
const jsonBody = bodyParser.json();
const PORT = +(process.env.PORT || 3103);
const SCOPES = [
    'https://www.googleapis.com/auth/classroom.coursework.me',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students'
];
const auth = new googleapis_1.google.auth.OAuth2({
    clientId: process.env.CID, clientSecret: process.env.CSECREAT, redirectUri: `http://localhost:${PORT}/auth`
});
const ftokens = "ahoj jak se mas neni tento svet tak nadherny a taky uzasny lidi tohle muze stvat ale proc ne tebe".split(" ");
// Schema
const TokenSchema = new mongoose_1.Schema({
    author: String,
    token: String
});
const tModel = mongoose_1.default.model("token", TokenSchema);
const OperationSchema = new mongoose_1.Schema({
    author: { type: mongoose_1.default.Schema.Types.ObjectId, ref: '_id' },
    name: String,
    operations: []
});
const qModel = mongoose_1.default.model("question", OperationSchema);
// use
app.use((0, cors_1.default)());
app.use(bodyParser.json());
app.use(express_1.default.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
// Creating session
app.use(require("cookie-session")({
    name: "cokkies",
    keys: ['key1', 'key2']
}));
// set
app.set("view engine", "ejs");
// routes
app.get("/new", (_, s) => {
    s.render("new");
});
app.post("/create", jsonBody, (r, s) => __awaiter(void 0, void 0, void 0, function* () {
    // redirect using client
    const { operations, token, name } = r.body;
    const author = yield tModel.findOne({ token: token });
    try {
        if (author != null || mongoose_1.default.isValidObjectId(author._id)) {
            const question = new qModel({
                author: author._id,
                name: name,
                operations: operations
            });
            yield question.save();
            return s.sendStatus(200);
        }
        else {
            return s.sendStatus(403);
        }
    }
    catch (error) {
        s.sendStatus(403);
    }
}));
app.get("/", (_, s) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = _.session) === null || _a === void 0 ? void 0 : _a.googletoken))
        return s.redirect("/login");
    let operations = yield qModel.find();
    const users = yield tModel.find();
    let operation_ful = Array();
    // operations.map(o => users.map(u => u._id == o.author ? o.push()))
    operations.map(operation => {
        users.map(user => {
            if (user._id.toString() == (operation.author.toString())) {
                operation_ful.push({
                    name: operation.name,
                    user: user.author,
                    id: operation._id
                });
            }
        });
    });
    s.render("index", {
        operations: operation_ful.reverse()
    });
}));
app.get("/opt/:id", (_, s) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    let oper = (yield qModel.findById(_.params.id));
    let ope_edit = [];
    oper.operations.map((o) => {
        ope_edit.push(Object.assign(Object.assign({}, o), { umd: "", ud: "", correct: false }));
    });
    if (!((_b = _.session) === null || _b === void 0 ? void 0 : _b.id))
        _.session.id = ftokens[Math.floor(Math.random() * ftokens.length)];
    bcrypt_1.default.hash((_c = _.session) === null || _c === void 0 ? void 0 : _c.id, 10, (e1, response) => {
        if (e1)
            return s.send("Bcrypt module is broken " + e1);
        return s.render("user", {
            operations: JSON.stringify(ope_edit),
            name: oper.name,
            token: response,
            id: oper._id
        });
    });
}));
app.post("/del", jsonBody, (_, s) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(_);
    const user = (yield tModel.find({ token: _.body.token }))[0] || { _id: "" };
    const oper = (yield qModel.find({ _id: _.body.id }))[0];
    console.log(user._id == oper.author);
    console.log(user);
    if (String(user._id) == String(oper.author))
        yield qModel.findByIdAndRemove(oper._id);
    else
        return s.sendStatus(403);
    s.sendStatus(200);
}));
app.get("/login", (req, res) => {
    const loginurl = auth.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.render("login", { url: loginurl });
});
app.get("/auth", (req, res) => {
    const code = req.query.code || "";
    auth.getToken(String(code), (err, token) => {
        if (err)
            console.error(`Something wrong with token: ${err}`);
        // const user = auth.getTokenInfo
        console.log(auth);
        req.session = Object.assign(Object.assign({}, req.session), { googletoken: token });
        res.redirect("/");
    });
});
app.get("/back", (_, s) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    auth.setCredentials((_d = _.session) === null || _d === void 0 ? void 0 : _d.googletoken);
    let userinfo;
    const classroom = googleapis_1.google.classroom({ version: "v1", auth });
    googleapis_1.google.oauth2({ auth, version: "v2" }).userinfo.get((err, res) => err ? console.error(err) : userinfo = res);
    console.log(userinfo);
    let courses;
    classroom.courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"]
    }, (e, res) => {
        if (e)
            console.error(`Error i courses ${e}`);
        courses = res === null || res === void 0 ? void 0 : res.data.courses;
        if (courses && courses.length) {
            s.render("select-course", {
                courses: courses
            });
            // s.send("You have some courses here");
        }
        else {
            // s.send("I dont find any courses");
            s.redirect("/login");
        }
    });
    // s.redirect("/");
}));
app.post("/course", jsonBody, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body.courseid);
    const classroom = googleapis_1.google.classroom({ version: "v1", auth });
    const coureswork = yield classroom.courses.courseWork.create({
        courseId: req.body.courseid,
        fields: "Random Text"
    });
    // list({
    //     courseId: req.body.courseid
    // }); // courses.get({id: req.body.courseid})
    console.log(coureswork);
    res.redirect("/back");
}));
app.listen(PORT, () => console.log("HIPE"));
mongoose_1.default.connect(process.env.URI || "").then(() => {
    // app.listen(PORT);
    console.log("[SERVER]: running on http://localhost:" + PORT);
});
