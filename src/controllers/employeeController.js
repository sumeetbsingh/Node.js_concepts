// principal adds and can set is_active: false for other employees including teachers, lab incharge and students
// prinipal gets to assign role in employee_roles table
// images as filename in employees table
// mailing OTPs and verifying them is needed

require("dotenv").config({ path: "./../../.env" });
require("../database/db");
const { S3, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const XLSX = require("xlsx");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("../helpers/jwt");
const nodemailer = require("nodemailer");
const Employees = require("../models/employeesModel");
const EmpRoles = require("../models/emp_rolesModel");
const OTP = require("../models/otpModel");
const Roles = require("../models/rolesModel");
const { response, catchFailure } = require("../utils/logger");

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVICE_HOST,
    port: process.env.EMAIL_SERVICE_PORT,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_USER_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_SENDER, // sender address
      to: email, // list of receivers
      subject: "OTP Verification", // Subject line
      text: `Your One Time Password is ${otp}\n`, // plain text body
      html: `<b>OTP is ${otp}</b>`, // html body
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.log(error);
  }
};

// employee
exports.registerEmployees = async (req, res) => {
  try {
    const { email } = req.body;
    const existingEmp = await Employees.query().where({ email: email }).first();
    if (existingEmp) {
      throw new Error(
        `Employee with this email is already registered, please login!`
      );
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpGeneratedAt = new Date();
    const otpExpiresAt = new Date(otpGeneratedAt.getTime() + 5 * 60000); // OTP valid for 5 minutes

    await OTP.query()
      .insert({
        email,
        otp,
        generated_at: otpGeneratedAt.toISOString(),
        expires_at: otpExpiresAt.toISOString(),
      })
      .returning(["otp_id", "email", "otp", "generated_at", "expires_at"]);
    await sendOtpEmail(email, otp);
    return response(201, res, { message: "OTP sent to this email", data: {} });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employee
exports.verifyRegisterationOTP = async (req, res) => {
  try {
    const { emp_name, email, password, otp } = req.body;
    const checkOtp = await OTP.query()
      .where({ email: email, otp: otp })
      .first();
    if (!checkOtp) {
      throw new Error(`Invalid OTP, registeration unsuccessful!`);
    }

    const currentTime = new Date();

    // Check if the OTP is expired
    if (currentTime.getTime() > new Date(checkOtp.expires_at).getTime()) {
      // Delete the expired OTP
      await OTP.query().where({ otp_id: checkOtp.otp_id }).del();
      throw new Error("OTP expired, login unsuccessful!");
    }

    await OTP.query().where({ otp_id: checkOtp.otp_id }).del();
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertEmployee = {
      emp_name,
      email,
      password: hashedPassword,
    };
    await Employees.query()
      .insert(insertEmployee)
      .returning(["emp_id", "emp_name", "email"]);
    return response(200, res, { message: `Registeration complete!`, data: {} });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// admin (principal)
exports.assignRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const role_id = req.body.role_id;
    const validEmp = await Employees.query().where({ emp_id: id }).first();
    if (!validEmp) {
      throw new Error(`The employee with ${id} is not registered`);
    }
    const existingEmp = await EmpRoles.query().where({ emp_id: id }).first();
    if (existingEmp && existingEmp.role_id === role_id) {
      throw new Error(`Employee already has role id ${role_id}`);
    }
    const role = await Roles.query()
      .select(`roles.role_name`)
      .where({ role_id: role_id });
    if (!existingEmp || existingEmp.role_id !== role_id) {
      await EmpRoles.query().insert({
        emp_id: id,
        role_id: role_id,
      });
      return response(201, res, {
        message: `Role id ${role_id} assigned to employee id ${id}`,
        data: { role: role },
      });
    }
  } catch (error) {
    return catchFailure(res, error);
  }
};

// principal and employee both
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingEmp = await Employees.query().where({ email: email }).first();
    if (!existingEmp) {
      throw new Error(`Invalid email!`);
    }

    if (existingEmp.is_active === false) {
      throw new Error(`Invalid access, contact admin!`);
    }

    if (password !== undefined) {
      const validEmp = await bcrypt.compare(password, existingEmp.password);
      if (!validEmp) {
        throw new Error(`Invalid password!`);
      }
    }

    // send OTP via email
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpGeneratedAt = new Date();
    const otpExpiresAt = new Date(otpGeneratedAt.getTime() + 5 * 60000); // OTP valid for 5 minutes

    const storeOtp = await OTP.query()
      .insert({
        email,
        otp,
        generated_at: otpGeneratedAt.toISOString(),
        expires_at: otpExpiresAt.toISOString(),
      })
      .returning(["otp_id", "email", "otp", "generated_at", "expires_at"]);
    await sendOtpEmail(email, otp);
    return response(200, res, {
      message: `OTP sent to your registered email`,
      data: {},
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// principal and employee both
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const checkOtp = await OTP.query()
      .where({ email: email, otp: otp })
      .first();
    if (!checkOtp) {
      throw new Error(`Invalid credentials, Login unsuccessful!`);
    }

    const currentTime = new Date();

    // Check if the OTP is expired
    if (currentTime.getTime() > new Date(checkOtp.expires_at).getTime()) {
      // Delete the expired OTP
      await OTP.query().where({ otp_id: checkOtp.otp_id }).del();
      throw new Error("OTP expired, login unsuccessful!");
    }

    const employee = await Employees.query().where({ email: email }).first();
    const empRole = await EmpRoles.query()
      .where({ emp_id: employee.emp_id })
      .first();
    const token = await jwt.sign({
      emp_id: empRole.emp_id,
      role_id: empRole.role_id,
    });

    await OTP.query().where({ otp_id: checkOtp.otp_id }).del();
    return response(200, res, {
      message: `Login successful!`,
      data: { token: token },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// principal and employee both
exports.forgotPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    const checkOtp = await OTP.query()
      .where({ email: email, otp: otp })
      .first();
    if (!checkOtp) {
      throw new Error(`Invalid credentials, Login unsuccessful!`);
    }
    const currentTime = new Date();

    // Check if the OTP is expired
    if (currentTime.getTime() > new Date(checkOtp.expires_at).getTime()) {
      // Delete the expired OTP
      await OTP.query().where({ otp_id: checkOtp.otp_id }).del();
      throw new Error("OTP expired, login unsuccessful!");
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await Employees.query()
      .where({ email: email })
      .update({ password: hashedPassword });
    await OTP.query().where({ otp_id: checkOtp.otp_id }).del();
    return response(200, res, {
      message: `Password updated successfully, please login!`,
      data: {},
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// admin and employee both
exports.updateEmployee = async (req, res) => {
  try {
    const { emp_name, email } = req.body;
    const emp_id = req.user[0].emp_id;
    const existingEmp = await Employees.query()
      .where({ emp_id: emp_id })
      .first();
    if (!existingEmp) {
      throw new Error(`Invalid email!`);
    }
    const updateEmp = {
      emp_name: emp_name,
      email: email,
    };
    await Employees.query()
      .where({ emp_id: existingEmp.emp_id })
      .update(updateEmp);
    return response(200, res, { message: `Data updated`, data: {} });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// admin (principal)
exports.getEmployeeById = async (req, res) => {
  try {
    const { emp_id } = req.params;
    const existingEmp = await Employees.query()
      .select(
        "employees.emp_id",
        "employees.emp_name",
        "employees.email",
        "employees.image_file",
        "employees.created_at",
        "employees.updated_at",
        "employees.is_active",
        "roles.role_name"
      )
      .leftJoin("emp_roles", "employees.emp_id", "emp_roles.emp_id")
      .leftJoin("roles", "emp_roles.role_id", "roles.role_id")
      .where("employees.emp_id", emp_id);

    if (!existingEmp) {
      throw new Error(`No employee with this ID exists!`);
    }
    return response(200, res, {
      message: `Employee with ID ${emp_id} found!`,
      data: existingEmp,
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// admin (principal)
exports.getAllEmployees = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 3;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    const is_active =
      req.body.is_active === "" ? undefined : req.body.is_active;
    if (is_active === null) {
      is_active = undefined;
    }
    const role_name =
      req.body.role_name === "" ? undefined : req.body.role_name;
    if (role_name === null) {
      role_name = undefined;
    }
    let totalData = await Employees.query().count();
    totalData = totalData[0].count;
    let posts = [];
    let totalFiltered = 0;

    let query = await Employees.query()
      .select(
        "employees.emp_id",
        "employees.emp_name",
        "employees.email",
        "employees.image_file",
        "employees.created_at",
        "employees.updated_at",
        "employees.is_active",
        "roles.role_name"
      )
      .leftJoin("emp_roles", "employees.emp_id", "emp_roles.emp_id")
      .leftJoin("roles", "emp_roles.role_id", "roles.role_id")
      .offset(offset)
      .limit(limit)
      .orderBy(`employees.emp_id`);

    if (is_active !== null && is_active !== undefined) {
      query = await Employees.query()
        .select(
          "employees.emp_id",
          "employees.emp_name",
          "employees.email",
          "employees.image_file",
          "employees.created_at",
          "employees.updated_at",
          "employees.is_active",
          "roles.role_name"
        )
        .leftJoin("emp_roles", "employees.emp_id", "emp_roles.emp_id")
        .leftJoin("roles", "emp_roles.role_id", "roles.role_id")
        .where("employees.is_active", is_active)
        .offset(offset)
        .limit(limit)
        .orderBy(`employees.emp_id`);
    }

    if (role_name !== null && role_name !== undefined) {
      query = await Employees.query()
        .select(
          "employees.emp_id",
          "employees.emp_name",
          "employees.email",
          "employees.image_file",
          "employees.created_at",
          "employees.updated_at",
          "employees.is_active",
          "roles.role_name"
        )
        .leftJoin("emp_roles", "employees.emp_id", "emp_roles.emp_id")
        .leftJoin("roles", "emp_roles.role_id", "roles.role_id")
        .where("roles.role_name", role_name)
        .offset(offset)
        .limit(limit)
        .orderBy(`employees.emp_id`);
    }

    posts = await query;
    totalFiltered = posts.length;

    let totalPages;

    if (is_active !== undefined || role_name !== undefined) {
      totalPages = 1;
      let modulo = totalFiltered % limit;
      if (modulo == 0) {
        totalPages = totalFiltered / limit;
      } else {
        totalPages = Math.ceil(totalFiltered / limit);
      }
      totalData = totalFiltered;
    } else {
      totalPages = 1;
      let modulo = totalData % limit;
      if (modulo == 0) {
        totalPages = totalData / limit;
      } else {
        totalPages = Math.ceil(totalData / limit);
      }
    }

    return response(200, res, {
      message: `Data requested found!`,
      data: {
        totalRecords: parseInt(totalData),
        filteredRecords: parseInt(totalFiltered),
        data: posts,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// admin (principal)
exports.exportToExcel = async (req, res) => {
  try {
    let is_active = req.body.is_active === "" ? undefined : req.body.is_active;
    if (is_active === null) {
      is_active = undefined;
    }
    let role_name = req.body.role_name === "" ? undefined : req.body.role_name;
    if (role_name === null) {
      role_name = undefined;
    }

    let query = Employees.query()
      .select(
        "employees.emp_id",
        "employees.emp_name",
        "employees.email",
        "employees.image_file",
        "employees.created_at",
        "employees.updated_at",
        "employees.is_active",
        "roles.role_name"
      )
      .leftJoin("emp_roles", "employees.emp_id", "emp_roles.emp_id")
      .leftJoin("roles", "emp_roles.role_id", "roles.role_id")
      .orderBy("employees.emp_id");

    if (is_active !== null && is_active !== undefined) {
      query = await Employees.query()
        .select(
          "employees.emp_id",
          "employees.emp_name",
          "employees.email",
          "employees.image_file",
          "employees.created_at",
          "employees.updated_at",
          "employees.is_active",
          "roles.role_name"
        )
        .leftJoin("emp_roles", "employees.emp_id", "emp_roles.emp_id")
        .leftJoin("roles", "emp_roles.role_id", "roles.role_id")
        .where("employees.is_active", is_active)
        .orderBy(`employees.emp_id`);
    }

    if (role_name !== null && role_name !== undefined) {
      query = await Employees.query()
        .select(
          "employees.emp_id",
          "employees.emp_name",
          "employees.email",
          "employees.image_file",
          "employees.created_at",
          "employees.updated_at",
          "employees.is_active",
          "roles.role_name"
        )
        .leftJoin("emp_roles", "employees.emp_id", "emp_roles.emp_id")
        .leftJoin("roles", "emp_roles.role_id", "roles.role_id")
        .where("roles.role_name", role_name)
        .orderBy(`employees.emp_id`);
    }

    const posts = await query;

    const worksheet = XLSX.utils.json_to_sheet(posts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="TASK_4_employees.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.end(buffer, "binary");
  } catch (error) {
    return catchFailure(res, error);
  }
};

// admin (principal)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const existingEmp = await Employees.query().where({ emp_id: id }).first();
    if (!existingEmp) {
      throw new Error(`Invalid employee ID`);
    }
    await Employees.query().where({ emp_id: id }).update({ is_active: false });
    return response(200, res, { message: `Employee deleted !`, data: {} });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// admin and employee both
exports.uploadImage = async (req, res) => {
  try {
    const emp_id = req.user[0].emp_id;
    const file = req.file;

    const params = {
      Bucket: file.bucket,
      Key: file.key,
    };

    const getObjectCommand = new GetObjectCommand(params);
    await s3.send(getObjectCommand);

    const objectUrl = await getSignedUrl(s3, getObjectCommand);

    const filename = path.basename(params.Key);
    const existingEmp = await Employees.query()
      .where({ emp_id: emp_id })
      .first();
    if (!existingEmp) {
      throw new Error(`Invalid employee ID`);
    }

    await Employees.query().where({ emp_id: emp_id }).patch({
      image_file: filename,
    });

    return response(200, res, {
      message: `Image added!`,
      data: { image: filename, imageURL: objectUrl },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// admin and employee both
exports.logout = async (req, res) => {
  try {
    const emp_id = req.user[0].emp_id;
    return response(200, res, { message: `Logout successful!`, data: {} });
  } catch (error) {
    return catchFailure(res, error);
  }
};
