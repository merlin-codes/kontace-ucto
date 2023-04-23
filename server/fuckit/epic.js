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
const useless_1 = require("./useless");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const mammoth_1 = __importDefault(require("mammoth"));
const router = (0, express_1.Router)();
router.get("/", (req, res) => res.render("epic"));
router.post("/do", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.files.die);
        if (!req.files)
            return res.send({ status: false, message: 'File not found.' });
        else {
            let file = req.files.die;
            // @ts-ignore
            if (!(file === null || file === void 0 ? void 0 : file.name.includes("doc")))
                return res.send(415).send();
            // @ts-ignore
            file.mv('./epic/' + (0, useless_1.getNormal)(file === null || file === void 0 ? void 0 : file.name).replace(/ /g, ""));
            // @ts-ignore
            req.session.filename = file.name;
            return res.redirect("/epic/make");
        }
    }
    catch (error) {
        return res.send(500).send(error);
    }
}));
// generate this to the localstorage
// redirect to '/new'
router.get("/make", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let pathome = path_1.default.join(__dirname, "..", "..", "epic", (_a = req.session) === null || _a === void 0 ? void 0 : _a.filename); // '/epic/'+req.session?.filename
    mammoth_1.default.extractRawText({ path: pathome })
        .then(function (result) {
        let text = result.value; // The raw text
        //this prints all the data of docx file
        //console.log(text);
        console.log('------------------------------');
        let textLines = text.split("\n").filter((x) => x != "")
            .splice(1).map((x) => {
            return x.replace(/^(.\d||\d)$/g, '\n$&')
                .replace(/^.(.*)$/g, '$&\\')
                .replace(/\\\n/g, ',')
                .replace(/,$/g, '')
                .replace(/\\/g, "")
                .replace(',--', '');
        }).join().replace(/,\n/g, "\n").split("\n");
        console.log(textLines);
        let optTH = textLines[0].split(",");
        let isDoklad = false;
        let fckmd = 0;
        let fckd = 0;
        let fckname = 0;
        let fckdoklad = 0;
        let fckcost = 0;
        let fckdph = 0;
        console.log(optTH);
        for (let i = 1; i < optTH.length; i++) {
            console.log(optTH[i]);
            if (optTH[i].toLowerCase().includes("md"))
                fckmd = i;
            else if (optTH[i].toLowerCase() == "d")
                fckd = i;
            else if ((0, useless_1.getNormal)(optTH[i]).toLowerCase() == "castka")
                fckcost = i;
            else if ((0, useless_1.getNormal)(optTH[i]).split(" ").length >= 2)
                fckname = i;
            else if (optTH[i].toLowerCase() == "dph")
                fckdph = i;
            else if (optTH[i].includes("dokla")) {
                fckdoklad = i;
                isDoklad = true;
            }
        }
        // @ts-ignore
        textLines = textLines.splice(1).filter(x => typeof x[0] != 'undefined').map(line => {
            let object = { md: "", d: "", name: "", cost: "", dph: "", id: `${(0, uuid_1.v4)()}` };
            let fck = line.split(",");
            object.md = fck[fckmd];
            object.d = fck[fckd];
            object.cost = fck[fckcost].replace(" ", "");
            if (fckdph != 0)
                object.dph = fck[fckdph];
            if (isDoklad)
                object.name = fck[fckdoklad] + " - " + fck[fckname];
            else
                object.name = fck[fckname];
            return object;
        });
        console.log(textLines);
        if (!textLines)
            return res.send("Not working");
        return res.render('newdoc', {
            operations: textLines
        });
        console.log("this is just ended");
    });
}));
module.exports = router;
