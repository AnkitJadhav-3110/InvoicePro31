import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Users,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatCard } from '@/components/ui/stat-card';
import { UpcomingRecurringWidget } from '@/components/dashboard/UpcomingRecurringWidget';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { invoices, clients, settings } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const monthlyRevenue = paidInvoices
      .filter(i => {
        const date = new Date(i.createdAt);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      })
      .reduce((sum, i) => sum + i.total, 0);

    const outstandingPayments = unpaidInvoices.reduce((sum, i) => sum + i.total, 0);

    // Monthly data for chart
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(thisYear, thisMonth - 5 + i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthInvoices = paidInvoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
      });
      return {
        month: monthName,
        revenue: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
        count: monthInvoices.length,
      };
    });

    // Top clients
    const clientRevenue = new Map<string, number>();
    paidInvoices.forEach(inv => {
      const current = clientRevenue.get(inv.clientId) || 0;
      clientRevenue.set(inv.clientId, current + inv.total);
    });
    
    const topClients = Array.from(clientRevenue.entries())
      .map(([clientId, revenue]) => ({
        client: clients.find(c => c.id === clientId),
        revenue,
      }))
      .filter(item => item.client)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      monthlyRevenue,
      outstandingPayments,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      overdueCount: overdueInvoices.length,
      totalInvoices: invoices.length,
      monthlyData,
      topClients,
    };
  }, [invoices, clients]);

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [invoices]);

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      sent: 'secondary',
      draft: 'outline',
      overdue: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <PageHeader
        title="Dashboard"
        description="Overview of your invoicing activity"
        action={
          <Button asChild className="gap-2">
            <Link to="/invoices/create">
              <Plus className="w-4 h-4" />
              New Invoice
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="All time"
          icon={DollarSign}
          variant="primary"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstandingPayments)}
          subtitle={`${stats.unpaidCount} invoices`}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Paid Invoices"
          value={stats.paidCount}
          subtitle="This period"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          subtitle={`${stats.overdueCount} overdue`}
          icon={FileText}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Count Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Invoices per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/invoices/history')} className="gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No invoices yet</p>
              ) : (
                recentInvoices.map(invoice => {
                  const client = clients.find(c => c.id === invoice.clientId);
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">{client?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(invoice.total)}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Top Clients
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} className="gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No client data yet</p>
              ) : (
                stats.topClients.map(({ client, revenue }, index) => (
                  <div
                    key={client!.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client!.name}</p>
                        <p className="text-xs text-muted-foreground">{client!.email}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-sm">{formatCurrency(revenue)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recurring & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingRecurringWidget />
        <RecentActivityWidget />
      </div>
    </div>
  );
}
