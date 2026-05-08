import React from 'react';
import { HelpCircle, Mail, Phone, MessageSquare, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Chatbot from '@/components/Chatbot'; // ✅ import chatbot

const faqData = [
  {
    category: 'Ordering',
    questions: [
      {
        question: 'How do I place an order?',
        answer: 'Browse our marketplace, add items to your cart, and proceed to checkout. Fill in your delivery details and choose your payment method to complete the order.',
      },
      {
        question: 'Can I modify my order after placing it?',
        answer: 'You can modify your order within 2 hours of placing it if the status is still "Pending". After that, please contact our customer service.',
      },
      {
        question: 'What are your delivery areas?',
        answer: 'We currently deliver to all areas within 50 miles of our farm locations. Enter your address at checkout to check availability.',
      },
      {
        question: 'How fresh are your products?',
        answer: 'All our products are harvested within 24-48 hours before delivery to ensure maximum freshness and quality.',
      },
    ],
  },
  {
    category: 'Payment',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept cash on delivery (COD), credit/debit cards, and online payment methods for your convenience.',
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Yes, we use industry-standard encryption to protect your payment information. Your data is safe and secure with us.',
      },
      {
        question: 'Do you offer refunds?',
        answer: 'We offer full refunds for damaged or unsatisfactory products. Contact us within 24 hours of delivery for refund requests.',
      },
    ],
  },
  {
    category: 'Cottages',
    questions: [
      {
        question: 'How do I book a cottage?',
        answer: 'Browse our cottage listings, select your preferred dates and number of guests, then confirm your booking with payment.',
      },
      {
        question: 'Can I cancel my cottage booking?',
        answer: 'Free cancellation is available up to 48 hours before check-in. Cancellations within 48 hours may incur charges.',
      },
      {
        question: 'What amenities are included?',
        answer: 'Each cottage listing shows specific amenities. Common amenities include WiFi, kitchen facilities, parking, and access to farm activities.',
      },
      {
        question: 'Are pets allowed?',
        answer: 'Some cottages are pet-friendly. Check the amenities list or contact us to confirm pet policies for specific cottages.',
      },
    ],
  },
  {
    category: 'Contact Info',
    questions: [
      {
        question: 'How can I contact customer service?',
        answer: 'You can reach us via email at support@farmerhub.com, call us at (555) 123-FARM, or use the contact form on our website.',
      },
      {
        question: 'What are your business hours?',
        answer: 'Our customer service is available Monday to Friday 8 AM - 6 PM, and Saturday 9 AM - 4 PM. We are closed on Sundays.',
      },
      {
        question: 'Do you offer farm tours?',
        answer: 'Yes! We offer guided farm tours on weekends. Contact us to schedule a visit and learn about our sustainable farming practices.',
      },
    ],
  },
];

const Help = () => {
  return (
    <div className="min-h-screen bg-gradient-nature">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-4">Help & Support</h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions or get in touch with our support team
            </p>
          </div>

          {/* FAQ + Chatbot Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* FAQ Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {faqData.map((category, categoryIndex) => (
                      <div key={categoryIndex}>
                        <h3 className="text-lg font-semibold text-primary mb-3 flex items-center">
                          <ChevronRight className="h-4 w-4 mr-2" />
                          {category.category}
                        </h3>
                        <Accordion type="single" collapsible className="space-y-2">
                          {category.questions.map((faq, questionIndex) => (
                            <AccordionItem
                              key={questionIndex}
                              value={`${categoryIndex}-${questionIndex}`}
                              className="border border-border rounded-lg px-4"
                            >
                              <AccordionTrigger className="text-left hover:no-underline">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chatbot Section */}
            <div>
              <Chatbot />
            </div>
          </div>

          {/* Other Info Boxes Below */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {/* Contact Us */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
                    <Mail className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@farmerhub.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
                    <Phone className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-muted-foreground">(555) 123-FARM</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
                    <MessageSquare className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-sm text-muted-foreground">Available Mon-Fri 8AM-6PM</p>
                  </div>
                </div>

                <Button className="w-full mt-4">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Live Chat
                </Button>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>8 AM - 6 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>9 AM - 4 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visit Our Farm */}
            <Card>
              <CardHeader>
                <CardTitle>Visit Our Farm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">FarmerHub Headquarters</p>
                  <p className="text-muted-foreground">
                    123 Organic Valley Road<br />
                    Green Valley, CA 94587<br />
                    United States
                  </p>
                  <Button variant="outline" className="w-full mt-4">
                    Get Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
