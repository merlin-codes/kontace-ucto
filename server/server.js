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
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const body_parser_1 = __importDefault(require("body-parser"));
const client_1 = require("./fuckit/client");
const Operation_1 = require("./fuckit/mod/Operation");
require('dotenv').config();
/*

    Made by Miloslav Stekrt
    Let's create something new :D

*/
// making consts
const app = (0, express_1.default)();
// use
app.use((0, express_fileupload_1.default)({
    createParentPath: true
}));
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(express_1.default.static("public"));
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Creating session
app.use(require("cookie-session")({
    name: "tridentonezero",
    keys: ['fuckinggodisdeaddearnewgod', 'helpmenowyouknowyouareidiot']
}));
// set
app.set("view engine", "ejs");
// new routes
app.use("/opt", require("./fuckit/opt"));
app.use("/epic", require("./fuckit/epic"));
app.use("/google", require("./fuckit/gblbosti"));
app.use("/", require("./fuckit/api"));
app.use("/", require("./fuckit/index"));
app.use("/", require("./fuckit/gblbosti"));
app.get("/get/:id", (r, s) => __awaiter(void 0, void 0, void 0, function* () { return s.send(yield (Operation_1.Operation.findById(r.params.id))); }));
app.get("/remove/classroom/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.send(yield (Operation_1.Operation.updateOne({ "_id": req.params.id }, { classroom: "" })));
}));
app.listen(client_1.PORT, () => console.log("[SERVER]: running on " + client_1.SERVER));
mongoose_1.default.connect(process.env.URI || "").then(() => {
    console.log("Connected to Database...");
});
