import express from 'express';
import { getAllDiscounts, redeemDiscount, getFeaturedDiscounts, getRecommendedDiscounts } from '../controllers/discount.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.get('/', getAllDiscounts);
router.get('/featured', getFeaturedDiscounts);
router.get('/recommended', getRecommendedDiscounts);
router.get('/:discountId/redeem', redeemDiscount);

export default router;