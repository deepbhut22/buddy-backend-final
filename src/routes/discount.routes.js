import express from 'express';
import { getAllDiscounts, redeemDiscount } from '../controllers/discount.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.get('/', getAllDiscounts);
router.post('/:discountId/redeem', redeemDiscount);

export default router;