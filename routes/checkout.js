import { Router } from 'express';
import { createCheckout, getCheckoutSession } from '../controllers/checkoutController.js';

const router = Router();

router.post('/create-checkout', createCheckout);
router.get('/checkout-session', getCheckoutSession);

export default router;
