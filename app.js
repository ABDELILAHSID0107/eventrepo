const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const i18nextMiddleware = require('i18next-http-middleware');

const config = require('./config');
const i18next = require('./config/i18n');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Webhook routes need higher priority raw body parser for HMAC verification
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/payment.controller').handleWebhook
);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data Sanitization (Fix for Express 4.19+ getter crash with older packages)
app.use((req, res, next) => {
  ['query', 'params', 'body'].forEach((key) => {
    if (req[key]) {
      const originalValue = req[key];
      Object.defineProperty(req, key, {
        value: originalValue,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  });
  next();
});

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// i18n
app.use(i18nextMiddleware.handle(i18next));

// API Routes
app.use('/api/v1', routes);

// Add health endpoint at root too
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Handle 404 for unknown routes
app.use((req, res, next) => {
  const ApiError = require('./utils/ApiError');
  next(new ApiError(404, `Not found: ${req.originalUrl}`));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
