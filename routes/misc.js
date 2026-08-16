import { Router } from 'express';
import { downloadEbook } from '../controllers/ebookController.js';
import { subscribe, validateFireStrategyCoupon } from '../controllers/miscController.js';

const router = Router();

router.post('/subscribe', subscribe);
router.post('/validate-fire-strategy-coupon', validateFireStrategyCoupon);
router.get('/ebook-download', downloadEbook);

export default router;
