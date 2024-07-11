require("../helpers/passport");
const passport = require("passport");
const express = require("express");
// controller
const employeeController = require("../controllers/employeeController");
const roleController = require("../controllers/roleController");
// middlewares
const protectPrinci = require("../middlewares/protectPrincipal");
const validator = require("express-joi-validation").createValidator({
  passError: true,
});
const adminValidator = require("../utils/adminRequestValidator");
const imageUpload = require("../middlewares/imageUpload");

const router = express.Router();

// router.post();
router.post(
  "/login",
  validator.body(adminValidator.Validators("login")),
  employeeController.login
);

router.post(
  "/login/verify-OTP",
  validator.body(adminValidator.Validators("verifyLoginOTP")),
  employeeController.verifyLoginOTP
);

router.post(
  "/login/password-reset",
  validator.body(adminValidator.Validators("forgotPassword")),
  employeeController.forgotPassword
);

router.post(
  "/assignRole/:id",
  passport.authenticate("jwt", { session: false }),
  validator.body(adminValidator.Validators("assignRoles")),
  protectPrinci,
  employeeController.assignRoles
);

router.patch(
  "/update",
  passport.authenticate("jwt", { session: false }),
  validator.body(adminValidator.Validators("updateEmployee")),
  employeeController.updateEmployee
);

router.get(
  "/employees/:emp_id",
  passport.authenticate("jwt", { session: false }),
  protectPrinci,
  employeeController.getEmployeeById
);

router.get(
  "/employees",
  passport.authenticate("jwt", { session: false }),
  validator.body(adminValidator.Validators("getAllEmployees")),
  protectPrinci,
  employeeController.getAllEmployees
);

router.post(
  "/employees/export",
  passport.authenticate("jwt", { session: false }),
  validator.body(adminValidator.Validators("exportToExcel")),
  protectPrinci,
  employeeController.exportToExcel
);

router.delete(
  "/delete/:id",
  passport.authenticate("jwt", { session: false }),
  protectPrinci,
  employeeController.deleteEmployee
);

router.patch(
  "/upload/image",
  passport.authenticate("jwt", { session: false }),
  imageUpload.single("file"),
  employeeController.uploadImage
);

router.post(
  "/roles/create",
  passport.authenticate("jwt", { session: false }),
  protectPrinci,
  roleController.createRole
);

router.get(
  "/roles",
  passport.authenticate("jwt", { session: false }),
  protectPrinci,
  roleController.getAllRoles
);

router.get(
  "/roles/:role_id",
  passport.authenticate("jwt", { session: false }),
  protectPrinci,
  roleController.getRoleById
);

router.patch(
  "/roles/update/:role_id",
  passport.authenticate("jwt", { session: false }),
  protectPrinci,
  roleController.updateRole
);

router.delete(
  "/roles/delete/:role_id",
  passport.authenticate("jwt", { session: false }),
  protectPrinci,
  roleController.deleteRole
);

router.post(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  protectPrinci,
  employeeController.logout
);

module.exports = router;
