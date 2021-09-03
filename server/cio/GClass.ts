import { Router, Request, Response } from "express";
import { google } from "googleapis";

const router =  Router();


router.get("/", async (req: Request, res: Response) => {
    const auth = new google.auth.GoogleAuth({
        keyFile: "server/data/credential.json",
        scopes: "https://www.googleapis.com/auth/classroom"
    })
    
    const client = await auth.getClient();

    const googleClass = google.classroom({version: "v1", auth: client}) // version of api is 1

    const id = "Mzg4MTcwMDkzNTI4";
    
    const metadata = await googleClass.courses.get({
        auth, id
    })

    res.send(id)
})


module.exports = router