import express from 'express';
import { register, login, logout } from '../controllers/auth.controller.js';
import upload from '../config/s3.js';

const router = express.Router();

router.post('/register', upload.array('document', 5), register);
router.post('/login', login);
router.post('/logout', logout);

export default router;