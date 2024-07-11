const { Model } = require("objection");
const jwt_decode = require("jwt-decode");

class Employees extends Model {
  static get tableName() {
    return "employees";
  }
  static getUserByToken(token) {
    return jwt_decode(token);
  }
}

module.exports = Employees;
