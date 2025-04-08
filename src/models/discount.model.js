import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
        // it will be in percentage
    },
    startDate: {
        type: Date,
        required: true,
        // default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
        // default: Date.now,
    },  
    category: {
        type: [String],
        required: true,
    },
    products: {
        type: [String],
        default: null,
    },
    company: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        required: true,
    },
    remainingCoupons: {
        type: Number,
        required: true,
    },
    totalCoupons: {
        type: Number,
        required: true,
    },
});

export default mongoose.model('Discount', discountSchema);