const express = require('express');
const { submitFeedback, getFeedbacks, sendWhatsAppReply, getWhatsAppStatus } = require('../../controllers/Customer/feedbackController');

const router = express.Router();

// Route to submit feedback
router.post('/', submitFeedback);

// Route to get all feedback (admin)
router.get('/', getFeedbacks);

// Route to send WhatsApp reply to customer
router.post('/:feedbackId/whatsapp-reply', sendWhatsAppReply);

// Route to get WhatsApp service status (admin)
router.get('/whatsapp/status', getWhatsAppStatus);

module.exports = router;
