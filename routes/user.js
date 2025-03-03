const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");
const user = require("../models/user.js");

router.get("/", (req, res) =>{
    res.render("user/home.ejs");
});

router.get("/signup", (req, res) =>{
    res.render("user/signup.ejs");
});

router.post("/signup", wrapAsync(userController.signup));

router.get("/login", (req, res) =>{
    res.render("user/login.ejs");
});

router.post("/login", saveRedirectUrl, passport.authenticate("local", {failureRedirect: "/login", failureFlash: true}), userController.login);

router.get("/logout", userController.logout);

router.get("/privacy",(req, res) =>{
    res.render("user/privacy.ejs");
});

router.get("/terms",(req, res) =>{
    res.render("user/terms.ejs");
});

router.get("/aboutus",(req, res) =>{
    res.render("user/aboutus.ejs");
});

router.get("/aboutfwh",(req, res) =>{
    res.render("user/aboutfwh.ejs");
});

module.exports = router;