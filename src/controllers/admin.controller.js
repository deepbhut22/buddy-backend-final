import User from '../models/user.model.js';
import UserRequest from '../models/userRequest.model.js';
import Coupon from '../models/coupon.model.js';
import Discount from '../models/discount.model.js';
import Redemption from '../models/redemption.model.js';
import { sendVerificationUpdateEmail, sendBulkEmails, sendBanNotification, sendUnbanNotification, sendDeletionNotification } from '../utils/emailService.js';
import { exportRedemptionsToExcel } from '../utils/excelExport.js';
import fs from 'fs';
import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../config/s3.js';


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
    const users = await User.find().sort({ approvalDate: -1 });
    res.json(users);
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
    console.log("approveRequest");
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

    await UserRequest.deleteOne({ email: userRequest.email });

    // userRequest.status = 'approved';
    // await userRequest.save();
    // console.log("sending mail");
    
    // Send verification status update email
    await sendVerificationUpdateEmail(
      user.email,
      user.firstName,
      'approved',
      'Your registration has been approved. You can now log in to your account.'
    );

    res.json({ message: 'User request approved successfully', user });
  } catch (error) {
    console.log("error in approveRequest", error);
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

    // Send verification status update email
    await sendVerificationUpdateEmail(
      userRequest.email,
      userRequest.firstName,
      'rejected',
      `Your registration has been rejected. Reason: ${rejectionReason}`
    );

    await UserRequest.deleteOne({ email: userRequest.email });

    res.json({ message: 'User request rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { banReason } = req.body;

    console.log(userId);
    console.log(banReason);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'banned';
    user.isBanned = true;
    user.banReason = banReason;
    await user.save();

    sendBanNotification(user.email, user.firstName, banReason)
      .catch(error => console.error('Failed to send ban notification:', error));

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.log("error in banUser", error);
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

    await sendUnbanNotification(user.email, user.firstName);

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

    await sendDeletionNotification(user.email, user.firstName);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Coupon Management
export const addCoupon = async (req, res) => {
  try {
    const couponData = req.body;

    if (couponData.category) {
      couponData.category = couponData.category.split(',').map(item => item.trim());
    }
    if (couponData.products) {
      couponData.products = couponData.products.split(',').map(item => item.trim());
    }

    const imageUrls = req.files.map(file => file.location);

    couponData.images = imageUrls;
    couponData.name = JSON.parse(couponData.name);

    const coupon = await Coupon.create(couponData);
    // Send notification to all users about new coupon
    // const users = await User.find({ status: 'active' });
    // await sendBulkEmails(users, 'newCoupon', coupon);

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

    if (discountData.category) {
      discountData.category = discountData.category.split(',').map(item => item.trim());
    }
    if (discountData.products) {
      discountData.products = discountData.products.split(',').map(item => item.trim());
    }

    const imageUrls = req.files ? req.files.map(file => file.location) : [];

    discountData.images = imageUrls;

    const discount = await Discount.create(discountData);

    // Send notification to all users about new discount
    // const users = await User.find({ status: 'active' });
    // await sendBulkEmails(users, 'newDiscount', discount);

    res.status(201).json({ message: 'Discount added successfully', discount });
  } catch (error) {
    console.log("error in addDiscount", error);
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
    console.log(req.body);
    
    const { discountId } = req.params;
    const updatedCouponData = req.body;

    if (updatedCouponData.category) {
      updatedCouponData.category = updatedCouponData.category.split(',').map(item => item.trim());
    }
    if (updatedCouponData.products) {
      updatedCouponData.products = updatedCouponData.products.split(',').map(item => item.trim());
    }

    const imageUrls = req.files ? req.files.map(file => file.location) : [];
    updatedCouponData.images = imageUrls;

    const updatedCoupon = await Discount.findByIdAndUpdate(discountId, updatedCouponData, { new: true });
    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ message: 'Coupon updated successfully', coupon: updatedCoupon });
  } catch (error) {
    console.log("error in updateDiscount", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updatedCouponData = req.body;

    if (updatedCouponData.name) {
      updatedCouponData.name = JSON.parse(updatedCouponData.name);
    }
    
    if (updatedCouponData.category) {
      updatedCouponData.category = updatedCouponData.category.split(',').map(item => item.trim());
    }
    if (updatedCouponData.products) {
      updatedCouponData.products = updatedCouponData.products.split(',').map(item => item.trim());
    }

    const imageUrls = req.files ? req.files.map(file => file.location) : [];
    updatedCouponData.images = imageUrls;

    // console.log(updatedCouponData);

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updatedCouponData, { new: true });
    console.log(updatedCoupon);
    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }    
    res.json({ message: 'Coupon updated successfully', coupon: updatedCoupon });
  } catch (error) {
    console.log("error in updateCoupon", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const exportRedemptions = async (req, res) => {
  try {
    const { startDate, endDate, type, company, category } = req.query;
    
    let query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.redeemedAt = {};
      if (startDate) query.redeemedAt.$gte = new Date(startDate);
      if (endDate) query.redeemedAt.$lte = new Date(endDate);
    }
    
    // Type filter (coupon/discount)
    if (type) {
      query.type = type;
    }
    
    // Company filter
    if (company) {
      query.company = company;
    }
    
    // Category filter
    if (category) {
      query.category = { $in: category.split(',') };
    }

    const redemptions = await Redemption.find(query)
      .sort({ redeemedAt: -1 }).select('-redemptionValue -redemptionLocation');

    if (redemptions.length === 0) {
      return res.status(404).json({ message: 'No redemptions found for the given criteria' });
    }

    // Generate filename with date range
    const filename = `redemptions_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Export to Excel
    const filePath = await exportRedemptionsToExcel(redemptions, filename);

    // Send file as download
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ message: 'Error sending file' });
      }
      // Delete the file after sending
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    });
  } catch (error) {
    console.error('Error exporting redemptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};