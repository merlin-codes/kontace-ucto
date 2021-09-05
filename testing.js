const app = require("express")();

app.get("/", (req, res) => {
    res.send("isworking")
})

app.listen(3000, () => console.log('server is running'))