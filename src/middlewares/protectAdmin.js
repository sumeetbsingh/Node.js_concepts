const { response } = require("../utils/logger");

require("../helpers/passport");

const protectAdmin = async (req, res, next) => {
  if (req.user[0].role_id !== 2) {
    return response(403, res, { message: `Access denied!`, data: {} });
  }
  next();
};

module.exports = protectAdmin;
