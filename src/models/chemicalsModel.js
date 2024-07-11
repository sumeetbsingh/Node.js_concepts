const { Model } = require("objection");
const jwt_decode = require("jwt-decode");

class Chemicals extends Model {
  static get tableName() {
    return "chemicals";
  }
  static getUserByToken(token) {
    return jwt_decode(token);
  }
}

module.exports = Chemicals;
