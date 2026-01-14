const express = require('express');
const path = require('path');
const logger = require('./utils/logger');

const indexRoutes = require('./routes/index.routes');
const healthRoutes = require('./routes/health.routes');
const jobRoutes = require('./routes/job.routes');

const app = express();

app.set('trust proxy', true);

// Configure view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configure body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Mount routes
app.use('/', indexRoutes);
app.use('/health', healthRoutes);
app.use('/job', jobRoutes);

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render('error', { message: 'Page Not Found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, url: req.url });
  res.status(500).render('error', { message: 'Internal Server Error' });
});

module.exports = app;