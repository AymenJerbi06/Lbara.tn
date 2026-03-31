const pool = require('../config/db');

async function log({ entityType, entityId, action, actorId = null, actorType = 'system', metadata = {} }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, actor_id, actor_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entityType, entityId, action, actorId, actorType, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('[Audit log error]', err.message);
  }
}

module.exports = { log };
