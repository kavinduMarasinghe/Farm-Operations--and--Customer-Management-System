import React, { useEffect, useState } from 'react';
import { Calendar, Users, Home, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Booking {
  _id: string;
  cottageId: {
    _id: string;
    name: string;
    capacity: number;
    pricePerNight: number;
    location: string;
  };
  cottageName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'secondary' as const;
    case 'confirmed':
      return 'default' as const;
    case 'completed':
      return 'outline' as const;
    case 'cancelled':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const MyBookings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      if (!user?.id) {
        toast({
          title: 'Error',
          description: 'Please login to view your bookings',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      const res = await axios.get(`http://localhost:8070/api/bookings/user/${user.id}`);
      if (res.data.success) {
        setBookings(res.data.data);
      } else {
        toast({
          title: 'Error',
          description: res.data.message || 'Failed to fetch bookings',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Server Error',
        description: error.response?.data?.message || 'Failed to fetch bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await axios.delete(`http://localhost:8070/api/bookings/${id}`);
      if (res.data.success) {
        setBookings((prev) => prev.filter((b) => b._id !== id));
        toast({
          title: 'Booking Cancelled',
          description: 'Your booking has been successfully cancelled.',
        });
      } else {
        toast({
          title: 'Error',
          description: res.data.message || 'Failed to cancel booking',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Server Error',
        description: error.response?.data?.message || 'Failed to cancel booking',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary text-lg">
        Loading your bookings...
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-nature">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Home className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-primary mb-4">
              No Bookings Yet
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              You haven't made any cottage bookings yet. Browse our cottages to
              book your stay.
            </p>
            <Button 
              onClick={() => navigate('/cottages')}
              className="bg-primary hover:bg-primary/90"
            >
              Browse Cottages
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-nature">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-8">
          My Cottage Bookings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const nights = Math.ceil(
              (new Date(booking.checkOut).getTime() -
                new Date(booking.checkIn).getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return (
              <Card
                key={booking._id}
                className="hover:shadow-medium transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.cottageName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Booking #{booking._id}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(booking.status)}>
                      {formatStatus(booking.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Booking Details */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {new Date(booking.checkIn).toLocaleDateString()} -{' '}
                        {new Date(booking.checkOut).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {booking.guests} guest
                        {booking.guests > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {nights} night{nights > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="border-t pt-4 flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold">Total Amount</span>
                      <div className="text-lg font-bold text-accent">
                        Rs. {booking.totalAmount.toFixed(2)}
                      </div>
                    </div>

                    {/* Cancel button only if not completed/cancelled */}
                    {booking.status === 'pending' || booking.status === 'confirmed' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancelBooking(booking._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    ) : null}
                  </div>

                  {/* Status-specific information */}
                  {booking.status === 'pending' && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      Your booking is being reviewed. You'll receive a
                      confirmation soon.
                    </div>
                  )}

                  {booking.status === 'confirmed' && (
                    <div className="text-sm text-success bg-success/10 p-3 rounded-lg">
                      Your booking is confirmed! Check your email for details and
                      check-in instructions.
                    </div>
                  )}

                  {booking.status === 'completed' && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      Thank you for staying with us! We hope you had a wonderful
                      time.
                    </div>
                  )}

                  {booking.status === 'cancelled' && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      This booking has been cancelled. If you need assistance,
                      please contact us.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
