require("./database/db");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const express = require("express");
const userRoutes = require("./routes/api");
const authRoutes = require("./routes/admin");
const passport = require("passport");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(morgan("dev"));

// Add headers
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

app.use("/user/api/v1/", userRoutes);
app.use("/admin/api/v1", authRoutes);

app.all("*", notFound);
app.use(errorHandler);

module.exports = app;
