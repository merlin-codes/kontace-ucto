import { Router } from "mongoose";
const router = Router();
const jsonBody = require("body-parser").json();

router.get("/new", (req: Request,res: Response) => res.render("new"));

router.post("/create", jsonBody, async (r: Request, s: Response) => {

	// getting data
    const { operations, token, name } = r.body;

    // getting token by user change to email or id, etc.
    const author: any = await tModel.findOne({ token: token });


    try {
        // valide token and create new operation
        if (author != null || mongoose.isValidObjectId(author._id)) {
            const question = new qModel({
                author: author._id,
                name: name,
                operations: operations
            });
            await question.save();

        // sending status
            return s.sendStatus(200);
        } else {
            return s.sendStatus(403);
        }
    } catch (error) {
        s.sendStatus(403)
    }
});

