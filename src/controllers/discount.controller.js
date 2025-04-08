import Discount from '../models/discount.model.js';

export const getAllDiscounts = async (req, res) => {
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

    // Only get active discounts with remaining coupons
    const discounts = await Discount.find(query)
      .where('endDate').gt(new Date())
      .where('remainingCoupons').gt(0)
      .sort({ startDate: -1 });

    if (discounts.length === 0) {
      return res.json({ message: 'No available discounts found', discounts: [] });
    }

    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const redeemDiscount = async (req, res) => {
  try {
    const { discountId } = req.params;
    const userId = req.user._id;

    const discount = await Discount.findById(discountId);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    if (discount.remainingCoupons <= 0) {
      return res.status(400).json({ message: 'No remaining discount coupons available' });
    }

    // Decrease remaining coupons
    discount.remainingCoupons -= 1;
    await discount.save();

    res.json({ 
      message: 'Discount redeemed successfully',
      discount: {
        name: discount.name,
        discountPercentage: discount.discount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};