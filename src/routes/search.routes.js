import express from 'express';
import { search } from '../controllers/search.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// router.use(authenticateUser);
router.get('/', search);

export default router; 