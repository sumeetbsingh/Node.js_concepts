/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('roles').del()
  await knex('roles').insert([
    {role_id: 1, role_name: 'Principal'},
    {role_id: 2, role_name: 'Admin'},
    {role_id: 3, role_name: 'Teacher'},
    {role_id: 4, role_name: 'Lab Incharge'},
    {role_id: 5, role_name: 'Student'}
  ]);
};
