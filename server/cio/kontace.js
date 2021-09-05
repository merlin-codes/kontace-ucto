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
const mongoose_1 = __importDefault(require("mongoose"));
const Token_1 = require("../morb/Token");
const Operation_1 = require("../morb/Operation");
const router = (0, express_1.Router)();
const jsonBody = require("body-parser").json();
const tModel = mongoose_1.default.model("token", Token_1.TokenSchema);
const qModel = mongoose_1.default.model("question", Operation_1.OperationSchema);
// routes
router.get("/new", (_, s) => {
    s.render("new");
});
router.post("/create", jsonBody, (r, s) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get("/", (_, s) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get("/opt/:id", (_, s) => __awaiter(void 0, void 0, void 0, function* () {
    let oper = (yield qModel.findById(_.params.id));
    let ope_edit = [];
    oper.operations.map((o) => {
        ope_edit.push(Object.assign(Object.assign({}, o), { umd: "", ud: "", correct: false }));
    });
    s.render("user", {
        operations: JSON.stringify(ope_edit),
        name: oper.name,
        id: oper._id
    });
}));
router.post("/del", jsonBody, (_, s) => __awaiter(void 0, void 0, void 0, function* () {
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
module.exports = router;
