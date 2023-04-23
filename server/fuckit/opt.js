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
const useless_1 = require("./useless");
const client_1 = require("./client");
const googleapis_1 = require("googleapis");
const Operation_1 = require("./mod/Operation");
const router = (0, express_1.Router)();
router.get("/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.googletoken))
        return res.redirect("/");
    let newtoken = yield (0, useless_1.refreshIt)(client_1.client, (_b = req.session) === null || _b === void 0 ? void 0 : _b.googletoken);
    console.log(newtoken);
    try {
        if (((_c = req.session) === null || _c === void 0 ? void 0 : _c.googletoken.expiry_date) < new Date()) {
            let newtoken = yield (0, useless_1.refreshIt)(client_1.client, (_d = req.session) === null || _d === void 0 ? void 0 : _d.googletoken);
            client_1.client.setCredentials(newtoken);
            req.session.googletoken = newtoken;
        }
        else
            client_1.client.setCredentials((_e = req.session) === null || _e === void 0 ? void 0 : _e.googletoken);
    }
    catch (error) {
        return res.redirect("/");
    }
    googleapis_1.google.classroom({ version: "v1", auth: client_1.client }).courses.list({
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
router.get("/del/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const operation = yield Operation_1.Operation.findById(req.params.id);
    if ((operation === null || operation === void 0 ? void 0 : operation.author_id) == ((_f = req.session) === null || _f === void 0 ? void 0 : _f.myid))
        yield Operation_1.Operation.remove(operation);
    res.redirect("/");
}));
// check if user is in students of course if not redirect 'no-access page'
router.get("/:id", (_, s) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j;
    if (_.params.id.length != 24)
        return s.redirect("/");
    let oper = (yield Operation_1.Operation.findById(_.params.id)) || null;
    if (oper == null)
        return s.redirect("/");
    let ope_edit = [];
    oper.operations.map((o) => ope_edit.push(Object.assign(Object.assign({}, o), { umd: "", ud: "", ucost: Math.floor(o.cost * o.dph) || 0, correct: false })));
    if (oper.classroom != "") {
        if (!(_.session.googletoken))
            return s.redirect("/?err=no-token-no-life");
        if (((_g = _.session) === null || _g === void 0 ? void 0 : _g.googletoken.expiry_date) < new Date()) {
            try {
                let newtoken = yield (0, useless_1.refreshIt)(client_1.client, (_h = _.session) === null || _h === void 0 ? void 0 : _h.googletoken);
                client_1.client.setCredentials(newtoken);
                _.session.googletoken = newtoken;
            }
            catch (Error) {
                return s.redirect("/?err=token-cannot-be-refresh-it");
            }
        }
        else
            client_1.client.setCredentials((_j = _.session) === null || _j === void 0 ? void 0 : _j.googletoken);
        const classroom = googleapis_1.google.classroom({ version: "v1", "auth": client_1.client });
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
module.exports = router;
