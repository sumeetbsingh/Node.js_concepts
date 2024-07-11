const { Model } = require("objection");
const jwt_decode = require("jwt-decode");

class OTP extends Model {
  static get tableName() {
    return "otp";
  }
  static getUserByToken(token) {
    return jwt_decode(token);
  }
}

module.exports = OTP;
