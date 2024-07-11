/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("employees", (table) => {
    table.increments("emp_id").notNullable().primary();
    table.string("emp_name", 255).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("image_file", 255);
    table.timestamps(false, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable("employees");
};
