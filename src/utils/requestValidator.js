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

    case "forgotPassword":
      obj = {
        email: Joi.string().required(),
        otp: Joi.string().required(),
        new_password: Joi.string().required(),
      };
      break;

    case "registerEmployees":
      obj = {
        email: Joi.string().required(),
      };
      break;

    case "verifyRegisterationOTP":
      obj = {
        emp_name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        otp: Joi.string().required(),
      };
      break;

    case "updateEmployee":
      obj = {
        emp_name: Joi.string().allow(null),
        email: Joi.string().allow(null),
      };
      break;

    case "addStudent":
      obj = {
        s_name: Joi.string().required(),
        s_email: Joi.string().required(),
      };
      break;

    case "updateStudent":
      obj = {
        s_name: Joi.string().allow(null),
        s_email: Joi.string().allow(null),
      };
      break;

    case "assignTeacher":
      obj = {
        emp_id: Joi.number().required(),
      };
      break;

    case "getAllStudentsByAdmin":
      obj = {
        under_teacher: Joi.number().allow(null),
      };
      break;

    case "exportToExcel":
      obj = {
        under_teacher: Joi.number().allow(null),
        is_active: Joi.boolean().allow(null),
      };
      break;

    case "addChemical":
      obj = {
        chem_name: Joi.string().required(),
        severity: Joi.string().required(),
        expiring_on: Joi.date().required(),
        quantity: Joi.string().required(),
      };
      break;

    case "updateChemical":
      obj = {
        chem_name: Joi.string().allow(null),
        severity: Joi.string().allow(null),
        expiring_on: Joi.date().allow(null),
        quantity: Joi.string().allow(null),
      };
      break;
  }
  return Joi.object(obj);
};
