/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.table('students', (table) => {
    table.integer('under_teacher').unsigned().references('emp_id').inTable('employees').onDelete('SET NULL');
    table.boolean('is_active').defaultTo(true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('students', (table) => {
    table.dropColumn('under_teacher');
    table.dropColumn('is_active');
  });
};
