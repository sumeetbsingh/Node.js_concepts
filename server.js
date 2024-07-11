require("dotenv").config({ path: "./.env" });
const express = require("express");
const app = require("./src/app");

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server runnin' on ${port}`);
});
