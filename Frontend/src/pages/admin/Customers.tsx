import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { useRef } from 'react';

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
      const res = await fetch(`${API_BASE}/api/customers`);
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) setCustomers(json.data);
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  };

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
        <p className="text-muted-foreground">View and manage customers and their information.</p>
      </div>

      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead> Name </TableHead>
                  <TableHead> Email </TableHead>
                  <TableHead> Phone </TableHead>
                  <TableHead> Status </TableHead>
                  <TableHead> Actions </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.name || c.fullName || "-"}</TableCell>
                    <TableCell>{c.email || "-"}</TableCell>
                    <TableCell>{c.phone || "-"}</TableCell>
                    <TableCell>
                      {c.active ? <Badge variant="default">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCustomer(c);
                            setIsEditOpen(true);
                            // small delay to allow dialog to open then focus
                            setTimeout(() => nameRef.current?.focus(), 50);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>

          {editingCustomer && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input ref={nameRef} defaultValue={editingCustomer.name || editingCustomer.fullName || ''} />
              </div>
              <div>
                <Label>Email</Label>
                <Input ref={emailRef} defaultValue={editingCustomer.email || ''} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input ref={phoneRef} defaultValue={editingCustomer.phone || ''} />
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={saving}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!editingCustomer) return;
                  const updated = {
                    fullName: nameRef.current?.value || '',
                    email: emailRef.current?.value || '',
                    phone: phoneRef.current?.value || ''
                  };

                  try {
                    setSaving(true);
                    const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "") : "http://localhost:8070";
                    const res = await fetch(`${API_BASE}/api/customers/${editingCustomer._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updated)
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      const msg = json?.message || json?.error || 'Failed to update customer';
                      throw new Error(msg);
                    }

                    // update local list with returned data (controller returns updated doc)
                    setCustomers(prev => prev.map(p => p._id === editingCustomer._id ? json.data : p));
                    toast.success('Customer updated');
                    setIsEditOpen(false);
                    setEditingCustomer(null);
                    // refresh list to sync any server-side changes
                    fetchCustomers();
                  } catch (err: any) {
                    console.error('Update customer failed', err);
                    toast.error(err?.message || 'Failed to update customer');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
