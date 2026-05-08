import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Save,
  ClipboardList, ShoppingCart, MessageCircle, Home, LogOut, Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
}

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Initialize profile with logged-in user's data
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    bio: '',
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [approvedRefunds, setApprovedRefunds] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponsDialog, setShowCouponsDialog] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Use actual customer ID from auth context
  const CUSTOMER_ID = user?.id;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    if (!CUSTOMER_ID) return;
    
    try {
      setIsLoadingProfile(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
      const response = await fetch(`${API_BASE}/api/customers/${CUSTOMER_ID}`);
      const json = await response.json();
      
      if (json.success && json.data) {
        setProfile({
          name: json.data.fullName || user?.fullName || user?.name || '',
          email: json.data.email || user?.email || '',
          phone: json.data.phone || '',
          address: json.data.address || '',
          bio: json.data.bio || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Keep the profile data from auth context if backend fetch fails
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchApprovedRefunds = async () => {
    if (!CUSTOMER_ID) return;
    
    try {
      setLoadingCoupons(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
      // Use availableOnly=true to get only unused approved refunds
      const response = await fetch(`${API_BASE}/api/refunds/customer/${CUSTOMER_ID}?availableOnly=true`);
      const json = await response.json();
      
      if (json.success && Array.isArray(json.data)) {
        setApprovedRefunds(json.data);
      }
    } catch (error) {
      console.error('Error fetching approved refunds:', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchApprovedRefunds();
    }
  }, [user]);

  // Update profile state when user changes
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.fullName || user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.name || !profile.email) {
      toast({
        title: "Missing Information",
        description: "Name and email are required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!CUSTOMER_ID) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
      const response = await fetch(`${API_BASE}/api/customers/${CUSTOMER_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          bio: profile.bio,
        }),
      });

      const json = await response.json();

      if (json.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been successfully updated.",
        });
      } else {
        throw new Error(json.message || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/"); // back to login page
  };

  return (
    <div className="min-h-screen bg-gradient-nature">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-4">My Profile</h1>
            <p className="text-lg text-muted-foreground">
              Manage your personal information and account settings
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        placeholder="Enter your email"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
                      <Textarea
                        id="address"
                        value={profile.address}
                        onChange={(e) => handleProfileChange('address', e.target.value)}
                        placeholder="Enter your address"
                        className="pl-10"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio (Optional)</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      placeholder="Tell us a bit about yourself"
                      rows={3}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? (
                      'Updating...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Profile
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* My Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  My Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Actions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center justify-start p-4 h-auto hover:bg-primary/5 transition-colors"
                      onClick={() => navigate('/orders')}
                    >
                      <ClipboardList className="h-5 w-5 mr-3 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">My Orders</div>
                        <div className="text-xs text-muted-foreground">View order history</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex items-center justify-start p-4 h-auto hover:bg-primary/5 transition-colors"
                      onClick={() => navigate('/cart')}
                    >
                      <ShoppingCart className="h-5 w-5 mr-3 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">My Cart</div>
                        <div className="text-xs text-muted-foreground">View saved items</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex items-center justify-start p-4 h-auto hover:bg-primary/5 transition-colors relative"
                      onClick={() => setShowCouponsDialog(true)}
                    >
                      <Ticket className="h-5 w-5 mr-3 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Coupons</div>
                        <div className="text-xs text-muted-foreground">
                          {loadingCoupons ? 'Loading...' : `${approvedRefunds.length} available`}
                        </div>
                      </div>
                      {approvedRefunds.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {approvedRefunds.length}
                        </div>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="flex items-center justify-start p-4 h-auto hover:bg-primary/5 transition-colors"
                      onClick={() => navigate('/feedback')}
                    >
                      <MessageCircle className="h-5 w-5 mr-3 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">My Feedback</div>
                        <div className="text-xs text-muted-foreground">Manage reviews</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex items-center justify-start p-4 h-auto hover:bg-primary/5 transition-colors"
                      onClick={() => navigate('/my-bookings')}
                    >
                      <Home className="h-5 w-5 mr-3 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Cottage Bookings</div>
                        <div className="text-xs text-muted-foreground">View reservations</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Account Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Account Information
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-primary">Member Since</div>
                        <div className="text-sm text-muted-foreground">March 2024</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-primary">Account Status</div>
                        <div className="text-sm text-green-600 font-medium">Active</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium hover:bg-destructive/90 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Coupons Dialog */}
      <Dialog open={showCouponsDialog} onOpenChange={setShowCouponsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Your Refund Coupons
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {loadingCoupons ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading coupons...</div>
              </div>
            ) : approvedRefunds.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <div className="text-lg font-medium text-muted-foreground">No Coupons Available</div>
                <div className="text-sm text-muted-foreground">You don't have any refund coupons at the moment.</div>
              </div>
            ) : (
              approvedRefunds.map((refund) => (
                <Card key={refund._id} className="border-2 border-dashed border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Ticket className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-primary">Refund Coupon</div>
                          <div className="text-sm text-muted-foreground">
                            Approved on {new Date(refund.processedAt || refund.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">Rs. {refund.amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Credit Amount</div>
                      </div>
                    </div>
                    
                    {refund.adminResponse && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm font-medium mb-1">Admin Note:</div>
                        <div className="text-sm text-muted-foreground">{refund.adminResponse}</div>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-dashed">
                      <div className="text-xs text-muted-foreground">
                        Order ID: {refund.orderId?._id?.substring(0, 8) || 'N/A'}... • 
                        Status: <span className="text-green-600 font-medium">Approved</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
