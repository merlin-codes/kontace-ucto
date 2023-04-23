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
const express_1 = require("express");
const client_1 = require("./client");
const useless_1 = require("./useless");
const Operation_1 = require("./mod/Operation");
const googleapis_1 = require("googleapis");
const body_parser_1 = __importDefault(require("body-parser"));
const router = (0, express_1.Router)();
const jsonBody = body_parser_1.default.json();
// Manipulation with Gcode from login
router.post("/get-code", jsonBody, (req, res) => {
    req.session.googlecode = req.body.code;
    return res.send("Code saved");
});
router.get("/save-token", (req, res) => res.render("local", { code: req.session.googlecode }));
router.get("/show-token", (req, res) => { var _a; return res.send((_a = req.session) === null || _a === void 0 ? void 0 : _a.googletoken); });
router.post("/course", jsonBody, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    console.log(req.body);
    if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.googletoken))
        return res.redirect("/back");
    console.log((_b = req.session) === null || _b === void 0 ? void 0 : _b.googletoken);
    if (req.session.googletoken.expiry_date < new Date()) {
        let newtoken = yield (0, useless_1.refreshIt)(client_1.client, (_c = req.session) === null || _c === void 0 ? void 0 : _c.googletoken);
        client_1.client.setCredentials(newtoken);
        req.session.googletoken = newtoken;
    }
    else
        client_1.client.setCredentials((_d = req.session) === null || _d === void 0 ? void 0 : _d.googletoken);
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
// this was hard to do
// nope is granting marks to student by teacher auth
router.post("/nope", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    console.log((_e = req.session) === null || _e === void 0 ? void 0 : _e.googletoken);
    // cannot find submission 404
    // set userid back to test id /*'107300509570721804058'*/
    let opt = req.body.opt;
    const original = yield Operation_1.Operation.findById(req.body.this);
    let optDB = original === null || original === void 0 ? void 0 : original.operations;
    let all = optDB.length || 0;
    let correct = (0, useless_1.correctIt)(opt, optDB || []);
    client_1.client.setCredentials(original.author);
    client_1.client.refreshAccessToken((err, token) => __awaiter(void 0, void 0, void 0, function* () {
        if (err)
            console.error(err);
        if (token)
            yield Operation_1.Operation.findByIdAndUpdate(original === null || original === void 0 ? void 0 : original.id, { author: token });
        const classroom = googleapis_1.google.classroom({ version: 'v1', auth: client_1.client });
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
            loopse = correct / (2 * all) || 0;
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
module.exports = router;
