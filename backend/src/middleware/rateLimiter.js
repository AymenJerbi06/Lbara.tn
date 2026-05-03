const rateLimit = require('express-rate-limit');

function limitHandler(req, res) {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please wait a moment and try again.',
  });
}

function ipAndUserKey(req) {
  return `${req.ip}:${req.user?.id || 'guest'}`;
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyGenerator: ipAndUserKey,
  handler: limitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  keyGenerator: ipAndUserKey,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: ipAndUserKey,
  message: { success: false, message: 'Too many orders placed. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: ipAndUserKey,
  message: { success: false, message: 'Too many contact requests. Please wait before sending another.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  keyGenerator: ipAndUserKey,
  message: { success: false, message: 'Too many verification attempts. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const productLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: ipAndUserKey,
  message: { success: false, message: 'Too many catalog requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
  keyGenerator: ipAndUserKey,
  message: { success: false, message: 'Too many chat messages. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: ipAndUserKey,
  message: { success: false },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, orderLimiter, contactLimiter, verifyLimiter, productLimiter, chatLimiter, webhookLimiter };
