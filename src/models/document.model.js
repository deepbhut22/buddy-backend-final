import mongoose from "mongoose";

const singleDocumentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    }
});

const documentSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    documents: [singleDocumentSchema]
});

export default mongoose.model('Document', documentSchema);