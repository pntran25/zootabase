require('dotenv').config();
const { connectToDb } = require('./services/admin');

async function check() {
  const pool = await connectToDb();
  const res = await pool.request().query(`
    SELECT t.NAME AS TableName, p.rows AS RowCounts
    FROM sys.tables t
    INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
    INNER JOIN sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
    WHERE t.is_ms_shipped = 0 AND i.type_desc != 'NONCLUSTERED'
    GROUP BY t.NAME, p.Rows
    ORDER BY p.Rows DESC, t.NAME;
  `);
  console.table(res.recordset);
  process.exit(0);
}

check().catch(console.error);
