import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import UserRequest from '../models/userRequest.model.js';
import { sendRegistrationEmail } from '../utils/emailService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      service,
      category,
      documentName
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload required documents' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const documentUrls = req.files.map(file => ({
      name: documentName,
      url: file.location
    }));

    const userRequest = new UserRequest({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber: phone,
      service,
      category,
      status: 'pending',
      document: documentUrls[0] // Storing first document in user request
    });

    await userRequest.save();

    // Send registration confirmation email
    await sendRegistrationEmail(email, firstName);

    res.status(201).json({
      message: 'Registration request submitted successfully',
      requestId: userRequest._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// export const register = async (req, res) => {
//   try {
//       console.log(req.body);

//       console.log("okyy!");

//       const { firstName, lastName, email, password, phone, service, category, documentName } = req.body;
//       if (!firstName || !lastName) {
//         return res.status(400).json({ message: "First Name and Last Name are required" });
//       }
//       if (!email || !password) {
//         return res.status(400).json({ message: "Email and Password are required" });      
//       }
//       if (!phone) {
//         return res.status(400).json({ message: "Phone Number is required" });      
//       }
//       if (!service || !category) {
//         return res.status(400).json({ message: "Service and Category is required" });      
//       }

//       // Check if email is already registered
//       const existingUser = await UserRequest.findOne({ email });
//       if (existingUser) {
//         return res.status(400).json({ message: "Email is already registered" });
//       }

//       // const documentUrl = saveFileToLocalStorage(req.file, "documents");

//       const documentUrl = req.files.map(file => ({
//         name: documentName,
//         url: file.location
//       }));

//       const hashedPass = await bcrypt.hash(password, 12);

//       const newUser = new UserRequest({
//       firstName,
//       lastName,
//       email,
//       password: hashedPass,
//       phoneNumber: phone,
//       document: {name: documentName || "this is default document name", url: documentUrl}, // Save document URL
//       service,
//       status: "pending",
//       category,
//     });

//     await newUser.save();


//     } catch (error) {
//       console.error("Error during registration:", error);
//       res.status(500).json({ message: "Server error", error: error.message, redirect: '/login' });
//     }
// };

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    const isPasswordValid = await bcrypt.compare(password, user.password);


    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      // sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
};

export const getBasicUserInfo = async (req, res) => {
  try {
    // const user = await User.findById(req.user._id).select('firstName lastName email buddyId buddyCredit isBanned');
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};