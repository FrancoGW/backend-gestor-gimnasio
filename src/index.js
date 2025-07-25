require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');
const logger = require('./utils/logger');
const config = require('./config');

// Importar rutas
const authRoutes = require('./routes/auth');
const gymRoutes = require('./routes/gym');
const studentRoutes = require('./routes/student');
const membershipPlanRoutes = require('./routes/membershipPlan');
const checkInRoutes = require('./routes/checkIn');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(rateLimiter);

// Swagger Documentation
// setupSwagger(app);

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Ruta de health check
app.get('/', (req, res) => {
  res.send('api funcionando correctamente');
});

// Ruta adicional para verificar el estado de la API
app.get('/api', (req, res) => {
  res.send('API funcionando correctamente');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/membership-plans', membershipPlanRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handler
app.use(errorHandler);

// MongoDB Connection
mongoose.connect(config.mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false
})
.then(() => {
  logger.info('Connected to MongoDB');
  
  // Start Server
  const PORT = config.port || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
})
.catch((error) => {
  logger.error('MongoDB connection error:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

module.exports = app; 