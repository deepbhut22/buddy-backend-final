import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        // required: true
    },
    lastName: {
        type: String,
        // required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: Number, 
        required: true,
    },
    buddyId: {
        type: String,
        unique: true,
    },
    buddyCredit: {
        type: Number,
        max: 5,
        min: 0,
        default: 5,
    },
    approvalDate: {
        type: Date,
        default: Date.now
    },
    service: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    documents: {
        name: { type: String, required: true },
        url: { type: String, required: true },
    },
    status: {
        type: String,
        enum: ['active', 'banned'],
        default: 'active'
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    banReason: {
        type: String,
        default: null
    }
});

export default mongoose.model("User", userSchema);