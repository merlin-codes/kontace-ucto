import { Router } from "express";
const router = Router();


router.get("/privacy", (req, res) => res.render("privacy"))
router.get("/terms", (req, res) => res.render("terms"))
router.get("/sitemap.xml", (req, res) =>{
  res.header('Content-Type', 'text/xml');
  res.sendFile("/sitemap.xml", {root: '.'})
});

module.exports = router;
