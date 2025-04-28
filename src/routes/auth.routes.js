import express from 'express';
import { register, login, logout, getBasicUserInfo } from '../controllers/auth.controller.js';
import upload from '../config/s3.js';
import { authenticateUser } from '../middleware/auth.js';
const router = express.Router();

router.post('/register', upload.array('document', 5), register);
router.post('/login', login);
router.post('/logout', logout);


router.get('/basic-user-info', authenticateUser, getBasicUserInfo);

export default router;