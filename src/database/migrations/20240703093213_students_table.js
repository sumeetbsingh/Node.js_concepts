/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('students', (table) => {
    table.increments('s_id').notNullable().primary();
    table.string('s_name', 255).notNullable();
    table.string('s_email', 255).notNullable().unique();
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable('students');
};
