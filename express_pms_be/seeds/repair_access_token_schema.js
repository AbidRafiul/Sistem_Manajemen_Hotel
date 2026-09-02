export async function seed(knex) {
  console.log('Seed: repair_access_token_schema starting');

  try {
    // 1. Repair access_token schema
    const hasAccessToken = await knex.schema.hasTable('access_token');
    if (hasAccessToken) {
      const raw = await knex.raw('SHOW COLUMNS FROM access_token');
      const rows = Array.isArray(raw) ? (Array.isArray(raw[0]) ? raw[0] : raw) : raw;

      const idCol = rows.find(r => r.Field === 'id');
      if (idCol) {
        const isAuto = idCol.Extra.toLowerCase().includes('auto_increment');
        if (!isAuto) {
          console.log('access_token.id is not AUTO_INCREMENT. Repairing...');
          
          // Check if there is an id = 0 row
          const zeroRow = await knex('access_token').where('id', 0).first();
          if (zeroRow) {
            const maxResult = await knex('access_token').max('id as maxId').first();
            const newId = (maxResult.maxId || 0) + 1;
            console.log(`Updating access_token id = 0 to id = ${newId}`);
            await knex('access_token').where('id', 0).update({ id: newId });
          }

          // Modify column to AUTO_INCREMENT
          await knex.raw('ALTER TABLE access_token MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT');
          console.log('Successfully set access_token.id to AUTO_INCREMENT');
        }
      }
    }

    // 2. Repair log schema
    const hasLog = await knex.schema.hasTable('log');
    if (hasLog) {
      const raw = await knex.raw('SHOW COLUMNS FROM log');
      const rows = Array.isArray(raw) ? (Array.isArray(raw[0]) ? raw[0] : raw) : raw;

      const idCol = rows.find(r => r.Field === 'id');
      if (idCol) {
        const isAuto = idCol.Extra.toLowerCase().includes('auto_increment');
        if (!isAuto) {
          console.log('log.id is not AUTO_INCREMENT. Repairing...');

          // Check if there is an id = 0 row
          const zeroRow = await knex('log').where('id', 0).first();
          if (zeroRow) {
            const maxResult = await knex('log').max('id as maxId').first();
            const newId = (maxResult.maxId || 0) + 1;
            console.log(`Updating log id = 0 to id = ${newId}`);
            await knex('log').where('id', 0).update({ id: newId });
          }

          // Modify column to AUTO_INCREMENT
          await knex.raw('ALTER TABLE log MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT');
          console.log('Successfully set log.id to AUTO_INCREMENT');
        }
      }
    }

  } catch (err) {
    console.error('Error repairing schema:', err);
    throw err;
  }
}
