/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("roles", (table) => {
    table.increments("role_id").notNullable().primary();
    table.string("role_name", 255).notNullable().unique();
    table.timestamps(false, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable("roles");
};
