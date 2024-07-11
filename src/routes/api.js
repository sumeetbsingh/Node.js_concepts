const passport = require("passport");
require("../helpers/passport");
const express = require("express");
// controllers
const employeeController = require("../controllers/employeeController");
const studentController = require("../controllers/studentController");
const chemicalController = require("../controllers/chemicalController");
// middlewares
const validator = require("express-joi-validation").createValidator({
  passError: true,
});
const userValidator = require("../utils/requestValidator");
const excelUpload = require("../middlewares/otherFilesUpload");
const imageUpload = require("../middlewares/imageUpload");
const protectAdmin = require("../middlewares/protectAdmin");
const protectTeacher = require("../middlewares/protectTeacher");
const protectLabIncharge = require("../middlewares/protectLabIncharge");

const router = express.Router();

// router.post()
router.post(
  "/employees/register",
  validator.body(userValidator.Validators("registerEmployees")),
  employeeController.registerEmployees
);

router.post(
  "/employees/register/verify-OTP",
  validator.body(userValidator.Validators("verifyRegisterationOTP")),
  employeeController.verifyRegisterationOTP
);

router.post(
  "/employees/login",
  validator.body(userValidator.Validators("login")),
  employeeController.login
);

router.post(
  "/employees/login/verify-OTP",
  validator.body(userValidator.Validators("verifyLoginOTP")),
  employeeController.verifyLoginOTP
);

router.post(
  "/employees/login/password-reset",
  validator.body(userValidator.Validators("forgotPassword")),
  employeeController.forgotPassword
);

router.patch(
  "/employees/update",
  passport.authenticate("jwt", { session: false }),
  validator.body(userValidator.Validators("updateEmployee")),
  // protectAdmin,
  employeeController.updateEmployee
);

router.post(
  "/employees/logout",
  passport.authenticate("jwt", { session: false }),
  // protectAdmin,
  employeeController.logout
);

router.patch(
  "/employees/upload/image",
  passport.authenticate("jwt", { session: false }),
  imageUpload.single("file"),
  employeeController.uploadImage
);

router.post(
  "/students/upload/students-data",
  passport.authenticate("jwt", { session: false }),
  protectAdmin,
  excelUpload.array("files", 3),
  studentController.excelToStudentsDB
);

router.post(
  "/students/add",
  passport.authenticate("jwt", { session: false }),
  validator.body(userValidator.Validators("addStudent")),
  protectAdmin,
  studentController.addStudent
);

router.get(
  "/students/:s_id",
  passport.authenticate("jwt", { session: false }),
  protectAdmin,
  studentController.getStudentByID
);

router.get(
  "/students",
  passport.authenticate("jwt", { session: false }),
  validator.body(userValidator.Validators("getAllStudentsByAdmin")),
  protectAdmin,
  studentController.getAllStudentsByAdmin
);

router.post(
  "/students/export",
  passport.authenticate("jwt", { session: false }),
  validator.body(userValidator.Validators("exportToExcel")),
  studentController.exportToExcel
);

router.get(
  "/teacher/students/:s_id",
  passport.authenticate("jwt", { session: false }),
  protectTeacher,
  studentController.getStudentByIdByTeacher
);

router.get(
  "/teacher/students",
  passport.authenticate("jwt", { session: false }),
  protectTeacher,
  studentController.getStudentsByTeacher
);

router.patch(
  "/students/update/:s_id",
  passport.authenticate("jwt", { session: false }),
  validator.body(userValidator.Validators("updateStudent")),
  protectAdmin,
  studentController.updateStudent
);

router.delete(
  "/students/delete/:s_id",
  passport.authenticate("jwt", { session: false }),
  protectAdmin,
  studentController.deleteStudent
);

router.post(
  "/students/assign-teacher/:s_id",
  passport.authenticate("jwt", { session: false }),
  validator.body(userValidator.Validators("assignTeacher")),
  protectAdmin,
  studentController.assignTeacher
);

router.post(
  "/chemicals/add",
  passport.authenticate("jwt", { session: false }),
  validator.body(userValidator.Validators("addChemical")),
  protectLabIncharge,
  chemicalController.addChemical
);

router.get(
  "/chemicals/:c_id",
  passport.authenticate("jwt", { session: false }),
  protectLabIncharge,
  chemicalController.getChemicalByID
);

router.get(
  "/chemicals",
  passport.authenticate("jwt", { session: false }),
  protectLabIncharge,
  chemicalController.getAllChemicals
);

router.patch(
  "/chemicals/update/:c_id",
  passport.authenticate("jwt", { session: false }),
  validator.body(userValidator.Validators("updateChemical")),
  protectLabIncharge,
  chemicalController.updateChemical
);

router.delete(
  "/chemicals/delete/:c_id",
  passport.authenticate("jwt", { session: false }),
  protectLabIncharge,
  chemicalController.deleteChemical
);

module.exports = router;
