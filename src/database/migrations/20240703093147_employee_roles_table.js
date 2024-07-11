/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('emp_roles', (table) => {
    table.increments('id').notNullable().primary();
    table.integer('emp_id').unsigned().references('emp_id').inTable('employees').onDelete('CASCADE');
    table.integer('role_id').unsigned().references('role_id').inTable('roles').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable('emp_roles');
};
