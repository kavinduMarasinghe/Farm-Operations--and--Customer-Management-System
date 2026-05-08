
import { useState, useRef, useEffect } from "react";
import { BookOpen, Send, Bot, User, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface GuideSection {
  title: string;
  content: string;
  category: string;
}

export default function WorkGuide() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your Farm Assistant. I can help you with safety procedures, equipment operation, crop management, and any farm-related questions. How can I assist you today?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const guides: GuideSection[] = [
    {
      title: "Tractor Safety Procedures",
      content: "Always perform pre-operation inspection, wear seatbelt, maintain proper speed, and never operate under influence.",
      category: "Safety"
    },
    {
      title: "Irrigation System Operation",
      content: "Check water pressure, inspect nozzles, monitor soil moisture levels, and adjust timing based on weather conditions.",
      category: "Equipment"
    },
    {
      title: "Crop Harvesting Guidelines",
      content: "Test grain moisture, adjust combine settings, maintain proper ground speed, and monitor grain quality.",
      category: "Crops"
    },
    {
      title: "Equipment Maintenance Schedule",
      content: "Daily checks before operation, weekly fluid levels, monthly filter changes, and seasonal overhauls.",
      category: "Maintenance"
    },
    {
      title: "Weather Monitoring",
      content: "Check forecasts daily, monitor frost warnings, track precipitation, and adjust field operations accordingly.",
      category: "Weather"
    },
    {
      title: "Chemical Application Safety",
      content: "Wear proper PPE, read all labels, check wind conditions, maintain spray records, and follow re-entry intervals.",
      category: "Safety"
    }
  ];

  const categories = ["All", "Safety", "Equipment", "Crops", "Maintenance", "Weather"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredGuides = selectedCategory === "All" 
    ? guides 
    : guides.filter(guide => guide.category === selectedCategory);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes("tractor") || message.includes("equipment")) {
      return "For tractor operations, always perform a pre-operation inspection including checking fluid levels, tire pressure, and all safety systems. Remember to engage the PTO at proper RPM and never operate without proper guards in place.";
    } else if (message.includes("safety") || message.includes("ppe")) {
      return "Safety is our top priority! Always wear appropriate PPE including hard hats in designated areas, safety glasses when operating equipment, and hearing protection around loud machinery. Never take shortcuts when it comes to safety procedures.";
    } else if (message.includes("harvest") || message.includes("crop")) {
      return "For optimal harvesting, monitor grain moisture levels (aim for 15-20% for corn), adjust combine settings based on crop conditions, and maintain appropriate ground speed to minimize losses. Document yield data for future reference.";
    } else if (message.includes("irrigation") || message.includes("water")) {
      return "Check irrigation systems daily during growing season. Monitor soil moisture at multiple depths, inspect for clogged nozzles, and adjust timing based on weather forecasts. Proper water management is crucial for crop health.";
    } else if (message.includes("maintenance")) {
      return "Follow the maintenance schedule strictly: daily pre-operation checks, weekly fluid level inspections, monthly filter replacements, and seasonal comprehensive overhauls. Proper maintenance prevents costly breakdowns.";
    } else if (message.includes("weather")) {
      return "Monitor weather conditions constantly. Check forecasts each morning, watch for frost warnings during sensitive periods, and be prepared to adjust field operations based on weather changes. Weather apps and local agricultural extensions are great resources.";
    } else {
      return "I can help you with various farm operations including equipment safety, crop management, irrigation, maintenance schedules, and weather monitoring. Feel free to ask about any specific farming procedures or safety guidelines!";
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputMessage),
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen p-6 pr-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 w-full">
        <div className="w-10 h-10 bg-gradient-farm rounded-lg flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Work Guide</h1>
          <p className="text-muted-foreground">Farm procedures and AI assistant for guidance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Guides Section */}
        <div className="space-y-4 w-full">
          <Card>
            <CardHeader>
              <CardTitle>Farm Procedures & Guidelines</CardTitle>
              <CardDescription>Essential guides for safe and efficient farm operations</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(category => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "secondary"}
                    className={`cursor-pointer ${
                      selectedCategory === category 
                        ? "bg-gradient-farm text-primary-foreground" 
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>

              {/* Guides List */}
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredGuides.map((guide, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{guide.title}</h4>
                        <Badge variant="secondary" className="ml-2">{guide.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{guide.content}</p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chatbot Section */}
        <div className="space-y-4 w-full">
          <Card className="flex flex-col h-[600px] w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Farm Assistant AI
              </CardTitle>
              <CardDescription>Ask questions about farm procedures, safety, and operations</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === "bot" 
                          ? "bg-gradient-farm text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {message.sender === "bot" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      
                      <div className={`flex-1 max-w-[80%] ${
                        message.sender === "user" ? "text-right" : ""
                      }`}>
                        <div className={`p-3 rounded-lg ${
                          message.sender === "bot"
                            ? "bg-muted text-foreground"
                            : "bg-gradient-farm text-primary-foreground"
                        }`}>
                          <p className="text-sm">{message.text}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-farm text-primary-foreground flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Ask about farm procedures, safety, or operations..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={isTyping}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-farm hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
