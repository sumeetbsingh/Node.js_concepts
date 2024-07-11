require("dotenv").config({ path: "./../../.env" });
const jwt = require("jsonwebtoken");

function sign(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
      (error, token) => {
        if (error) {
          return reject(error);
        } else {
          return resolve(token);
        }
      }
    );
  });
}

module.exports = { sign };
