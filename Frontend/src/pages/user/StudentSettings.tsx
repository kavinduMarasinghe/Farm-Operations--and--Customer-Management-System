import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppSidebar } from '@/components/layout/StudentAppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";

const StudentSettings: React.FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const parts = (user.fullName || user.name || '').split(' ');
    setFirstName(parts.shift() || '');
    setLastName(parts.join(' ') || '');
    setEmail(user.email || '');
  }, [user]);

  const handleSave = async () => {
    if (!firstName || !email) {
      toast({ title: 'Validation', description: 'Name and email are required', variant: 'destructive' });
      return;
    }

    // Validate password fields if any password field is filled
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        toast({ title: 'Validation', description: 'Current password is required to change password', variant: 'destructive' });
        return;
      }
      if (!newPassword) {
        toast({ title: 'Validation', description: 'New password is required', variant: 'destructive' });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: 'Validation', description: 'New passwords do not match', variant: 'destructive' });
        return;
      }
      if (newPassword.length < 6) {
        toast({ title: 'Validation', description: 'New password must be at least 6 characters', variant: 'destructive' });
        return;
      }
    }

    if (!token) {
      toast({ title: 'Error', description: 'Authentication required', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      
      console.log('Making PUT request to /api/student/profile');
      console.log('Token available:', !!token);
      
      const requestBody = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        ...(currentPassword && newPassword && {
          currentPassword,
          newPassword
        })
      };
      
      console.log('Request body:', requestBody);

      const response = await fetch('http://localhost:8070/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('Success response:', data);

      // Update localStorage user object with the updated data from server
      const stored = localStorage.getItem('user');
      let storedUser = stored ? JSON.parse(stored) : {};
      const updatedUser = {
        ...storedUser,
        fullName: `${data.student.first_name} ${data.student.last_name}`.trim(),
        name: `${data.student.first_name} ${data.student.last_name}`.trim(),
        email: data.student.email
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast({ title: 'Success', description: 'Profile updated successfully!' });
      
      // Clear password fields after successful update
      if (currentPassword) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error('Failed to save student settings', err);
      toast({ title: 'Error', description: err.message || 'Could not save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-4">
            <div className="max-w-5xl mx-auto">
              {/* Header Section */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
                <p className="text-gray-600 text-sm">Manage your account details and preferences</p>
              </div>

              {/* Main Settings Card */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-800">Profile Settings</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">Update your personal information and security settings</p>
                    </div>
                    <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Personal Information Section */}
                    <div className="space-y-6">
                      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-100 pb-3">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-semibold text-xs">PI</span>
                        </div>
                        Personal Information
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">First Name</Label>
                            <Input 
                              value={firstName} 
                              onChange={(e) => setFirstName(e.target.value)}
                              className="h-9 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                              placeholder="Enter your first name"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Last Name</Label>
                            <Input 
                              value={lastName} 
                              onChange={(e) => setLastName(e.target.value)}
                              className="h-9 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                              placeholder="Enter your last name"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-700">Email Address</Label>
                          <Input 
                            type="email"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-9 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                            placeholder="Enter your email address"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Security Section */}
                    <div className="space-y-6">
                      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-100 pb-3">
                        <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-orange-600 font-semibold text-xs">🔒</span>
                        </div>
                        Security Settings
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-700">Current Password</Label>
                          <Input 
                            type="password" 
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                            className="h-9 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                          <p className="text-xs text-gray-500">Required only if you want to change your password</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">New Password</Label>
                            <Input 
                              type="password" 
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password (min 6 characters)"
                              className="h-9 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Confirm New Password</Label>
                            <Input 
                              type="password" 
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm your new password"
                              className="h-9 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                  
                  {/* Action Buttons */}
                  <div className="border-t border-gray-200 mt-6 pt-4 flex flex-row gap-3 justify-end">
                    <Button 
                      variant="outline"
                      className="px-4 py-2 h-9 text-sm"
                      onClick={() => window.location.reload()}
                    >
                      Reset Changes
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="px-6 py-2 h-9 text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default StudentSettings;
