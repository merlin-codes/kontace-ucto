import { Router, Request, Response } from "express";
import mongoose, { ObjectId, Schema } from 'mongoose';
import { IToken, TokenSchema } from "../morb/Token";
import { IOperation, OperationSchema } from "../morb/Operation";


const router = Router()
const jsonBody = require("body-parser").json();

const tModel = mongoose.model<IToken>("token", TokenSchema);

const qModel = mongoose.model<IOperation>("question", OperationSchema);


// routes
router.get("/new", (_: Request, s: Response) => {
    s.render("new");
});

router.post("/create",jsonBody, async (r: Request, s: Response) => {
    // redirect using client
    const {operations, token, name} = r.body;
    const author: any = await tModel.findOne({token: token});
    try {
        if (author != null || mongoose.isValidObjectId(author._id)) {
            const question = new qModel({
                author: author._id,
                name: name,
                operations: operations
            });
            await question.save();
            return s.sendStatus(200);
        } else {
            return s.sendStatus(403);
        }
    } catch (error) {
        s.sendStatus(403)
    }
});

router.get("/", async (_, s) => {
    let operations = await qModel.find();
    const users = await tModel.find();
    let operation_ful = Array();

    // operations.map(o => users.map(u => u._id == o.author ? o.push()))

    operations.map(operation  => {
        users.map(user => {   
            if (user._id.toString() == (operation.author.toString())){
                operation_ful.push({
                    name: operation.name,
                    user: user.author,
                    id: operation._id
                })
            }
        })
    })
    s.render("index", {
        operations: operation_ful.reverse()
    })
})

router.get("/opt/:id", async (_, s) => {
    let oper: any = (await qModel.findById(_.params.id));
    let ope_edit: any = []
    oper.operations.map((o: any) => {
        ope_edit.push({...o, umd: "", ud: "", correct: false})
    })
    s.render("user", {
        operations: JSON.stringify(ope_edit),
        name: oper.name,
        id: oper._id
    })
})

router.post("/del", jsonBody, async (_, s) => {
    console.log(_);
    
    const user: any = (await tModel.find({token: _.body.token}))[0] || {_id: ""};
    const oper: any = (await qModel.find({_id: _.body.id}))[0];
    console.log(user._id == oper.author);
    console.log(user);
    
    if (String(user._id) ==  String(oper.author))
        await qModel.findByIdAndRemove(oper._id);
    else return s.sendStatus(403);
    s.sendStatus(200);
})

module.exports = router;