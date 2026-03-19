require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectToDb } = require('./services/admin');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

app.use(cors());
app.use(express.json());

const exhibitsRouter = require('./routes/exhibits');
const animalsRouter = require('./routes/animals');
const attractionsRouter = require('./routes/attractions');
const eventsRouter = require('./routes/events');
const productsRouter = require('./routes/products');
const ticketsRouter = require('./routes/tickets');
const maintenanceRouter = require('./routes/maintenance');
const feedbackRouter = require('./routes/feedback');
const path = require('path');

app.use('/api/exhibits', exhibitsRouter);
app.use('/api/animals', animalsRouter);
app.use('/', attractionsRouter);
app.use('/', eventsRouter);
app.use('/', productsRouter);
app.use('/', ticketsRouter);
app.use('/', maintenanceRouter);
app.use('/', feedbackRouter);

// Serve images from the frontend assets folder dynamically
app.use('/images', express.static(path.join(__dirname, '../frontend/src/assets/images')));

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

startServer();
