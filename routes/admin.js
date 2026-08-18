// import { Router } from 'express';
// import rateLimit from 'express-rate-limit';
// import { adminLogin, getBookings, getPromoReport } from '../controllers/adminController.js';
// import { requireAdmin } from '../middleware/requireAdmin.js';

// const router = Router();

// // 10 attempts per 15 minutes per IP — slows down brute-force guessing
// // against the small, fixed set of admin credentials.
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { error: 'Too many login attempts. Please try again later.' },
// });

// router.post('/admin/login', loginLimiter, adminLogin);
// router.get('/bookings', requireAdmin, getBookings);
// router.get('/track-promo', requireAdmin, getPromoReport);

// export default router;
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminLogin, getBookings, getPromoReport } from '../controllers/adminController.js';
import {
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from '../controllers/promoAdminController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// 10 attempts per 15 minutes per IP — slows down brute-force guessing
// against the small, fixed set of admin credentials.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

router.post('/admin/login', loginLimiter, adminLogin);
router.get('/bookings', requireAdmin, getBookings);
router.get('/track-promo', requireAdmin, getPromoReport);

// Promo code management
router.get('/admin/promo-codes', requireAdmin, listPromoCodes);
router.post('/admin/promo-codes', requireAdmin, createPromoCode);
router.patch('/admin/promo-codes/:id', requireAdmin, updatePromoCode);
router.delete('/admin/promo-codes/:id', requireAdmin, deletePromoCode);

export default router;
