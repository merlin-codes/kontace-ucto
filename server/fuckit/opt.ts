import {Router, Request, Response} from "express";
import { refreshIt } from "./useless";
import { client, jsonBody } from "./client";
import { google } from "googleapis";
import { Author } from "./mod/Author";
import { Operation } from "./mod/Operation";

const router = Router();


router.get("/new", async (req: Request, res: Response) => {
    if (!(req.session?.googletoken)) return res.redirect("/");
    let newtoken = await refreshIt(client, req.session?.googletoken);
    console.log(newtoken)
    try {
        if (req.session?.googletoken.expiry_date < new Date()) {
            let newtoken = await refreshIt(client, req.session?.googletoken);
            client.setCredentials(newtoken)
            req.session!.googletoken = newtoken;
        } else client.setCredentials(req.session?.googletoken);
    } catch (error) {
        return res.redirect("/")
    }
    
    google.classroom({version: "v1", auth: client}).courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"]
    }, (e, res1) => {
        if (e) console.error(`Error i courses ${e}`);
        let courses = res1?.data.courses;
        if (courses && courses.length)
            return res.render("new")
        return res.redirect("/");
    })
});

router.get("/del/:id", async (req: Request, res: Response) => {
    const operation = await Operation.findById(req.params.id);
    if (operation?.author_id == req.session?.myid)
        await Operation.remove(operation);
    res.redirect("/");
})

// check if user is in students of course if not redirect 'no-access page'
router.get("/:id", async (_, s) => {
    if (_.params.id.length != 24) return  s.redirect("/");
    
    let oper: any = (await Operation.findById(_.params.id)) || null;
    if (oper == null) return s.redirect("/");
    
    let ope_edit: any = []
    oper.operations.map(
        (o: any) => 
            ope_edit.push({ ...o, umd: "", ud: "", ucost: Math.floor(o.cost*o.dph) || 0, correct: false })
    )
    
    if (oper.classroom != "") {
        if (!(_.session!.googletoken)) return s.redirect("/?err=no-token-no-life");
        if (_.session?.googletoken.expiry_date < new Date()) {
            try {
                let newtoken = await refreshIt(client, _.session?.googletoken);
                client.setCredentials(newtoken);
                _.session!.googletoken = newtoken;
            } catch(Error) {
                return s.redirect("/?err=token-cannot-be-refresh-it");
            }
        }
        else client.setCredentials(_.session?.googletoken);
        const classroom = google.classroom({version: "v1", "auth": client});
        classroom.courses.get({id: oper.classroom}, (e: Error | null, r?: any | null | undefined) => {
            if (e) console.log(e);
            
            let courses = r?.data;
            // @ts-ignore
            if (courses && courses!.length == 0 || e?.code == 404)
                return s.redirect("/?err=your-not-in-class")
            return s.render("user", {
                operations: JSON.stringify(ope_edit),
                name: oper.name,
                id: oper._id,
                class: true
            });
        })
    } else
        return s.render("user", {
            operations: JSON.stringify(ope_edit),
            name: oper.name,
            id: oper._id,
            class: false
        });
});


module.exports = router;

