const { Model } = require("objection");
const jwt_decode = require("jwt-decode");

class Students extends Model {
  static get tableName() {
    return "students";
  }
  static getUserByToken(token) {
    return jwt_decode(token);
  }
}

module.exports = Students;
