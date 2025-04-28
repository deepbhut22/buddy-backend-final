import Discount from '../models/discount.model.js';
import Coupon from '../models/coupon.model.js';

export const search = async (req, res) => {
  try {
    const { 
      productName, 
      categories, 
      companies, 
      minDiscount, 
      maxDiscount,
      isFeatured,
      isRecommended,
      page = 1,
      limit = 10
    } = req.query;

    // Build search query for discounts
    const discountQuery = {};
    
    // Product name search
    if (productName) {
      discountQuery.products = { $regex: productName, $options: 'i' };
    }
    
    // Category filter
    if (categories) {
      discountQuery.category = { $in: categories.split(',') };
    }
    
    // Company/brand filter
    if (companies) {
      discountQuery.company = { $in: companies.split(',') };
    }
    
    // Discount range filter
    if (minDiscount || maxDiscount) {
      discountQuery.discount = {};
      if (minDiscount) discountQuery.discount.$gte = Number(minDiscount);
      if (maxDiscount) discountQuery.discount.$lte = Number(maxDiscount);
    }

    // Featured/Recommended filter
    if (isFeatured === 'true') {
      discountQuery.isFeatured = true;
    }
    if (isRecommended === 'true') {
      discountQuery.isRecommended = true;
    }

    // Only active discounts with remaining coupons
    discountQuery.endDate = { $gt: new Date() };
    discountQuery.remainingCoupons = { $gt: 0 };

    // Build search query for coupons
    const couponQuery = {};
    
    // Product name search for coupons
    // if (productName) {
    //   couponQuery.products = { $regex: productName, $options: 'i' };
    // }

    if (productName) {
      couponQuery.products = { $regex: productName, $options: 'i' };
    }

    
    // Category filter
    if (categories) {
      couponQuery.category = { $in: categories.split(',') };
    }
    
    // Company/brand filter
    if (companies) {
      couponQuery.company = { $in: companies.split(',') };
    }
    
    // Discount range filter
    if (minDiscount || maxDiscount) {
      couponQuery.discount = {};
      if (minDiscount) couponQuery.discount.$gte = Number(minDiscount);
      if (maxDiscount) couponQuery.discount.$lte = Number(maxDiscount);
    }

    // Featured/Recommended filter
    if (isFeatured === 'true') {
      couponQuery.isFeatured = true;
    }
    if (isRecommended === 'true') {
      couponQuery.isRecommended = true;
    }

    // Only active coupons with unused codes
    couponQuery.endDate = { $gt: new Date() };
    couponQuery.remainingCoupons = { $gt: 0 };

    // Pagination
    const skip = (page - 1) * limit;

    

    // Execute searches in parallel
    const [discounts, coupons] = await Promise.all([
      Discount.find(discountQuery)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit),
      Coupon.find(couponQuery)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    // Get total counts for pagination
    const [totalDiscounts, totalCoupons] = await Promise.all([
      Discount.countDocuments(discountQuery),
      Coupon.countDocuments(couponQuery)
    ]);

    res.json({
      discounts: {
        items: discounts,
        total: totalDiscounts,
        page: Number(page),
        totalPages: Math.ceil(totalDiscounts / limit)
      },
      coupons: {
        items: coupons,
        total: totalCoupons,
        page: Number(page),
        totalPages: Math.ceil(totalCoupons / limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 