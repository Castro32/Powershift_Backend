import { Router } from 'express';
import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = Router();

// raw body parser is required here for Stripe signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
