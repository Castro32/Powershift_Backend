import { Router } from 'express';
import { validatePromo, trackPromo } from '../controllers/promoController.js';

const router = Router();

router.post('/validate-promo', validatePromo);
router.post('/track-promo', trackPromo);

export default router;
