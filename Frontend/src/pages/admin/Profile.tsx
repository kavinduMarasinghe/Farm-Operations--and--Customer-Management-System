import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { useEffect } from "react";

const Profile = () => {
  const { user } = useAuth();
  const { token: authToken } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8070";
        const tokenToUse = authToken || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null);
        const res = await fetch(`${API_BASE}/api/admin/student/details?page=1&limit=5`, {
          headers: {
            Authorization: tokenToUse ? `Bearer ${tokenToUse}` : "",
            'Content-Type': 'application/json'
          }
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch students');
        }

        setStudents(data.data?.students || []);
      } catch (err: any) {
        console.error('Failed to load students for profile:', err);
        toast.error(err?.message || 'Failed to load students');
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [authToken]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your admin account details.</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-foreground">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              {/* no avatar field on User type; fall back to placeholder */}
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.fullName ? user.fullName.charAt(0) : user?.name ? user.name.charAt(0) : "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{user?.fullName || user?.name || "Unknown User"}</h2>
              <p className="text-sm text-muted-foreground">{user?.role || "Admin"}</p>

              {!editing ? (
                <p className="mt-2 text-sm">{user?.email}</p>
              ) : (
                <div className="space-y-2 w-full">
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Current Password (required to change password)</label>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">New Password</label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Confirm New Password</label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}
            </div>

            <div>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      // client-side validation
                      if (newPassword && newPassword !== confirmPassword) {
                        toast.error("New password and confirmation do not match");
                        return;
                      }

                      // submit update
                      setLoading(true);
                      try {
                        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8070";
                        const res = await fetch(`${API_BASE}/api/admin/auth/profile`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: token ? `Bearer ${token}` : "",
                          },
                          body: JSON.stringify({ email, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
                        });

                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message || "Update failed");

                        // update localStorage user and token
                        if (data.token) localStorage.setItem("authToken", data.token);
                        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

                        toast.success("Profile updated successfully");
                        // simple approach: reload to refresh AuthContext from localStorage
                        setTimeout(() => window.location.reload(), 600);
                      } catch (err: any) {
                        toast.error(err?.message || "Update failed");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students quick list */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-foreground">Students</CardTitle>
          <CardDescription>Quick view of students registered in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="py-4 text-sm text-muted-foreground">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="py-4 text-sm text-muted-foreground">No students found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.slice(0, 5).map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-700">{s.first_name} {s.last_name}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{s.email}</td>
                      <td className="px-3 py-2 text-sm">
                        <Badge className={s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right text-sm">
                        <Button size="sm" variant="outline" onClick={() => toast(`Student: ${s.first_name} ${s.last_name} — ${s.email}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
