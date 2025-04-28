import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Admin from '../models/admin.model.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    // console.log(token);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    
    // console.log(user.email);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    // console.log("sending to next");
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authenticateAdmin = async (req, res, next) => {
  try {
    // const token = req.cookies.adminToken;
    
    // if (!token) {
    //   return res.status(401).json({ message: 'Admin authentication required' });
    // }

    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const admin = await Admin.findById(decoded.id).select('-password');
    
    // if (!admin) {
    //   return res.status(401).json({ message: 'Admin not found' });
    // }

    // req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid admin token' });
  }
};