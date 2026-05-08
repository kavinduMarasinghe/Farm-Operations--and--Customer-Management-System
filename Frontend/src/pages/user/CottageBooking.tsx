import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Wifi, Car, Coffee, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface Cottage {
  _id: string;
  name: string;
  location: string;
  capacity: number;
  pricePerNight: number;
  image: string;
  amenities: string[];
}

const getAmenityIcon = (amenity: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    'Wifi': <Wifi className="h-4 w-4" />,
    'Kitchen': <Coffee className="h-4 w-4" />,
    'Parking': <Car className="h-4 w-4" />,
  };
  return icons[amenity] || null;
};

const CottageBooking = () => {
  const { cottageId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [cottage, setCottage] = useState<Cottage | null>(null);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch cottage details from backend
  useEffect(() => {
  const fetchData = async () => {
    try {
      // 1. Get cottage details
      const resCottage = await axios.get(`http://localhost:8070/api/cottages/${cottageId}`);
      if (resCottage.data) {
        setCottage(resCottage.data);
      }

      // 2. Get bookings for this cottage
      const resBookings = await axios.get(`http://localhost:8070/api/bookings/cottage/${cottageId}`);
      if (resBookings.data.success) {
        const allDates: Date[] = [];

        resBookings.data.bookings.forEach((b: any) => {
          const start = new Date(b.checkIn);
          const end = new Date(b.checkOut);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            allDates.push(new Date(d));
          }
        });

        setBookedDates(allDates);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load cottage or booking data.",
        variant: "destructive",
      });
    }
  };

  if (cottageId) fetchData();
}, [cottageId]);


  if (!cottage) {
    return (
      <div className="min-h-screen bg-gradient-nature flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-2xl font-bold text-primary mb-4">Cottage Not Found</h2>
            <p className="text-muted-foreground mb-6">The cottage you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/cottages')}>Browse Cottages</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateTotalAmount = () => {
    if (!checkIn || !checkOut) return 0;
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights * cottage.pricePerNight;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkIn || !checkOut) {
      toast({ title: "Missing Dates", description: "Please select check-in and check-out dates.", variant: "destructive" });
      return;
    }

    if (checkOut <= checkIn) {
      toast({ title: "Invalid Dates", description: "Check-out date must be after check-in date.", variant: "destructive" });
      return;
    }

    if (guests > cottage.capacity) {
      toast({ title: "Too Many Guests", description: `This cottage can accommodate maximum ${cottage.capacity} guests.`, variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      if (!user?.id) {
        toast({ 
          title: "Authentication Error", 
          description: "Please login to make a booking.", 
          variant: "destructive" 
        });
        return;
      }

      const res = await axios.post("http://localhost:8070/api/bookings", {
        userId: user.id,
        cottageId: cottage._id,
        checkIn,
        checkOut,
        guests,
        totalAmount: calculateTotalAmount(),
      });

      if (res.data.success) {
        toast({ title: "Booking Confirmed!", description: `Your booking for ${cottage.name} has been created.` });
        navigate('/my-bookings');
      } else {
        toast({ title: "Error", description: res.data.message || "Failed to create booking.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Server Error",
        description: error.response?.data?.message || "Something went wrong. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const nights = checkIn && checkOut
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-nature">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-8">Book Your Stay</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cottage Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="p-0">
                  <div className="aspect-video rounded-t-lg bg-muted overflow-hidden">
                    <img src={cottage.image} alt={cottage.name} className="w-full h-full object-cover" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">{cottage.name}</h2>

                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{cottage.location}</span>
                  </div>

                  <div className="flex items-center text-muted-foreground mb-4">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Up to {cottage.capacity} guests</span>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-primary mb-2">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {cottage.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {getAmenityIcon(amenity)}
                          <span className="ml-1">{amenity}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-accent">
                    Rs. {cottage.pricePerNight}
                    <span className="text-sm font-normal text-muted-foreground"> / night</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Check-in */}
                      <div>
                        <Label htmlFor="checkin">Check-in Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !checkIn && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {checkIn ? format(checkIn, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={checkIn}
                              onSelect={setCheckIn}
                              disabled={(date) =>
                                date < new Date() ||
                                bookedDates.some(d => d.toDateString() === date.toDateString()) // 🔹 disable booked
                              }
                              modifiers={{
                                booked: bookedDates, // 🔹 highlight booked
                              }}
                              modifiersStyles={{
                                booked: {
                                  backgroundColor: "#f8d7da", // pale red
                                  color: "#721c24",          // darker red text
                                  opacity: 0.7,
                                  borderRadius: "6px",
                                },
                              }}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Check-out */}
                      <div>
                        <Label htmlFor="checkout">Check-out Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !checkOut && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {checkOut ? format(checkOut, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={checkOut}
                              onSelect={setCheckOut}
                              disabled={(date) =>
                                date <= (checkIn || new Date()) ||
                                bookedDates.some(d => d.toDateString() === date.toDateString()) // 🔹 disable booked
                              }
                              modifiers={{
                                booked: bookedDates,
                              }}
                              modifiersStyles={{
                                booked: {
                                  backgroundColor: "#f8d7da", 
                                  color: "#721c24",
                                  opacity: 0.7,
                                  borderRadius: "6px",
                                },
                              }}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Guests */}
                    <div>
                      <Label htmlFor="guests">Number of Guests</Label>
                      <Input id="guests" type="number" min="1" max={cottage.capacity} value={guests} onChange={(e) => setGuests(parseInt(e.target.value) || 1)} required />
                    </div>

                    {/* Booking Summary */}
                    {checkIn && checkOut && (
                      <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-semibold text-primary mb-2">Booking Summary</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>{nights} night(s) × Rs. {cottage.pricePerNight}</span>
                            <span>Rs. {(nights * cottage.pricePerNight).toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between font-bold">
                              <span>Total</span>
                              <span className="text-accent">Rs. {calculateTotalAmount().toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button type="submit" size="lg" className="w-full" disabled={isProcessing || !checkIn || !checkOut}>
                      {isProcessing ? 'Processing...' : 'Confirm Booking'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CottageBooking;
