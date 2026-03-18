require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectToDb } = require('./services/admin');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

app.use(cors());
app.use(express.json());

let isDatabaseConnected = false;

app.get('/health', (req, res) => {
	const statusCode = isDatabaseConnected ? 200 : 503;
	res.status(statusCode).json({
		status: 'ok',
		database: isDatabaseConnected ? 'connected' : 'disconnected'
	});
});

async function startServer() {
	try {
		await connectToDb();
		isDatabaseConnected = true;
	} catch (error) {
		isDatabaseConnected = false;
		console.error('Failed to start server: database connection is required.');
		process.exit(1);
	}

	app.listen(PORT, () => {
		console.log(`Backend server running on port ${PORT}`);
	});
}

const authRoutes = require("./Auth");
app.use("/auth", authRoutes);