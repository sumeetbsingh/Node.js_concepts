/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('chemicals', (table) => {
    table.increments('c_id').notNullable().primary();
    table.string('chem_name', 255).notNullable().unique();
    table.string('severity', 255).notNullable();
    table.date('expiring_on');
    table.string('quantity').notNullable();
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable('chemicals');
};
