import mongoose from 'mongoose';

const redemptionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['coupon', 'discount'],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buddyId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    category: {
        type: [String],
        required: true
    },
    redeemedAt: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'used', 'expired'],
        default: 'active'
    },
    // Additional fields for analysis
    userCategory: {
        type: String,
        required: true
    },
    userService: {
        type: String,
        required: true
    },
    // redemptionLocation: {
    //     type: String,
    //     default: 'online'
    // },
    // redemptionValue: {
    //     type: Number,
    //     required: true
    // }
});

// Index for better query performance
redemptionSchema.index({ redeemedAt: -1 });
redemptionSchema.index({ userId: 1 });
redemptionSchema.index({ company: 1 });
redemptionSchema.index({ category: 1 });

export default mongoose.model('Redemption', redemptionSchema); 