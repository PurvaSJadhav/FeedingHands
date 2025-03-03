if(process.env.NODE_ENV !== "production"){
    require("dotenv").config();
};
const express = require("express");
const app = express();
const mongoose = require("mongoose");

// const Mongo_URL = "mongodb://127.0.0.1:27017/feedinghands";
const dbURL = process.env.MONGO_ATLAS_STRING;

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const session = require("express-session");
const MongoStore = require("connect-mongo")
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");
// Add the donation route
const donationRoutes = require("./routes/donation.js");
const moneyDonationRoutes = require('./routes/moneydonation');


main()
.then(()=>{
    console.log("Connected to DB");
})
.catch((err) =>{
    console.log(err);
});

async function main(){
    // await mongoose.connect(Mongo_URL);
    await mongoose.connect(dbURL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));


const store = MongoStore.create({
    mongoUrl: dbURL,
    crypto: {
        secret:process.env.SECRET
    },
    touchAfter: 24*60*60,   
});

store.on("error", () =>{
    console.log("Session store error", err);
});

const sessionOptions ={
    // store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);
app.use("/donations", donationRoutes);
app.use("/", userRouter);
app.use('/listings', listings);
app.use('/', moneyDonationRoutes);


app.all("*", (req, res, next) =>{
    next(new ExpressError(404, "Page not found!!"));
});

app.use((err, req, res, next) =>{
    let { statusCode = 500, message = "Something went wrong!!"} = err;
    res.status(statusCode).render("error.ejs", {message});
});

app.listen(8080, ()=>{
    console.log("Server listening on port 8080");
});