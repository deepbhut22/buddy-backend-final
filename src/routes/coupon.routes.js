import express from 'express';
import { getAllCoupons, redeemCoupon } from '../controllers/coupon.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.get('/', getAllCoupons);
router.post('/:couponId/redeem', redeemCoupon);

export default router;