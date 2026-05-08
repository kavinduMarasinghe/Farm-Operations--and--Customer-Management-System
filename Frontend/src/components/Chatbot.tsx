import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

//  FAQ knowledge base with variations per answer
const faqData = [
  {
    questions: [
      "How do I place an order?",
      "Can I make an order?",
      "Steps to place an order",
      "How can I buy products?",
      "I want to order something",
      "How to make a purchase?",
    ],
    answer:
      "🛒 To place an order, browse our marketplace, add items to your cart, and proceed to checkout. Enter your delivery details and payment method to complete the order.",
  },
  {
    questions: [
      "Can I modify my order after placing it?",
      "Change my order",
      "Edit my order",
      "Update order after checkout",
      "Modify placed order",
    ],
    answer:
      "✏️ You can modify your order within **2 hours** of placing it if the status is still 'Pending'. After that, contact customer service for assistance.",
  },
  {
    questions: [
      "What are your delivery areas?",
      "Where do you deliver?",
      "Delivery locations",
      "Service areas",
      "Do you deliver to my area?",
      "To where do you deliver?",
    ],
    answer:
      "🚚 We currently deliver to all areas within **50 miles** of our farm locations. Enter your address at checkout to confirm availability.",
  },
  {
    questions: [
      "How fresh are your products?",
      "Are your products fresh?",
      "Product freshness",
      "How quickly are items harvested?",
      "Do you sell fresh food?",
    ],
    answer:
      "🥦 All our products are harvested within **24-48 hours** before delivery to guarantee maximum freshness and quality.",
  },
  {
    questions: [
      "What payment methods do you accept?",
      "Payment options",
      "How can I pay?",
      "Do you take credit cards?",
      "Accepted payment types",
    ],
    answer:
      "💳 We accept **cash on delivery (COD)**, debit/credit cards, and secure online payments.",
  },
  {
    questions: [
      "Is my payment information secure?",
      "Is it safe to pay online?",
      "Payment security",
      "Are card details secure?",
      "Is checkout secure?",
    ],
    answer:
      "🔒 Yes, your payment information is protected with **industry-standard encryption**. Your data is safe with us.",
  },
  {
    questions: [
      "Do you offer refunds?",
      "Refund policy",
      "Can I get my money back?",
      "Return policy",
      "Refunds available?",
    ],
    answer:
      "💵 We offer full refunds for **damaged or unsatisfactory products**. Please contact us within **24 hours of delivery**.",
  },
  {
    questions: [
      "How do I book a cottage?",
      "Can I book a cottage?",
      "I want to reserve a cottage",
      "Steps to make a cottage booking",
      "How can I rent a cottage?",
    ],
    answer:
      "🏡 To book a cottage, browse our listings, choose your dates and guests, and confirm your booking with payment.",
  },
  {
    questions: [
      "Can I cancel my cottage booking?",
      "Cancel cottage reservation",
      "Cancel booking",
      "Refund for cottage booking",
      "How to cancel my booking?",
    ],
    answer:
      "❌ You can cancel **free of charge up to 48 hours** before check-in. After that, cancellation fees may apply.",
  },
  {
    questions: [
      "What amenities are included?",
      "Cottage amenities",
      "Facilities included",
      "What do cottages offer?",
      "Cottage features",
    ],
    answer:
      "📦 Each cottage includes different amenities. Common ones are **WiFi, kitchen, parking, and access to farm activities**. Check the listing for details.",
  },
  {
    questions: [
      "Are pets allowed?",
      "Can I bring pets?",
      "Pet policy",
      "Do cottages allow dogs?",
      "Pet friendly cottages?",
      "Can I take pets to cottages?",
    ],
    answer:
      "🐕 Yes! Some cottages are **pet-friendly**. Please check the amenities list or contact us to confirm.",
  },
  {
    questions: [
      "How can I contact customer service?",
      "How to contact you",
      "Customer service number",
      "Support email",
      "Get in touch",
    ],
    answer:
      "📞 You can reach us at **support@farmerhub.com** or call **(555) 123-FARM**.",
  },
  {
    questions: [
      "What are your business hours?",
      "Opening hours",
      "When are you open?",
      "Working hours",
      "Customer service times",
    ],
    answer:
      "⏰ Our customer service is available **Mon-Fri 8AM-6PM, Sat 9AM-4PM, closed on Sundays.**",
  },
  {
    questions: [
      "Do you offer farm tours?",
      "Farm visits",
      "Can I visit your farm?",
      "Guided farm tour",
      "Farm activities",
    ],
    answer:
      "🌱 Yes! We offer **guided farm tours on weekends**. Contact us to schedule a visit and learn about our sustainable farming.",
  },
];

// 🔹 Match user question to closest FAQ
const findAnswer = (userInput: string): string | null => {
  const input = userInput.toLowerCase();

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const faq of faqData) {
    for (const q of faq.questions) {
      const lowerQ = q.toLowerCase();

      // Word overlap
      const inputWords = input.split(" ");
      const qWords = lowerQ.split(" ");
      const overlap = inputWords.filter((w) => qWords.includes(w)).length;

      // Fuzzy: substring check
      const similarity =
        input.includes(lowerQ) || lowerQ.includes(input) ? 1 : 0;

      const score = overlap + similarity;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq.answer;
      }
    }
  }

  return bestScore > 0 ? bestMatch : null;
};

const Chatbot = () => {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    {
      sender: "bot",
      text: "👋 Hi! Ask me anything about orders, payments, cottages, or contact info.",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    const answer = findAnswer(input);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            answer ||
            "❓ Sorry, I couldn’t find an answer. Please check our FAQ or contact support.",
        },
      ]);
    }, 300);

    setInput("");
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg shadow bg-white">
      {/* Header */}
      <div className="p-3 bg-primary text-primary-foreground font-semibold rounded-t-lg">
        Chat with Us
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.sender === "bot" ? "text-left" : "text-right"}>
            <span
              className={`inline-block px-3 py-2 rounded-lg ${
                m.sender === "bot" ? "bg-gray-200" : "bg-green-200"
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex border-t p-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
        />
        <Button onClick={sendMessage} className="ml-2">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chatbot;
