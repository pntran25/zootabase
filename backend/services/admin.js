// Azure SQL Database connection setup
const sql = require('mssql');
require('dotenv').config();

const config = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	server: process.env.DB_SERVER,
	database: process.env.DB_DATABASE,
	port: parseInt(process.env.DB_PORT) || 1433,
	options: {
		encrypt: true, // Required for Azure SQL
		trustServerCertificate: false
	}
};

async function connectToDb() {
	try {
		const pool = await sql.connect(config);
		console.log('Connected to Azure SQL Database');
		return pool;
	} catch (err) {
		console.error('Database connection error:', err);
		throw err;
	}
}

module.exports = { connectToDb };
