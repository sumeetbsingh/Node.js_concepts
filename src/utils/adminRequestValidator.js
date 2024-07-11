const Joi = require("joi");

module.exports.Validators = (method) => {
  let obj = [];
  switch (method) {
    case "login":
      obj = {
        email: Joi.string().required(),
        password: Joi.string().allow(null),
      };
      break;

    case "verifyLoginOTP":
      obj = {
        email: Joi.string().required(),
        otp: Joi.string().required(),
      };
      break;

    case "assignRoles":
      obj = {
        role_id: Joi.number().required(),
      };
      break;

    case "forgotPassword":
      obj = {
        email: Joi.string().required(),
        otp: Joi.string().required(),
        new_password: Joi.string().required(),
      };
      break;

    case "updateEmployee":
      obj = {
        emp_name: Joi.string().allow(null),
        email: Joi.string().allow(null),
      };
      break;

    case "getAllEmployees":
      obj = {
        is_active: Joi.boolean().allow(null),
        role_name: Joi.string().allow(null),
      };
      break;

    case "exportToExcel":
      obj = {
        is_active: Joi.boolean().allow(null),
        role_name: Joi.string().allow(null),
      };
      break;

    case "createRole":
      obj = {
        role_name: Joi.string().required(),
      };
      break;

    case "updateRole":
      obj = {
        role_name: Joi.string().required(),
      };
      break;
  }
  return Joi.object(obj);
};
