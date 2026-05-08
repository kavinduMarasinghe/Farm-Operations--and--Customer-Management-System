const Feedback = require('../../models/Customer/Feedback');
const whatsappService = require('../../services/whatsappService');

// Controller to submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { name, email, phone, subject, description, rating, category } = req.body;

    // Create a new feedback entry
    const newFeedback = new Feedback({
      name,
      email,
      phone,
      subject,
      description,
      rating,
      category,
    });

    // Save the feedback to the database
    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting feedback' });
  }
};

// Controller to get all feedbacks (for admin)
const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching feedbacks' });
  }
};

// Controller to send WhatsApp reply to customer feedback
const sendWhatsAppReply = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { replyMessage, sendMethod = 'direct' } = req.body; // sendMethod can be 'direct' or 'url'

    // Find the feedback to get customer phone number
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (!feedback.phone) {
      return res.status(400).json({ message: 'Customer phone number not available' });
    }

    if (sendMethod === 'direct' && whatsappService.isConfigured()) {
      // Send message directly via Twilio WhatsApp API
      try {
        const messageResult = await whatsappService.sendFeedbackReply(feedback, replyMessage);
        
        console.log(`WhatsApp message sent via Twilio to ${feedback.name} (${feedback.phone})`);
        
        res.status(200).json({
          success: true,
          message: 'WhatsApp message sent successfully via Twilio',
          messageId: messageResult.sid,
          customerName: feedback.name,
          customerPhone: feedback.phone,
          method: 'twilio_api'
        });
        
      } catch (twilioError) {
        console.error('Twilio API error:', twilioError);
        
        // Fallback to URL method if Twilio fails
        const fallbackUrl = createWhatsAppUrl(feedback, replyMessage);
        
        res.status(200).json({
          success: true,
          message: 'Twilio failed, falling back to WhatsApp URL',
          whatsappUrl: fallbackUrl,
          customerName: feedback.name,
          customerPhone: feedback.phone,
          method: 'url_fallback',
          error: twilioError.message
        });
      }
      
    } else {
      // Create WhatsApp URL (original method)
      const whatsappUrl = createWhatsAppUrl(feedback, replyMessage);
      
      console.log(`WhatsApp URL generated for ${feedback.name} (${feedback.phone})`);
      
      res.status(200).json({ 
        success: true,
        message: whatsappService.isConfigured() ? 'WhatsApp URL generated' : 'Twilio not configured - URL method used',
        whatsappUrl: whatsappUrl,
        customerName: feedback.name,
        customerPhone: feedback.phone,
        method: 'url',
        twilioConfigured: whatsappService.isConfigured()
      });
    }

  } catch (error) {
    console.error('Error sending WhatsApp reply:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending WhatsApp reply',
      error: error.message 
    });
  }
};

// Helper function to create WhatsApp URL
function createWhatsAppUrl(feedback, replyMessage) {
  // Format phone number for URL
  let phoneNumber = feedback.phone.replace(/\D/g, '');
  
  if (!phoneNumber.startsWith('94') && phoneNumber.length === 10) {
    phoneNumber = '94' + phoneNumber.substring(1);
  }

  // Create WhatsApp message with FarmerHub header
  const whatsappMessage = `*FarmerHub - Customer Service*%0A%0A` +
    `Dear ${feedback.name},%0A%0A` +
    `Thank you for your feedback regarding: "${feedback.subject}"%0A%0A` +
    `${encodeURIComponent(replyMessage)}%0A%0A` +
    `Best regards,%0A` +
    `FarmerHub Team%0A` +
    `🌾 Your trusted farming partner`;

  return `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;
}

// Controller to get WhatsApp service status
const getWhatsAppStatus = async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    
    res.status(200).json({
      success: true,
      whatsappService: status,
      message: status.configured 
        ? 'WhatsApp service is configured and ready' 
        : 'WhatsApp service running in simulation mode'
    });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking WhatsApp service status' 
    });
  }
};

module.exports = { submitFeedback, getFeedbacks, sendWhatsAppReply, getWhatsAppStatus };
