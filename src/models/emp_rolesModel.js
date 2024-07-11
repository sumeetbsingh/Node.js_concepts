const { Model } = require("objection");
const jwt_decode = require("jwt-decode");

class EmpRoles extends Model {
  static get tableName() {
    return "emp_roles";
  }
  static getUserByToken(token) {
    return jwt_decode(token);
  }
}

module.exports = EmpRoles;
