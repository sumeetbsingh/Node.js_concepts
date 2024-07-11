// lab_incharge looks after the chemicals: adds/ gets/ updates/ deletes

require("dotenv").config({ path: "./../../.env" });
require("../database/db");
const Chemicals = require("../models/chemicalsModel");
const { response, catchFailure } = require("../utils/logger");

// employee (labIncharge)
exports.addChemical = async (req, res) => {
  try {
    const { chem_name, severity, expiring_on, quantity } = req.body;
    const existingChem = await Chemicals.query()
      .where({ chem_name: chem_name })
      .first();
    if (existingChem) {
      throw new Error(`Already exists Chemical with name ${chem_name} !`);
    }

    const insertChemical = {
      chem_name: chem_name,
      severity: severity,
      expiring_on: expiring_on,
      quantity: quantity,
    };
    const insertedChemical = await Chemicals.query()
      .insert(insertChemical)
      .returning(["c_id", "chem_name", "severity", "expiring_on", "quantity"]);

    return response(201, res, {
      message: `New chemical added in the laboratory !`,
      data: { added: insertedChemical },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employee (labIncharge)
exports.updateChemical = async (req, res) => {
  try {
    const { c_id } = req.params;
    const { chem_name, severity, expiring_on, quantity } = req.body;
    const messages = [];

    const existingChem = await Chemicals.query().where({ c_id: c_id }).first();
    if (!existingChem) {
      throw new Error(`Invalid Chemical ID`);
    }

    if (existingChem.chem_name === chem_name) {
      messages.push(`Chemical name unchanged.`);
    }
    if (existingChem.severity === severity) {
      messages.push(`Chemical severity unchanged.`);
    }
    if (existingChem.expiring_on === expiring_on) {
      messages.push(`Chemical expiry unchanged.`);
    }
    if (existingChem.quantity === quantity) {
      messages.push(`Chemical quantity unchanged.`);
    }
    const updateChemical = {
      chem_name: chem_name,
      severity: severity,
      expiring_on: expiring_on,
      quantity: quantity,
    };
    await Chemicals.query().where({ c_id: c_id }).update(updateChemical);
    return response(201, res, {
      message: `Chemical with id ${c_id} updated !`,
      data: { messages: messages },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employees (labIncharge)
exports.getChemicalByID = async (req, res) => {
  try {
    const { c_id } = req.params;
    const existingChem = await Chemicals.query().where({ c_id: c_id }).first();
    if (!existingChem) {
      throw new Error(`Invalid Chemical ID`);
    }
    return response(200, res, {
      message: `Data of Chemical having id ${c_id} found!`,
      data: { data: existingChem },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employees (labIncharge)
exports.getAllChemicals = async (req, res) => {
  // perform pagination here
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;
    const existingChem = await Chemicals.query()
      .offset(offset)
      .limit(limit)
      .orderBy("chemicals.c_id");

    const totalChemicals = existingChem.length;
    if (!existingChem) {
      throw new Error(`There are no chemicals in laboratory.`);
    }

    return response(200, res, {
      message: `Chemicals found !`,
      data: {
        totalChemicals: existingChem,
        numberOfChemicals: totalChemicals,
      },
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};

// employee (labIncharge)
exports.deleteChemical = async (req, res) => {
  try {
    const { c_id } = req.params;
    const existingChem = await Chemicals.query().where({ c_id: c_id }).first();
    if (!existingChem) {
      throw new Error(`Invalid Chemical ID`);
    }
    await Chemicals.query().where({ c_id: c_id }).delete();
    return response(200, res, {
      message: `Chemical with id ${c_id} deleted !`,
      data: {},
    });
  } catch (error) {
    return catchFailure(res, error);
  }
};
