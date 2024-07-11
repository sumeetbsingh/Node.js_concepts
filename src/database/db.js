require("dotenv").config({ path: "./../../.env" });
const knex = require("knex");
const { Model } = require("objection");

const knexConfig = require("../../knexfile");
const environment = process.env.NODE_ENV || "development";
const Knex = knexConfig[environment];
const connection = knex(Knex);

Model.knex(connection);

module.exports = connection;
