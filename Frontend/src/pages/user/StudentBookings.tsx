import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AppSidebar } from '@/components/layout/StudentAppSidebar';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { 
  Calendar,
  MapPin,
  Users,
  Clock,
  Search,
  Filter,
  Plus,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FlaskConical,
  CalendarDays
} from 'lucide-react';

interface LabTour {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  capacity: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  _id: string;
  tour: {
    _id: string;
    title: string;
    description?: string;
    location?: string;
    startDate: string;
    endDate?: string;
  };
  student: string;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const StudentBookings: React.FC = () => {
  const [availableTours, setAvailableTours] = useState<LabTour[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toursLoading, setToursLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('available');

  // Available tours state
  const [toursPagination, setToursPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 6,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  // My bookings state
  const [bookingsPagination, setBookingsPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Booking dialog state
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<LabTour | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch available lab tours
  const fetchAvailableTours = async () => {
    try {
      setToursLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: (toursPagination?.page || 1).toString(),
        limit: (toursPagination?.limit || 6).toString(),
        showArchived: 'false', // Only show active tours
        sort: 'startDate',
        order: 'asc'
      });

      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`http://localhost:8070/api/student/labtours?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Filter out past tours
        const upcomingTours = data.tours.filter((tour: LabTour) => 
          new Date(tour.startDate) > new Date()
        );
        setAvailableTours(upcomingTours);
        
        // Safely set pagination with fallback values
        if (data.pagination) {
          setToursPagination({
            total: data.pagination.total || 0,
            page: data.pagination.page || data.pagination.currentPage || 1,
            limit: data.pagination.limit || 6,
            pages: data.pagination.pages || data.pagination.totalPages || 0
          });
        }
      } else {
        setError(data.message || 'Failed to fetch available tours');
      }
    } catch (err) {
      setError('Network error occurred while fetching tours');
      console.error('Tours fetch error:', err);
    } finally {
      setToursLoading(false);
      setLoading(false);
    }
  };

  // Fetch my bookings
  const fetchMyBookings = async () => {
    try {
      setBookingsLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: (bookingsPagination?.page || 1).toString(),
        limit: (bookingsPagination?.limit || 10).toString(),
        sort: 'date',
        order: 'desc'
      });

      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const response = await fetch(`http://localhost:8070/api/student/bookings/mine?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMyBookings(data.bookings || []);
        
        // Safely set pagination with fallback values
        if (data.pagination) {
          setBookingsPagination({
            total: data.pagination.total || 0,
            page: data.pagination.page || data.pagination.currentPage || 1,
            limit: data.pagination.limit || 10,
            pages: data.pagination.pages || data.pagination.totalPages || 0
          });
        }
      } else {
        setError(data.message || 'Failed to fetch your bookings');
      }
    } catch (err) {
      setError('Network error occurred while fetching bookings');
      console.error('Bookings fetch error:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Create a new booking
  const createBooking = async () => {
    if (!selectedTour) return;

    try {
      setSubmitting(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:8070/api/student/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tourId: selectedTour._id,
          notes: bookingNotes
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Tour booked successfully!');
        setIsBookingDialogOpen(false);
        setSelectedTour(null);
        setBookingNotes('');
        fetchMyBookings();
        fetchAvailableTours(); // Refresh to update capacity
      } else {
        setError(data.message || 'Failed to book tour');
      }
    } catch (err) {
      setError('Network error occurred while booking tour');
      console.error('Booking creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel a booking
  const cancelBooking = async (bookingId: string) => {
    try {
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      let data;
      try {
        const response = await fetch(`http://localhost:8070/api/student/bookings/${bookingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // Handle non-JSON responses (like HTML error pages)
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        if (response.ok && data.success) {
          setSuccess('Booking cancelled successfully!');
          fetchMyBookings();
          fetchAvailableTours(); // Refresh to update capacity
        } else {
          setError(data.message || 'Failed to cancel booking');
        }
      } catch (jsonErr) {
        setError('Network error occurred while cancelling booking');
        console.error('Booking cancellation error:', jsonErr);
      }
    } catch (err) {
      setError('Network error occurred while cancelling booking');
      console.error('Booking cancellation error:', err);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const openBookingDialog = (tour: LabTour) => {
    setSelectedTour(tour);
    setBookingNotes('');
    setIsBookingDialogOpen(true);
  };

  const canBookTour = (tour: LabTour) => {
    return new Date(tour.startDate) > new Date() && !tour.archived;
  };

  const canCancelBooking = (booking: Booking) => {
    return booking.status !== 'CANCELLED' && new Date(booking.tour.startDate) > new Date();
  };

  // Effects
  useEffect(() => {
    fetchAvailableTours();
    fetchMyBookings();
  }, []);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableTours();
    } else {
      fetchMyBookings();
    }
  }, [toursPagination?.page, bookingsPagination?.page, searchTerm, statusFilter]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="pl-0 pr-4 py-4 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lab Tour Bookings</h1>
            <p className="text-gray-600 mt-2">Book lab tours and manage your reservations</p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Available Tours</TabsTrigger>
          <TabsTrigger value="mybookings">My Bookings</TabsTrigger>
        </TabsList>

        {/* Available Tours Tab */}
        <TabsContent value="available" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Tours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search lab tours..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setToursPagination(prev => ({ 
                      total: prev?.total || 0,
                      page: 1,
                      limit: prev?.limit || 6,
                      pages: prev?.pages || 0
                    }));
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Tours Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toursLoading || loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : availableTours.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FlaskConical className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Tours Available</h3>
                <p className="text-gray-600">Check back later for new lab tour opportunities!</p>
              </div>
            ) : (
              availableTours.map((tour) => (
                <Card key={tour._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="text-lg">{tour.title}</span>
                      <Badge className="ml-2">
                        {canBookTour(tour) ? 'Available' : 'Unavailable'}
                      </Badge>
                    </CardTitle>
                    {tour.description && (
                      <CardDescription className="line-clamp-2">
                        {tour.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(tour.startDate)}
                      </div>
                      
                      {tour.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {tour.location}
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        Capacity: {tour.capacity} students
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          className="w-full" 
                          onClick={() => openBookingDialog(tour)}
                          disabled={!canBookTour(tour)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Book Tour
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Tours Pagination */}
          {(toursPagination?.pages || 0) > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setToursPagination(prev => ({ ...prev, page: Math.max(1, (prev?.page || 1) - 1) }))}
                disabled={(toursPagination?.page || 1) <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {toursPagination?.page || 1} of {toursPagination?.pages || 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setToursPagination(prev => ({ ...prev, page: Math.min((toursPagination?.pages || 1), (prev?.page || 1) + 1) }))}
                disabled={(toursPagination?.page || 1) >= (toursPagination?.pages || 1)}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* My Bookings Tab */}
        <TabsContent value="mybookings" className="space-y-4">
          {/* Bookings Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Bookings</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStatusFilter('ALL');
                    setBookingsPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  Clear Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Bookings List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Bookings</CardTitle>
              <CardDescription>
                {bookingsLoading ? 'Loading...' : `${myBookings.length} booking(s) found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : myBookings.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
                  <p className="text-gray-600 mb-4">You haven't booked any lab tours yet.</p>
                  <Button onClick={() => setActiveTab('available')}>
                    Browse Available Tours
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBookings.map((booking) => (
                    <div key={booking._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">{booking.tour.title}</h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          {booking.tour.description && (
                            <p className="text-gray-600 mb-2">{booking.tour.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(booking.tour.startDate)}
                            </div>
                            {booking.tour.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {booking.tour.location}
                              </div>
                            )}
                          </div>
                          
                          {booking.notes && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                              <strong>Notes:</strong> {booking.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          {canCancelBooking(booking) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel your booking for "{booking.tour.title}"? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => cancelBooking(booking._id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Cancel Booking
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bookings Pagination */}
              {bookingsPagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setBookingsPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={bookingsPagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {bookingsPagination.page} of {bookingsPagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setBookingsPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={bookingsPagination.page >= bookingsPagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Lab Tour</DialogTitle>
            <DialogDescription>
              Confirm your booking for this lab tour
            </DialogDescription>
          </DialogHeader>
          {selectedTour && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedTour.title}</h3>
                {selectedTour.description && (
                  <p className="text-gray-600 text-sm mt-1">{selectedTour.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  {formatDate(selectedTour.startDate)}
                </div>
                {selectedTour.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    {selectedTour.location}
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  Capacity: {selectedTour.capacity} students
                </div>
              </div>
              
              <div>
                <Label htmlFor="booking-notes">Notes (optional)</Label>
                <Textarea
                  id="booking-notes"
                  placeholder="Any special requirements or notes..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createBooking} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default StudentBookings;