// principal adds/ updates/ deletes/ roles
// prinipal gets to assign role in employee_roles table - done in employeeController.js ✔

require("../database/db");
const Roles = require("../models/rolesModel");
const { response, catchFailure } = require("../utils/logger");

exports.createRole = async (req, res) => {
  try {
    const { role_name } = req.body;
    const existingRole = await Roles.query()
      .where({ role_name: role_name })
      .first();
    if (existingRole) {
      throw new Error(`This role already exists!`);
    }
    const newRole = await Roles.query()
      .insert({ role_name: role_name })
      .returning(["role_id", "role_name"]);
    return response(200, res, {
      message: `Role ${role_name} created!`,
      data: newRole,
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const role = await Roles.query();
    return response(200, res, { message: `Success!`, data: role });
  } catch (error) {
    return catchFailure(res, error);
  }
};

exports.getRoleById = async (req, res) => {
  const { role_id } = req.params;
  try {
    const role = await Roles.query()
      .where({ role_id: role_id })
      .returning(["role_id"]);
    if (role) {
      return response(200, res, {
        message: `Role with role id ${role_id} found.`,
        data: role,
      });
    }
  } catch (error) {
    return catchFailure(res, error);
  }
};

exports.updateRole = async (req, res) => {
  const { role_id } = req.params;
  const { role_name } = req.body;
  try {
    const existingRole = await Roles.query()
      .where({ role_id: role_id })
      .first();
    if (existingRole.role_name === role_name) {
      throw new Error(`No changes found!`);
    }
    if (!existingRole) {
      throw new Error(`Role with role id ${id} does not exists!`);
    }
    const updateRole = { role_name: role_name };
    await Roles.query().where({ role_id: role_id }).patch(updateRole);
    return response(200, res, { message: `Role updated!`, data: updateRole });
  } catch (error) {
    return catchFailure(res, error);
  }
};

exports.deleteRole = async (req, res) => {
  const { role_id } = req.params;
  try {
    const existingRole = await Roles.query()
      .where({ role_id: role_id })
      .first();
    if (!existingRole) {
      throw new Error(`Role does not exist!`);
    }
    await Roles.query().where({ role_id: role_id }).delete();
    return response(200, res, {
      message: `Role with role id ${role_id} deleted!`,
      data: null,
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};
