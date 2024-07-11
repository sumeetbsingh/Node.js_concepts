// students data is fetched via excel from AWS
// principal assigns under_teacher for students
// add, update, view(pagination), delete students by admin
// only view(pagination) students by teacher

require("dotenv").config({ path: "./../../.env" });
require("../database/db");
const { S3, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const xlsx = require("xlsx");
const Students = require("../models/studentsModel");
const EmpRoles = require("../models/emp_rolesModel");
const { response, catchFailure } = require("../utils/logger");

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const validateEmail = (s_email) => {
  const regEx = /^[a-z0-9./]+@([a-z]+\.){1,2}[a-z]{2,}$/;
  return regEx.test(s_email);
};

exports.excelToStudentsDB = async (req, res) => {
  try {
    const files = req.files;
    let objectUrl = null;
    const jsondata = [];
    const messages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const params = {
        Bucket: file.bucket,
        Key: file.key,
      };

      const getObjectCommand = new GetObjectCommand(params);
      const s3File = await s3.send(getObjectCommand);
      const chunks = [];
      for await (let chunk of s3File.Body) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      jsondata.push(...sheet);

      objectUrl = await getSignedUrl(s3, getObjectCommand);
      messages.push(`URL for object ${i}: ${objectUrl}`);
    }

    for (let entry of jsondata) {
      const checkEntry = await Students.query()
        .where({ s_email: entry.s_email })
        .first();
      if (!checkEntry) {
        const validEmail = validateEmail(entry.s_email);
        if (!validEmail) {
          messages.push(
            `Insertion failed: Invalid email of student with email ${entry.s_email} !`
          );
          continue;
        }

        await Students.query()
          .insert({
            s_name: entry.s_name,
            s_email: entry.s_email,
          })
          .onConflict("s_id")
          .merge({ s_name: entry.s_name, s_email: entry.s_email })
          .returning(["s_id", "s_name", "s_email"]);
        messages.push(`Success: Added student with email ${entry.s_email} !`);
      } else if (checkEntry) {
        messages.push(
          `Insertion failed: Already exists student with email ${entry.s_email} !`
        );
        continue;
      }
    }
    return response(201, res, {
      message: `Insertion in students table`,
      data: { messages: messages },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employee (admin)
exports.addStudent = async (req, res) => {
  try {
    const { s_name, s_email } = req.body;
    const existingStudent = await Students.query()
      .where({ s_email: s_email })
      .first();
    if (existingStudent) {
      throw new Error(`Already exists student with email ${s_email} !`);
    }

    const validEmail = validateEmail(s_email);
    if (!validEmail) {
      throw new Error(`Email ${s_email} not valid !`);
    }

    const insertStudent = {
      s_name: s_name,
      s_email: s_email,
    };
    const insertedStudent = await Students.query()
      .insert(insertStudent)
      .returning(["s_id", "s_name", "s_email"]);

    return response(201, res, {
      message: `Student inserted !`,
      data: { added: insertedStudent },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employee (admin)
exports.updateStudent = async (req, res) => {
  try {
    const { s_id } = req.params;
    const { s_name, s_email } = req.body;
    const messages = [];

    const existingStudent = await Students.query()
      .where({ s_id: s_id })
      .first();
    if (!existingStudent) {
      throw new Error(`Invalid student ID`);
    }

    if (existingStudent.s_email === s_email) {
      messages.push(`Email unchanged.`);
    } else {
      const validEmail = validateEmail(s_email);
      if (!validEmail) {
        throw new Error(`Email ${s_email} not valid !`);
      }
    }
    if (existingStudent.s_name === s_name) {
      messages.push(`Name unchanged.`);
    }
    const updateStudent = {
      s_name: s_name,
      s_email: s_email,
    };
    await Students.query().where({ s_id: s_id }).update(updateStudent);
    return response(201, res, {
      message: `Student with ${s_id} updated !`,
      data: { messages: messages },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employees (admin)
exports.getStudentByID = async (req, res) => {
  try {
    const { s_id } = req.params;
    const existingStudent = await Students.query()
      .where({ s_id: s_id })
      .first();
    if (!existingStudent) {
      throw new Error(`Invalid student ID`);
    }
    return response(200, res, {
      message: `Data of student with ID ${s_id} found!`,
      data: { data: existingStudent },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employee (teacher)
exports.getStudentByIdByTeacher = async (req, res) => {
  try {
    const { s_id } = req.params;
    const under_teacher = req.user[0].emp_id;
    const existingStudent = await Students.query()
      .select("students.s_id", "students.s_name", "students.s_email")
      .where({ s_id: s_id, under_teacher: under_teacher, is_active: true })
      .first();
    if (!existingStudent) {
      throw new Error(`Invalid student ID`);
    }
    return response(200, res, {
      message: `Data of student with ID ${s_id} found!`,
      data: { data: existingStudent },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employee (teacher)
exports.getStudentsByTeacher = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;
    const under_teacher = req.user[0].emp_id;
    const existingStudent = await Students.query()
      .select("students.s_id", "students.s_name", "students.s_email")
      .where({ under_teacher: under_teacher, is_active: true })
      .offset(offset)
      .limit(limit)
      .orderBy("students.s_id");

    const totalStudents = existingStudent.length;
    if (!existingStudent) {
      throw new Error(`There are no students under you.`);
    }

    return response(200, res, {
      message: `Students under you found !`,
      data: {
        totalStudents: existingStudent,
        numberOfStudents: totalStudents,
      },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employees (admin)
exports.getAllStudentsByAdmin = async (req, res) => {
  try {
    // perform pagination here
    const page = req.query.page || 1;
    const limit = req.query.limit || 8;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    const under_teacher =
      req.body.under_teacher === "" ? undefined : req.body.under_teacher;
    if (under_teacher === null) {
      under_teacher = undefined;
    }
    let totalData = await Students.query().count();
    totalData = totalData[0].count;
    let posts = [];
    let totalFiltered = 0;

    let query = await Students.query()
      .select(
        "students.s_id",
        "students.s_name",
        "students.s_email",
        "students.is_active",
        "employees.emp_name"
      )
      .leftJoin("employees", "students.under_teacher", "employees.emp_id")
      .offset(offset)
      .limit(limit)
      .orderBy(`students.s_id`);

    if (under_teacher !== null && under_teacher !== undefined) {
      query = await Students.query()
        .select(
          "students.s_id",
          "students.s_name",
          "students.s_email",
          "students.is_active",
          "employees.emp_name"
        )
        .leftJoin("employees", "students.under_teacher", "employees.emp_id")
        .where({ under_teacher: under_teacher })
        .offset(offset)
        .limit(limit)
        .orderBy(`students.s_id`);
    }

    posts = await query;
    totalFiltered = posts.length;

    let totalPages;

    if (under_teacher !== undefined) {
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
        // file: buffer,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employees (admin and teacher)
exports.exportToExcel = async (req, res) => {
  try {
    const emp_id = req.user[0].emp_id;
    const role_id = req.user[0].role_id;
    const under_teacher =
      req.body.under_teacher === "" ? undefined : req.body.under_teacher;
    const is_active =
      req.body.is_active === "" ? undefined : req.body.is_active;
    let query;
    if (role_id === 2) {
      if (under_teacher === null) {
        under_teacher = undefined;
      }

      query = await Students.query()
        .select(
          "students.s_id",
          "students.s_name",
          "students.s_email",
          "students.is_active",
          "employees.emp_name"
        )
        .leftJoin("employees", "students.under_teacher", "employees.emp_id")
        .orderBy(`students.s_id`);

      if (under_teacher !== null && under_teacher !== undefined) {
        query = await Students.query()
          .select(
            "students.s_id",
            "students.s_name",
            "students.s_email",
            "students.is_active",
            "employees.emp_name"
          )
          .leftJoin("employees", "students.under_teacher", "employees.emp_id")
          .where("students.under_teacher", under_teacher)
          .orderBy(`students.s_id`);
      }
    } else if (role_id === 3) {
      if (is_active === null) {
        is_active = undefined;
      }

      query = await Students.query()
        .select("students.s_id", "students.s_name", "students.s_email")
        .where(`students.under_teacher`, emp_id)
        .orderBy(`students.s_id`);

      if (is_active !== null && is_active !== undefined) {
        query = await Students.query()
          .select("students.s_id", "students.s_name", "students.s_email")
          .where({ under_teacher: emp_id, is_active: is_active })
          .orderBy(`students.s_id`);
      }
    } else {
      throw new Error(`Access Denied!`);
    }

    const posts = await query;

    // Generate worksheet from data
    const worksheet = xlsx.utils.json_to_sheet(posts);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Students");

    // Create buffer from workbook
    const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    // Set response headers
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="TASK_4_students.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Send buffer as response
    res.end(buffer, "binary");
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employee (admin)
exports.assignTeacher = async (req, res) => {
  try {
    const { s_id } = req.params;
    const emp_id = req.body.emp_id;
    const existingStudent = await Students.query()
      .where({ s_id: s_id })
      .first();
    if (!existingStudent) {
      throw new Error(`Invalid student ID`);
    }
    const validTeacher = await EmpRoles.query()
      .select(`emp_roles.role_id`)
      .where({ emp_id: emp_id });
    if (validTeacher[0].role_id !== 3) {
      throw new Error(
        `Employee with employee ID ${emp_id} is not a teacher, only teacher can be assigned students`
      );
    }
    const assignTeacher = {
      under_teacher: emp_id,
    };
    await Students.query().where({ s_id: s_id }).patch(assignTeacher);
    return response(200, res, {
      message: `Teacher assinged to student ID ${s_id}`,
      data: {},
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employee (admin)
exports.deleteStudent = async (req, res) => {
  try {
    const { s_id } = req.params;
    const existingStudent = await Students.query()
      .where({ s_id: s_id })
      .first();
    if (!existingStudent) {
      throw new Error(`Invalid student ID`);
    }
    await Students.query().where({ s_id: s_id }).update({ is_active: false });
    return response(200, res, {
      message: `Student with id ${s_id} deleted !`,
      data: {},
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};
