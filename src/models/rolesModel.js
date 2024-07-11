const { Model } = require("objection");
const jwt_decode = require("jwt-decode");

class Roles extends Model {
  static get tableName() {
    return "roles";
  }
  static getUserByToken(token) {
    return jwt_decode(token);
  }
}

module.exports = Roles;
