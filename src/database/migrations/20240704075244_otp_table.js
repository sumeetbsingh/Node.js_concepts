/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('otp', (table) => {
    table.increments('otp_id').notNullable().primary();
    table.string('email', 255).notNullable().unique();
    table.string('otp', 255).notNullable().unique();
    table.timestamp('generated_at').notNullable();
    table.timestamp('expires_at').notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable('otp');
};
