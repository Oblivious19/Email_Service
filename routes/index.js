import express from 'express';
import emailController from '../controllers/emailcontroller.js';
import { upload } from '../services/Emailservice.js';

const router = express.Router();

router.post('/submit', upload.array('attachments'), emailController.sendEmailController);

export default router;
