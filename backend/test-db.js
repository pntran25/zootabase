const { connectToDb } = require('./services/admin');

async function test() {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`SELECT * FROM Customer WHERE Email = 'jawadhasanhemani@gmail.com'`);
        console.dir(result.recordset, { depth: null });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
test();
