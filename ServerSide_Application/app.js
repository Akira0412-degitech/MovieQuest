require('dotenv').config(); 
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');




const environment = process.env.NODE_ENV || "development";
const config = require("./knexfile.js")[environment];
const knex = require("knex")(config);

var indexRouter = require("./routes/index");
var userRouter = require("./routes/user");
var moviesRouter = require('./routes/movies');
var peopleRouter = require('./routes/people');

const { error } = require("console");

var app = express();
app.use((req, res, next) => {
  req.db = knex;
  next();
});
app.use(express.json());

const cors = require('cors');
app.use(cors()); 

app.use('/docs', swaggerUi.serve);
app.get('/docs', swaggerUi.setup(swaggerDocument));
// app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.redirect('/docs');
});


app.use('/user', userRouter);
app.use('/movies', moviesRouter);
app.use('/people', peopleRouter);


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
req.db = knex;
next();
});

app.use("/", indexRouter);

app.use("/user", userRouter);
app.get("/knex", function (req, res, next) {
  req.db.raw("SELECT VERSION()")
    .then((version) => console.log(version[0][0]))
    .catch((err) => {
      console.log(err);
      throw err;
    });

  res.send("Version Logged successfully");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});


// error handler
app.use(function (err, req, res, next) {

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error", {
    title: "Error",
    message: err.message,
    error: req.app.get("env") === "development" ? err : {}
  });
});


module.exports = app;