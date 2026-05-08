import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Trash2, CheckCircle, Wifi, Car, Coffee, CalendarDays } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  _id: string;
  cottageName: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "unpaid" | "paid";
  totalAmount: number;
  image?: string;
  location?: string;
  capacity?: number;
  amenities?: string[];
}

const getAmenityIcon = (amenity: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    Wifi: <Wifi className="h-4 w-4" />,
    Kitchen: <Coffee className="h-4 w-4" />,
    Parking: <Car className="h-4 w-4" />,
  };
  return icons[amenity] || null;
};

const CottageBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:8070/api/bookings/all");
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`http://localhost:8070/api/bookings/${id}/status`, {
        status,
      });
      toast({ title: "Success", description: `Booking ${status}` });
      fetchBookings();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const categorized = {
    pending: bookings.filter((b) => b.status === "pending"),
    confirmed: bookings.filter(
      (b) => b.status === "confirmed" && b.paymentStatus !== "paid"
    ),
    paid: bookings.filter((b) => b.paymentStatus === "paid"),
    cancelled: bookings.filter((b) => b.status === "cancelled"),
  };

    const BookingCard = ({ booking }: { booking: Booking }) => {
    // calculate nights
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
        <Card className="border border-border bg-card shadow-sm rounded-lg">
        <CardContent className="p-6 space-y-4">
            {/* Header with name + status */}
            <div className="flex justify-between items-start">
            <div>
                <h3 className="font-semibold text-lg text-foreground">
                {booking.cottageName}
                </h3>
                <p className="text-sm text-muted-foreground">
                Booking #{booking._id}
                </p>
                <p className="text-sm font-medium text-primary">
                Customer: {booking.userId?.fullName || 'Unknown Customer'}
                </p>
            </div>
            <Badge
                variant={
                booking.status === "cancelled"
                    ? "destructive"
                    : booking.status === "confirmed"
                    ? "secondary"
                    : "default"
                }
            >
                {booking.status.charAt(0).toUpperCase() +
                booking.status.slice(1)}
            </Badge>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {checkInDate.toLocaleDateString()} - {checkOutDate.toLocaleDateString()}
            </div>

            {/* Guests */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {booking.guests} guests
            </div>

            {/* Nights */}
            <p className="text-sm text-muted-foreground">{nights} night(s)</p>

            <hr className="border-border" />

            {/* Total */}
            <div>
            <p className="text-sm font-medium text-foreground">Total Amount</p>
            <p className="text-xl font-bold text-primary">
                Rs. {booking.totalAmount.toFixed(2)}
            </p>
            </div>

            {/* Actions */}
            {booking.status === "pending" && (
            <div className="flex gap-2 pt-2">
                <Button
                size="sm"
                className="bg-gradient-primary flex-1"
                onClick={() => updateStatus(booking._id, "confirmed")}
                >
                <CheckCircle className="h-4 w-4 mr-2" /> Confirm
                </Button>
                <Button
                size="sm"
                variant="outline"
                className="text-destructive flex-1"
                onClick={() => updateStatus(booking._id, "cancelled")}
                >
                <Trash2 className="h-4 w-4 mr-2" /> Cancel
                </Button>
            </div>
            )}

            {booking.status === "confirmed" &&
            booking.paymentStatus !== "paid" && (
                <div className="flex gap-2 pt-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive flex-1"
                    onClick={() => updateStatus(booking._id, "cancelled")}
                >
                    <Trash2 className="h-4 w-4 mr-2" /> Cancel
                </Button>
                </div>
            )}
        </CardContent>
        </Card>
    );
    };

  return (
    <div className="space-y-10">
      {/* Pending */}
      <section>
        <h2 className="text-2xl font-bold mb-4">⏳ Pending Bookings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categorized.pending.map((b) => (
            <BookingCard key={b._id} booking={b} />
          ))}
        </div>
        {categorized.pending.length === 0 && (
          <p className="text-muted-foreground">No pending bookings.</p>
        )}
      </section>

      {/* Confirmed */}
      <section>
        <h2 className="text-2xl font-bold mb-4">✅ Confirmed Bookings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categorized.confirmed.map((b) => (
            <BookingCard key={b._id} booking={b} />
          ))}
        </div>
        {categorized.confirmed.length === 0 && (
          <p className="text-muted-foreground">No confirmed bookings.</p>
        )}
      </section>

      {/* Paid */}
      <section>
        <h2 className="text-2xl font-bold mb-4">💰 Paid Bookings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categorized.paid.map((b) => (
            <BookingCard key={b._id} booking={b} />
          ))}
        </div>
        {categorized.paid.length === 0 && (
          <p className="text-muted-foreground">No paid bookings.</p>
        )}
      </section>

      {/* Cancelled */}
      <section>
        <h2 className="text-2xl font-bold mb-4">❌ Cancelled Bookings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categorized.cancelled.map((b) => (
            <BookingCard key={b._id} booking={b} />
          ))}
        </div>
        {categorized.cancelled.length === 0 && (
          <p className="text-muted-foreground">No cancelled bookings.</p>
        )}
      </section>
    </div>
  );
};

export default CottageBookings;
