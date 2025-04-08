import User from '../models/user.model.js';
import UserRequest from '../models/userRequest.model.js';
import Coupon from '../models/coupon.model.js';
import Discount from '../models/discount.model.js';

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await UserRequest.find({ status: 'pending' }).sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getApprovedRequests = async (req, res) => {
  try {
    const requests = await UserRequest.find({ status: 'approved' }).sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRejectedRequests = async (req, res) => {
  try {
    const requests = await UserRequest.find({ status: 'rejected' }).sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ approvalDate: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserRequestsByFilter = async (req, res) => {
  try {
    const { status, search } = req.query;
    if (status === 'pending') {
      const requests = await UserRequest.find({ status: 'pending' }).sort({ requestedAt: -1 });      
      return res.json(requests);
    } else if (status === 'approved') {    
      const users = await User.find().sort({ approvalDate: -1 });
      return res.json(users);
    } else if (status === 'rejected') {
      const requests = await UserRequest.find({ status: 'rejected' }).sort({ requestedAt: -1 });
      return res.json(requests);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export const approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const userRequest = await UserRequest.findById(requestId);
    if (!userRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const user = await User.create({
      firstName: userRequest.firstName,
      lastName: userRequest.lastName,
      email: userRequest.email,
      password: userRequest.password,
      phoneNumber: userRequest.phoneNumber,
      service: userRequest.service,
      category: userRequest.category,
      documents: userRequest.document,
      buddyId: `BD${Date.now()}`,
      approvalDate: new Date()
    });

    userRequest.status = 'approved';
    await userRequest.save();

    res.json({ message: 'User request approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    
    const userRequest = await UserRequest.findById(requestId);
    if (!userRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    userRequest.status = 'rejected';
    userRequest.rejectionReason = rejectionReason;
    await userRequest.save();

    res.json({ message: 'User request rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { banReason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'banned';
    user.isBanned = true;
    user.banReason = banReason;
    await user.save();

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'active';
    user.isBanned = false;
    user.banReason = null;
    await user.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Coupon Management
export const addCoupon = async (req, res) => {
  try {
    const couponData = req.body;
    const coupon = await Coupon.create(couponData);
    res.status(201).json({ message: 'Coupon added successfully', coupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllCouponsAdmin = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ startDate: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export const getActiveCouponsAdmin = async (req, res) => {
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
    // const coupons = await Coupon.find(query).sort({ startDate: -1 });
    if (coupons.length === 0) {
      return res.json({ message: 'No available coupons found', coupons: [] });
    }    
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Discount Management
export const addDiscount = async (req, res) => {
  try {
    const discountData = req.body;
    const discount = await Discount.create(discountData);
    res.status(201).json({ message: 'Discount added successfully', discount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllDiscountsAdmin = async (req, res) => {
  try {
    const discounts = await Discount.find().sort({ startDate: -1 });
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateDiscount = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updatedCouponData = req.body;
    const updatedCoupon = await Discount.findByIdAndUpdate(discountId, updatedCouponData, { new: true });
    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ message: 'Coupon updated successfully', coupon: updatedCoupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updatedCouponData = req.body;
    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updatedCouponData, { new: true });
    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }    
    res.json({ message: 'Coupon updated successfully', coupon: updatedCoupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};