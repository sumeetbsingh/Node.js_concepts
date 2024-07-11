const { response } = require("../utils/logger");

require("../helpers/passport");

const protectLabIncharge = async (req, res, next) => {
  if (req.user[0].role_id !== 4) {
    return response(403, res, { message: `Access denied!`, data: {} });
  }
  next();
};

module.exports = protectLabIncharge;
