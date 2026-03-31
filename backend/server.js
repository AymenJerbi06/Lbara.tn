require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const orderRoutes = require('./src/routes/orders');
const paymentRoutes = require('./src/routes/payments');
const contactRoutes = require('./src/routes/contact');
const adminRoutes = require('./src/routes/admin');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Trust Railway/Render reverse proxy so req.ip and secure cookies work correctly
app.set('trust proxy', 1);

// ─── Security ────────────────────────────────────────────
app.use(helmet({
  // CSP is only enforced in production.
  // In dev we use Tailwind CDN which requires workers/blob — too restrictive to lock down.
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "blob:"],
      workerSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdn.tailwindcss.com"],
    },
  } : false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3007',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Request Logger ───────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
      console.log(`[${level}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    });
  }
  next();
});

// ─── Serve Frontend Static Files (no-cache on HTML so browsers always get fresh pages)
app.use(express.static(path.join(__dirname, 'frontend'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  },
}));

// ─── Health Check ────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// ─── Catch-all: serve frontend for any non-API route ─────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
  }
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} —`, err.message);
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Internal server error' : err.message,
  });
});

const PORT = process.env.PORT || 3007;

async function start() {
  if (process.env.RUN_SETUP === 'true') {
    console.log('[INFO] RUN_SETUP detected — running DB migration...');
    const { execSync } = require('child_process');
    try {
      execSync('node db/setup.js', { stdio: 'inherit', cwd: __dirname });
      console.log('[INFO] DB migration complete.');
    } catch (e) {
      console.error('[ERROR] DB migration failed:', e.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`[INFO] Lbara.tn running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start();
