const twilio = require('twilio');

class WhatsAppService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
        
        // Initialize Twilio client
        if (this.accountSid && this.authToken) {
            this.client = twilio(this.accountSid, this.authToken);
        } else {
            console.warn('Twilio credentials not configured. WhatsApp messages will be simulated.');
        }
    }

    /**
     * Format phone number for WhatsApp
     * @param {string} phoneNumber - Raw phone number
     * @returns {string} - Formatted WhatsApp number
     */
    formatWhatsAppNumber(phoneNumber) {
        // Remove all non-digits
        let cleanNumber = phoneNumber.replace(/\D/g, '');
        
        // Handle Sri Lankan numbers
        if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
            cleanNumber = '94' + cleanNumber.substring(1);
        } else if (cleanNumber.length === 9) {
            cleanNumber = '94' + cleanNumber;
        } else if (!cleanNumber.startsWith('94') && cleanNumber.length === 10) {
            cleanNumber = '94' + cleanNumber.substring(1);
        }
        
        return `whatsapp:+${cleanNumber}`;
    }

    /**
     * Send WhatsApp message using Twilio
     * @param {string} to - Recipient phone number
     * @param {string} message - Message content
     * @returns {Promise} - Twilio message response
     */
    async sendMessage(to, message) {
        try {
            const formattedNumber = this.formatWhatsAppNumber(to);
            
            if (!this.client) {
                // Simulate message sending when Twilio is not configured
                console.log('SIMULATED WhatsApp Message:');
                console.log(`To: ${formattedNumber}`);
                console.log(`From: ${this.whatsappNumber}`);
                console.log(`Message: ${message}`);
                console.log('---');
                
                return {
                    sid: 'SIMULATED_MESSAGE_SID',
                    status: 'sent',
                    to: formattedNumber,
                    from: this.whatsappNumber,
                    body: message,
                    dateCreated: new Date()
                };
            }

            const messageResponse = await this.client.messages.create({
                body: message,
                from: this.whatsappNumber,
                to: formattedNumber
            });

            console.log(`WhatsApp message sent successfully: ${messageResponse.sid}`);
            return messageResponse;

        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            throw new Error(`Failed to send WhatsApp message: ${error.message}`);
        }
    }

    /**
     * Create a formatted feedback reply message
     * @param {Object} feedback - Feedback object
     * @param {string} replyMessage - Admin's reply
     * @returns {string} - Formatted message
     */
    createFeedbackReplyMessage(feedback, replyMessage) {
        const message = `*FarmerHub - Customer Service*

Dear ${feedback.name},

Thank you for your feedback regarding: "${feedback.subject}"

${replyMessage}

Best regards,
FarmerHub Team
🌾 Your trusted farming partner

---
If you have any further questions, please don't hesitate to contact us.`;

        return message;
    }

    /**
     * Send feedback reply via WhatsApp
     * @param {Object} feedback - Feedback object with customer details
     * @param {string} replyMessage - Admin's reply message
     * @returns {Promise} - Message sending result
     */
    async sendFeedbackReply(feedback, replyMessage) {
        if (!feedback.phone) {
            throw new Error('Customer phone number not available');
        }

        const formattedMessage = this.createFeedbackReplyMessage(feedback, replyMessage);
        return await this.sendMessage(feedback.phone, formattedMessage);
    }

    /**
     * Check if WhatsApp service is properly configured
     * @returns {boolean} - Configuration status
     */
    isConfigured() {
        return !!(this.accountSid && this.authToken);
    }

    /**
     * Get configuration status for admin dashboard
     * @returns {Object} - Service status
     */
    getStatus() {
        return {
            configured: this.isConfigured(),
            whatsappNumber: this.whatsappNumber,
            mode: this.isConfigured() ? 'live' : 'simulation'
        };
    }
}

module.exports = new WhatsAppService();