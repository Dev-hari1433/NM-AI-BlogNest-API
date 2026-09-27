const express = require('express');
const cors = require('cors');

// Middleware
const sanitizeMiddleware = require('./middleware/sanitizeMiddleware');
const { globalLimiter } = require('./middleware/rateLimitMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// 1. Security & Parsing Middlewares
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 2. Input Sanitization (XSS & injection stripping)
app.use(sanitizeMiddleware);

// 3. Global Rate Limiter
app.use(globalLimiter);

// 4. Structured HTTP Request Logger
app.use(logger.requestLogger);

// 5. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI BlogNest API is running'
  });
});

// 6. Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);

// 7. 404 Undefined Route Handler
app.use(notFoundHandler);

// 8. Centralized Safe Error Handler
app.use(errorHandler);

module.exports = app;
