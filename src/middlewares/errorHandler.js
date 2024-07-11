const { response } = require("../utils/logger");

const notFound = async (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

const errorHandler = async (err, req, res, next) => {
  if (err.error && err.error.isJoi) {
    let errDetails = [];
    let primaryMessage = "";
    if (err.error.details) {
      err.error.details.map((item) => {
        const temp = [];
        temp[item.context.key] = item.message;
        errDetails.push(temp);
        primaryMessage = item.message;
      });
    }
    response(400, res, {
      message: primaryMessage,
      data: errDetails,
    });
  } else {
    response(err.status || 500, res, {
      message: `${err}` || `Error occurred!`,
      data: {},
    });
  }
};

module.exports = { notFound, errorHandler };
