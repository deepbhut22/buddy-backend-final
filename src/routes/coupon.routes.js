import express from 'express';
import { getAllCoupons, redeemCoupon, getFeaturedCoupons, getRecommendedCoupons } from '../controllers/coupon.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.get('/', getAllCoupons);
router.get('/featured', getFeaturedCoupons);
router.get('/recommended', getRecommendedCoupons);
router.get('/:couponId/redeem', redeemCoupon);

export default router;