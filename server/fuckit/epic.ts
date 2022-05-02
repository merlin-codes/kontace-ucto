import { Router } from "express";
import { getNormal } from "./useless";
import {v4 as UID} from 'uuid';
import path from "path";
import mammoth from "mammoth";

const router = Router();


router.get("/", (req, res) => res.render("epic"));

router.post("/do", async (req, res) => {
    try {
        console.log(req.files!.die)
        if (!req.files)
            return res.send({status:false, message: 'File not found.'});
        else {
            let file = req.files.die;
            // @ts-ignore
            if (!(file?.name!.includes("doc"))) 
                return res.send(415).send();
            // @ts-ignore
            file.mv('./epic/'+getNormal(file?.name).replace(/ /g, ""));
            // @ts-ignore
            req.session!.filename = file!.name;
            return res.redirect("/epic/make");
        }
    } catch (error) {
        return res.send(500).send(error)
    }
})

// generate this to the localstorage
// redirect to '/new'
router.get("/make", async (req, res) => {
    let pathome = path.join(__dirname, "..", "..", "epic", req.session?.filename); // '/epic/'+req.session?.filename

    mammoth.extractRawText({path: pathome})
        .then(function(result: { value: any; }){
            let text = result.value; // The raw text

            //this prints all the data of docx file
            //console.log(text);
            console.log('------------------------------');
            let textLines = text.split ("\n").filter((x: string) => x != "")
                .splice(1).map((x: string) => {
                    return x.replace(/^(.\d||\d)$/g, '\n$&' )
                    .replace(/^.(.*)$/g, '$&\\')
                    .replace(/\\\n/g, ',')
                    .replace(/,$/g, '')
                    .replace(/\\/g, "")
                    .replace(',--', '')
                }).join().replace(/,\n/g, "\n").split("\n")

            console.log(textLines);

            let optTH = textLines[0].split(",");
            let isDoklad = false;
            let fckmd: number = 0;
            let fckd: number = 0; 
            let fckname: number = 0; 
            let fckdoklad: number = 0;
            let fckcost: number = 0;
            let fckdph: number = 0;
            console.log(optTH);

            for (let i=1; i<optTH.length; i++) {
                console.log(optTH[i])
                if (optTH[i].toLowerCase().includes("md")) fckmd = i;
                else if (optTH[i].toLowerCase() == "d") fckd = i;
                else if (getNormal(optTH[i]).toLowerCase() == "castka") fckcost = i;
                else if (getNormal(optTH[i]).split(" ").length >= 2) fckname = i;
                else if (optTH[i].toLowerCase() == "dph") fckdph = i;
                else if (optTH[i].includes("dokla")) {
                    fckdoklad = i;
                    isDoklad = true;
                }
            }
            // @ts-ignore
            textLines = textLines.splice(1).filter(x => typeof x[0] != 'undefined').map(line => {
                let object = {md: "", d: "", name: "", cost: "", dph: "", id: `${UID()}`};
                let fck = line.split(",");

                object.md = fck[fckmd];
                object.d = fck[fckd];
                object.cost = fck[fckcost].replace(" ", "");

                if (fckdph != 0) object.dph = fck[fckdph];

                if (isDoklad) object.name = fck[fckdoklad]+" - "+fck[fckname];
                else object.name = fck[fckname];

                return object;
            });

        console.log(textLines)

        if (!textLines) return res.send("Not working")

        return res.render('newdoc', {
            operations: textLines
        })
        console.log("this is just ended");
    });
})

module.exports = router;
