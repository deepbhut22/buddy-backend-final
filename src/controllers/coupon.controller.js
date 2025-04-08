import Coupon from '../models/coupon.model.js';

export const getAllCoupons = async (req, res) => {
  try {
    const { category, company, minDiscount, maxDiscount } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = { $in: category.split(',') };
    }
    
    if (company) {
      query.company = company;
    }
    
    if (minDiscount || maxDiscount) {
      query.discount = {};
      if (minDiscount) query.discount.$gte = Number(minDiscount);
      if (maxDiscount) query.discount.$lte = Number(maxDiscount);
    }

    // Only get coupons that are not expired and have unused codes
    const coupons = await Coupon.find(query)
      .where('endDate').gt(new Date())
      .where('name').elemMatch({ isUsed: false })
      .sort({ startDate: -1 });

    if (coupons.length === 0) {
      return res.json({ message: 'No available coupons found', coupons: [] });
    }

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const redeemCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const userId = req.user._id;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Find first unused coupon code
    const unusedCouponIndex = coupon.name.findIndex(code => !code.isUsed);
    if (unusedCouponIndex === -1) {
      return res.status(400).json({ message: 'No available coupon codes' });
    }

    // Mark coupon as used
    coupon.name[unusedCouponIndex].isUsed = true;
    await coupon.save();

    res.json({ 
      message: 'Coupon redeemed successfully',
      couponCode: coupon.name[unusedCouponIndex].name
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};