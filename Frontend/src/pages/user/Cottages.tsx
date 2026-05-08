import React, { useState, useEffect } from 'react';
import { MapPin, Users, Wifi, Car, Coffee, Tv, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface BackendCottage {
  _id: string;
  name: string;
  location: string;
  capacity: number;
  pricePerNight: number;
  rating?: number;
  reviews?: number;
  available: boolean;
  image: string;
  description?: string;
  amenities: string[];
}

const Cottages = () => {
  const [cottages, setCottages] = useState<BackendCottage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchCottages = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8070/api/cottages');
        if (response.data.success) {
          setCottages(response.data.data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch cottages.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching cottages:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch cottages from server.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCottages();
  }, [toast]);

  const filteredCottages = cottages.filter(cottage => {
    if (filter === 'available') return cottage.available;
    if (filter === 'unavailable') return !cottage.available;
    return true;
  });

  const getAmenityIcon = (amenity: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Wifi: <Wifi className="h-4 w-4" />,
      Kitchen: <Coffee className="h-4 w-4" />,
      Parking: <Car className="h-4 w-4" />,
      TV: <Tv className="h-4 w-4" />,
    };
    return icons[amenity] || null;
  };

  if (loading) {
    return <div className="text-center py-12">Loading cottages...</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Farm Stay Cottages</h1>
          <p className="text-muted-foreground">
            Escape to the countryside and experience authentic farm life
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
              All Cottages
            </Button>
            <Button variant={filter === 'available' ? 'default' : 'outline'} onClick={() => setFilter('available')}>
              Available
            </Button>
            <Button variant={filter === 'unavailable' ? 'default' : 'outline'} onClick={() => setFilter('unavailable')}>
              Booked
            </Button>
          </div>
        </div>

        {/* Cottages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCottages.map(cottage => (
            <Card
              key={cottage._id}
              className="border-border bg-card shadow-card hover:shadow-natural transition-all duration-200"
            >
              <CardHeader className="p-0">
                <div className="h-48 w-full flex items-center justify-center overflow-hidden relative rounded-t-lg">
                  <img
                    src={cottage.image}
                    alt={cottage.name}
                    className="object-cover h-full w-full"
                    onError={e => {
                      e.currentTarget.src = '/placeholder.png';
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    <Badge variant={cottage.available ? 'default' : 'secondary'}>
                      {cottage.available ? 'Available' : 'Booked'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Name + Location */}
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{cottage.name}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    {cottage.location}
                  </div>
                </div>

                {/* Rating + Reviews */}
                {/* Rating + Reviews */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="font-medium">{cottage.rating ?? 0}</span>
                    <span className="text-muted-foreground text-sm">
                      ({cottage.reviews ?? 0} reviews)
                    </span>
                  </div>
                </div>

                {/* Description */}
                {cottage.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{cottage.description}</p>
                )}

                {/* Amenities (all, not limited) */}
                <div className="flex flex-wrap gap-1">
                  {cottage.amenities &&
                    cottage.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                        {getAmenityIcon(amenity)}
                        {amenity}
                      </Badge>
                    ))}
                </div>

                {/* Capacity + Price row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" />
                    Up to {cottage.capacity} guests
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      Rs. {cottage.pricePerNight}
                    </div>
                    <div className="text-xs text-muted-foreground">per night</div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Link
                  to={cottage.available ? `/cottage-booking/${cottage._id}` : '#'}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!cottage.available}
                  >
                    {cottage.available ? 'Book Cottage' : 'Not Available'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredCottages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No cottages found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cottages;
