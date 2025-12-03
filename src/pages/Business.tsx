import { useState } from 'react';
import { Plus, Building2, Pencil, Trash2, Check, Upload } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Business } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function BusinessPage() {
  const { businesses, currentBusinessId, addBusiness, updateBusiness, deleteBusiness, setCurrentBusiness } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxId: '',
    logo: '',
    signature: '',
    accentColor: '#3b82f6',
    font: 'inter' as 'inter' | 'roboto' | 'poppins',
    footerText: 'Thank you for your business!',
  });

  const handleOpenDialog = (business?: Business) => {
    if (business) {
      setEditingBusiness(business);
      setFormData({
        name: business.name,
        email: business.email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        country: business.country,
        taxId: business.taxId,
        logo: business.logo || '',
        signature: business.signature || '',
        accentColor: business.accentColor,
        font: business.font,
        footerText: business.footerText,
      });
    } else {
      setEditingBusiness(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        taxId: '',
        logo: '',
        signature: '',
        accentColor: '#3b82f6',
        font: 'inter',
        footerText: 'Thank you for your business!',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingBusiness) {
      updateBusiness(editingBusiness.id, formData);
      toast.success('Business updated successfully');
    } else {
      addBusiness(formData);
      toast.success('Business added successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (businesses.length === 1) {
      toast.error('You must have at least one business profile');
      return;
    }
    deleteBusiness(id);
    toast.success('Business deleted');
  };

  const handleFileUpload = (field: 'logo' | 'signature', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData({ ...formData, [field]: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Business Profiles"
        description="Manage your company information"
        action={
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Business
          </Button>
        }
      />

      {businesses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No business profiles"
          description="Add your first business profile to start creating invoices"
          action={{
            label: 'Add Business',
            onClick: () => handleOpenDialog(),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businesses.map(business => (
            <Card
              key={business.id}
              className={cn(
                "shadow-card hover:shadow-lg transition-all cursor-pointer",
                currentBusinessId === business.id && "ring-2 ring-primary"
              )}
              onClick={() => setCurrentBusiness(business.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {business.logo ? (
                      <img
                        src={business.logo}
                        alt={business.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: business.accentColor + '20' }}
                      >
                        <Building2 className="w-7 h-7" style={{ color: business.accentColor }} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{business.name}</h3>
                        {currentBusinessId === business.id && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{business.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(business);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(business.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{business.address}</p>
                  <p>{business.city}, {business.country}</p>
                  <p>{business.phone}</p>
                  {business.taxId && <p>Tax ID: {business.taxId}</p>}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: business.accentColor }}
                    />
                    <span className="text-xs text-muted-foreground">Accent</span>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    Font: {business.font}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBusiness ? 'Edit Business' : 'Add New Business'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('logo', e.target.files[0])}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hello@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Business Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York, NY 10001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="United States"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="font">Font</Label>
                <Select
                  value={formData.font}
                  onValueChange={(value) =>
                    setFormData({ ...formData, font: value as 'inter' | 'roboto' | 'poppins' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="poppins">Poppins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Signature Upload */}
            <div className="space-y-2">
              <Label>Digital Signature</Label>
              <div className="flex items-center gap-4">
                {formData.signature ? (
                  <img src={formData.signature} alt="Signature" className="h-12 object-contain" />
                ) : (
                  <div className="h-12 px-4 rounded-lg bg-muted flex items-center">
                    <span className="text-sm text-muted-foreground">No signature</span>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="signature-upload"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('signature', e.target.files[0])}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="signature-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Signature
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Textarea
                id="footerText"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                placeholder="Thank you for your business!"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingBusiness ? 'Update' : 'Add'} Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
