import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Moon, Sun, Globe, Hash, Percent, Receipt } from 'lucide-react';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export default function Settings() {
  const { settings, updateSettings, toggleTheme } = useStore();
  const [formData, setFormData] = useState({
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    invoicePrefix: settings.invoicePrefix,
    invoiceSuffix: settings.invoiceSuffix,
    defaultTaxRate: settings.defaultTaxRate,
    defaultPaymentTerms: settings.defaultPaymentTerms,
  });

  const handleCurrencyChange = (code: string) => {
    const currency = currencies.find(c => c.code === code);
    if (currency) {
      setFormData({
        ...formData,
        currency: currency.code,
        currencySymbol: currency.symbol,
      });
    }
  };

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-3xl">
      <PageHeader
        title="Settings"
        description="Configure your invoice generator preferences"
      />

      {/* Appearance */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
            </div>
            <Switch
              checked={settings.theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Currency
          </CardTitle>
          <CardDescription>Set your default currency for invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Numbering */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Invoice Numbering
          </CardTitle>
          <CardDescription>Customize your invoice number format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                placeholder="INV-"
              />
            </div>
            <div className="space-y-2">
              <Label>Suffix</Label>
              <Input
                value={formData.invoiceSuffix}
                onChange={(e) => setFormData({ ...formData, invoiceSuffix: e.target.value })}
                placeholder="-2024"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Example: {formData.invoicePrefix}0001{formData.invoiceSuffix}
          </p>
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Invoice Defaults
          </CardTitle>
          <CardDescription>Set default values for new invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Tax Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select
                value={formData.defaultPaymentTerms}
                onValueChange={(value: 'net7' | 'net15' | 'net30' | 'net60') =>
                  setFormData({ ...formData, defaultPaymentTerms: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net7">Net 7 (7 days)</SelectItem>
                  <SelectItem value="net15">Net 15 (15 days)</SelectItem>
                  <SelectItem value="net30">Net 30 (30 days)</SelectItem>
                  <SelectItem value="net60">Net 60 (60 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full sm:w-auto">
        Save Settings
      </Button>
    </div>
  );
}
