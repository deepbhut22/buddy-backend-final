import express from 'express';
import { 
  getPendingRequests, 
  getApprovedRequests,
  getRejectedRequests,
  getAllUsers,
  approveRequest, 
  rejectRequest,
  banUser,
  unbanUser,
  deleteUser,
  addCoupon,
  getAllCouponsAdmin,
  addDiscount,
  getAllDiscountsAdmin,
  getUserRequestsByFilter,
  updateCoupon,
  updateDiscount,
  exportRedemptions
} from '../controllers/admin.controller.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { uploadImages } from '../config/s3.js';

const router = express.Router();

// router.use(authenticateAdmin);

// Request management routes
router.get('/requests', getUserRequestsByFilter);
router.get('/requests/pending', getPendingRequests);
router.get('/requests/approved', getApprovedRequests);
router.get('/requests/rejected', getRejectedRequests);
router.post('/requests/:requestId/approve', approveRequest);
router.post('/requests/:requestId/reject', rejectRequest);

// User management routes
router.get('/users', getAllUsers);
router.post('/users/:userId/ban', banUser);
router.post('/users/:userId/unban', unbanUser);
router.delete('/users/:userId', deleteUser);

// Coupon management routes
router.post('/coupons', uploadImages.array('images'), addCoupon);
router.get('/coupons', getAllCouponsAdmin);
router.put('/coupons/:couponId', uploadImages.array('images'), updateCoupon);

// Discount management routes
router.post('/discounts', uploadImages.array('images'), addDiscount);
router.get('/discounts', getAllDiscountsAdmin);
router.put('/discounts/:discountId', uploadImages.array('images'), updateDiscount);

// Redemption export route
router.get('/export/redemptions', exportRedemptions);

export default router;