import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';


dotenv.config();


// Route imports
import authRoutes from './routes/auth.routes.js';
import discountRoutes from './routes/discount.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();


// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Replace with your frontend URL
    credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});