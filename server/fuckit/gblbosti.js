"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/privacy", (req, res) => res.render("privacy"));
router.get("/terms", (req, res) => res.render("terms"));
router.get("/sitemap.xml", (req, res) => {
    res.header('Content-Type', 'text/xml');
    res.sendFile("/sitemap.xml", { root: '.' });
});
module.exports = router;
