import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChefHat,
  Clock,
  Download,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  UserCog,
  Users,
  X,
  XCircle,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { useAppAuth } from '../context/AppAuthContext';
import { parseApiJson } from '../lib/api';
import { formatNaira, MEALS } from '../data/meals';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'menu'
  | 'categories'
  | 'customers'
  | 'analytics'
  | 'staff'
  | 'settings';

interface OverviewData {
  metrics: {
    totalOrdersToday: number;
    revenueToday: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  };
  recentOrders: Array<{
    reference: string;
    email: string;
    total_naira: number;
    status: string;
    payment_status: string;
    created_at: string;
  }>;
  popularMeals: Array<{
    mealId: string;
    name: string;
    count: number;
    revenue: number;
  }>;
  databaseConnected: boolean;
}

interface OrderItem {
  meal_id: string;
  name: string;
  unit_price_naira: number;
  quantity: number;
  line_total_naira: number;
}

interface AdminOrder {
  reference: string;
  owner_id: string;
  email: string;
  total_naira: number;
  expected_amount_kobo: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid';
  channel?: string;
  paid_at?: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface AdminMeal {
  id: string;
  name: string;
  category: string;
  short_description: string;
  full_description: string;
  price_naira: number;
  image: string;
  is_available: boolean;
  is_featured: boolean;
}

interface AdminCategory {
  id: string;
  name: string;
  image?: string;
  sort_order: number;
}

interface AdminCustomer {
  userId: string;
  fullName: string | null;
  email: string;
  role: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

interface StaffProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface StaffInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function AdminPortalPage() {
  const { fullName, email, role, hasPermission, getToken, signOut } = useAppAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const [menuItems, setMenuItems] = useState<AdminMeal[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalPaidRevenue: number;
    totalPendingRevenue: number;
    totalOrders: number;
    paidOrders: number;
    averageOrderValue: number;
  } | null>(null);

  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    restaurantName: "Mama's Kitchen",
    currency: 'NGN',
    isOpen: true,
    address: '14 Heritage Lane, Lagos',
    phone: '+234 800 000 0000',
    email: 'hello@mamaskitchen.ng',
  });

  // Modal / Form state for meal creation/editing
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<AdminMeal | null>(null);
  const [mealForm, setMealForm] = useState({
    name: '',
    category: 'Rice Dishes',
    shortDescription: '',
    fullDescription: '',
    priceNaira: 5500,
    image: '/src/assets/images/dish_jollof_chicken_1795202397003.jpg',
    isAvailable: true,
    isFeatured: false,
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/admin/notifications', {
        credentials: 'same-origin',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseApiJson<{ notifications?: NotificationItem[] }>(res);
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch {
      // Ignore background notification poll errors
    }
  }, [getToken]);

  const loadTabData = useCallback(
    async (tab: AdminTab) => {
      setLoadingData(true);
      setErrorBanner(null);
      try {
        const token = await getToken();
        if (!token) throw new Error('Session expired. Please sign in again.');

        if (tab === 'overview') {
          const res = await fetch('/api/admin/overview', {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await parseApiJson<OverviewData>(res);
          setOverview(data);
        } else if (tab === 'orders') {
          const url =
            orderStatusFilter === 'all'
              ? '/api/admin/orders'
              : `/api/admin/orders?status=${orderStatusFilter}`;
          const res = await fetch(url, {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await parseApiJson<{ orders?: AdminOrder[] }>(res);
          setOrders(data.orders || []);
        } else if (tab === 'menu') {
          const res = await fetch('/api/admin/menu', {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await parseApiJson<{ menu?: AdminMeal[] }>(res);
          setMenuItems(data.menu || []);
          const catRes = await fetch('/api/admin/categories', {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          });
          const catData = await parseApiJson<{ categories?: AdminCategory[] }>(catRes);
          setCategories(catData.categories || []);
        } else if (tab === 'categories') {
          const res = await fetch('/api/admin/categories', {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await parseApiJson<{ categories?: AdminCategory[] }>(res);
          setCategories(data.categories || []);
        } else if (tab === 'customers') {
          const res = await fetch('/api/admin/customers', {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await parseApiJson<{ customers?: AdminCustomer[] }>(res);
          setCustomers(data.customers || []);
        } else if (tab === 'analytics') {
          const res = await fetch('/api/admin/analytics', {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await parseApiJson<any>(res);
          setAnalytics(data);
        } else if (tab === 'staff') {
          const res = await fetch('/api/admin/staff', {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await parseApiJson<{
            staff?: StaffProfile[];
            invitations?: StaffInvitation[];
          }>(res);
          setStaffList(data.staff || []);
          setInvitations(data.invitations || []);
        } else if (tab === 'settings') {
          const res = await fetch('/api/admin/settings', {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await parseApiJson<{ settings?: typeof settings }>(res);
          if (data.settings) setSettings(data.settings);
        }
      } catch (err) {
        setErrorBanner(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        setLoadingData(false);
      }
    },
    [getToken, orderStatusFilter]
  );

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    void loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  const handleUpdateOrderStatus = async (reference: string, status: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/admin/orders/${reference}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update order status.');
      }
      await loadTabData('orders');
      if (selectedOrder) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: status as any } : null));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating order.');
    }
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (!token) return;

      const url = editingMeal ? `/api/admin/menu/${editingMeal.id}` : '/api/admin/menu';
      const method = editingMeal ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mealForm),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save meal.');
      }

      setMealModalOpen(false);
      setEditingMeal(null);
      await loadTabData('menu');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving meal.');
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete meal.');
      }
      await loadTabData('menu');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting meal.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category.');
      setNewCategoryName('');
      setCategoryModalOpen(false);
      await loadTabData('categories');
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Error creating category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category.');
      await loadTabData('categories');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting category.');
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/admin/staff/invitations', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newInviteEmail, role: 'staff' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send staff invitation.');
      setNewInviteEmail('');
      await loadTabData('staff');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Error inviting staff.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error('Failed to save settings.');
      alert('Restaurant settings saved successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving settings.');
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col md:flex-row">
      {/* Persistent Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#143628] text-[#FAF7F2] shrink-0 border-r border-white/10">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-white">
            Mama&apos;s Kitchen
          </Link>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 px-4 py-6 space-y-1.5">
          {[
            { key: 'overview', label: 'Overview', icon: LayoutDashboard },
            { key: 'orders', label: 'Orders', icon: ShoppingBag },
            { key: 'menu', label: 'Menu Management', icon: ChefHat },
            { key: 'categories', label: 'Categories', icon: FolderTree },
            { key: 'customers', label: 'Customers', icon: Users },
            { key: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
            { key: 'staff', label: 'Staff Management', icon: UserCog, ownerOnly: true },
            { key: 'settings', label: 'Settings', icon: SettingsIcon, ownerOnly: true },
          ].map((item) => {
            if (item.ownerOnly && role !== 'owner') return null;
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key as AdminTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-[#FAF7F2]/80 hover:text-white hover:bg-white/8'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#C05621] text-white flex items-center justify-center font-bold text-xs">
              {(fullName || email || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{fullName || 'Admin User'}</p>
              <p className="text-xs text-[#FAF7F2]/60 capitalize">{role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-[#FFFFFF] border-b border-[#1C1917]/10 h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg text-[#1C1917] hover:bg-[#F3EEE6]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-[#1C1917] capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                aria-label="Toggle notifications"
                className="relative p-2.5 rounded-lg border border-[#1C1917]/15 text-[#1C1917] hover:bg-[#F3EEE6] transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C05621] text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFFFF] rounded-xl border border-[#1C1917]/15 shadow-xl py-3 z-50">
                  <div className="px-4 pb-2 border-b border-[#1C1917]/10 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#1C1917]">Notifications</h3>
                    <span className="text-xs text-[#57534E]">{notifications.length} recent</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#1C1917]/8">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-[#57534E]">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-[#FAF7F2] transition-colors">
                          <p className="text-xs font-semibold text-[#1C1917]">{n.title}</p>
                          <p className="text-xs text-[#57534E] mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-[#57534E]/75 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#1C1917] hover:bg-[#F3EEE6] transition-colors"
            >
              <Store className="w-4 h-4" />
              <span>Storefront</span>
            </Link>

            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="p-2.5 rounded-lg border border-[#1C1917]/15 text-[#B91C1C] hover:bg-[#B91C1C]/8 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#143628] text-[#FAF7F2] px-4 py-4 space-y-2 border-b border-white/10 z-40">
            {[
              { key: 'overview', label: 'Overview', icon: LayoutDashboard },
              { key: 'orders', label: 'Orders', icon: ShoppingBag },
              { key: 'menu', label: 'Menu Management', icon: ChefHat },
              { key: 'categories', label: 'Categories', icon: FolderTree },
              { key: 'customers', label: 'Customers', icon: Users },
              { key: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
              { key: 'staff', label: 'Staff Management', icon: UserCog, ownerOnly: true },
              { key: 'settings', label: 'Settings', icon: SettingsIcon, ownerOnly: true },
            ].map((item) => {
              if (item.ownerOnly && role !== 'owner') return null;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.key as AdminTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                    activeTab === item.key ? 'bg-white/15 text-white' : 'text-[#FAF7F2]/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 overflow-y-auto">
          {errorBanner && (
            <div className="p-4 rounded-xl bg-[#B91C1C]/10 border border-[#B91C1C]/20 text-sm text-[#B91C1C] flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{errorBanner}</p>
            </div>
          )}

          {/* ================= 1. OVERVIEW TAB ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: "Today's Orders",
                    value: overview?.metrics.totalOrdersToday ?? 0,
                    icon: ShoppingBag,
                  },
                  {
                    label: "Today's Revenue",
                    value: formatNaira(overview?.metrics.revenueToday ?? 0),
                    icon: BarChart3,
                  },
                  {
                    label: 'Pending Orders',
                    value: overview?.metrics.pendingOrders ?? 0,
                    icon: Clock,
                  },
                  {
                    label: 'Completed',
                    value: overview?.metrics.completedOrders ?? 0,
                    icon: CheckCircle2,
                  },
                  {
                    label: 'Cancelled',
                    value: overview?.metrics.cancelledOrders ?? 0,
                    icon: XCircle,
                  },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                          {stat.label}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#143628]/8 text-[#143628] flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="tabular-nums font-display text-2xl font-semibold text-[#1C1917]">
                        {stat.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions & Popular Meals */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-8 bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                      Recent Orders
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-medium text-[#143628] hover:underline"
                    >
                      View All Orders
                    </button>
                  </div>

                  <div className="divide-y divide-[#1C1917]/8">
                    {!overview?.recentOrders || overview.recentOrders.length === 0 ? (
                      <p className="py-8 text-center text-sm text-[#57534E]">
                        No orders recorded yet. When customers checkout via Paystack, orders appear here
                        instantly.
                      </p>
                    ) : (
                      overview.recentOrders.map((ord) => (
                        <div key={ord.reference} className="py-3.5 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-[#1C1917]">{ord.reference}</p>
                            <p className="text-xs text-[#57534E] truncate max-w-xs">{ord.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="tabular-nums text-sm font-semibold text-[#143628]">
                              {formatNaira(ord.total_naira)}
                            </p>
                            <span
                              className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                                ord.status === 'completed'
                                  ? 'bg-[#143628]/10 text-[#143628]'
                                  : ord.status === 'confirmed'
                                  ? 'bg-[#C05621]/10 text-[#C05621]'
                                  : 'bg-[#1C1917]/8 text-[#57534E]'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Popular Meals & Quick Actions */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-6 space-y-4">
                    <h2 className="font-display text-lg font-semibold text-[#1C1917]">
                      Popular Dishes
                    </h2>
                    <div className="space-y-3">
                      {!overview?.popularMeals || overview.popularMeals.length === 0 ? (
                        <p className="text-xs text-[#57534E]">No item order data yet.</p>
                      ) : (
                        overview.popularMeals.map((meal) => (
                          <div key={meal.mealId} className="flex items-center justify-between text-sm">
                            <span className="text-[#1C1917] truncate max-w-[180px]">
                              {meal.name}
                            </span>
                            <span className="tabular-nums font-semibold text-[#143628]">
                              {meal.count} ordered
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-[#143628] text-[#FAF7F2] rounded-xl p-6 space-y-4">
                    <h3 className="font-display text-lg font-semibold">Quick Menu Action</h3>
                    <p className="text-xs text-[#FAF7F2]/80 leading-relaxed">
                      Need to add a new seasonal Nigerian delicacy or adjust prices?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMeal(null);
                        setMealForm({
                          name: '',
                          category: 'Rice Dishes',
                          shortDescription: '',
                          fullDescription: '',
                          priceNaira: 5500,
                          image: '/src/assets/images/dish_jollof_chicken_1795202397003.jpg',
                          isAvailable: true,
                          isFeatured: false,
                        });
                        setMealModalOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#C05621] hover:bg-[#9C4217] text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Menu Item</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. ORDERS TAB ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                          orderStatusFilter === st
                            ? 'bg-[#143628] text-white'
                            : 'bg-[#FFFFFF] text-[#57534E] border border-[#1C1917]/10 hover:bg-[#F3EEE6]'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FAF7F2] border-b border-[#1C1917]/10 text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                        <th className="py-3.5 px-4">Order Ref</th>
                        <th className="py-3.5 px-4">Customer Email</th>
                        <th className="py-3.5 px-4">Total</th>
                        <th className="py-3.5 px-4">Payment</th>
                        <th className="py-3.5 px-4">Order Status</th>
                        <th className="py-3.5 px-4">Time</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1917]/8">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-sm text-[#57534E]">
                            No orders found matching this filter.
                          </td>
                        </tr>
                      ) : (
                        orders.map((ord) => (
                          <tr key={ord.reference} className="hover:bg-[#FAF7F2]/60 transition-colors">
                            <td className="py-4 px-4 font-mono font-semibold text-[#1C1917]">
                              {ord.reference}
                            </td>
                            <td className="py-4 px-4 text-[#57534E]">{ord.email}</td>
                            <td className="py-4 px-4 tabular-nums font-semibold text-[#143628]">
                              {formatNaira(ord.total_naira)}
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  ord.payment_status === 'paid'
                                    ? 'bg-[#16A34A]/10 text-[#16A34A]'
                                    : 'bg-[#D97706]/10 text-[#D97706]'
                                }`}
                              >
                                {ord.payment_status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  void handleUpdateOrderStatus(ord.reference, e.target.value)
                                }
                                className="text-xs font-semibold bg-[#FAF7F2] border border-[#1C1917]/15 rounded-md px-2 py-1 text-[#1C1917] cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="ready">Ready</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-4 px-4 text-xs text-[#57534E]">
                              {new Date(ord.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(ord)}
                                className="px-3 py-1.5 rounded-lg bg-[#143628]/8 text-[#143628] hover:bg-[#143628]/15 text-xs font-medium transition-colors cursor-pointer"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. MENU MANAGEMENT TAB ================= */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                  Menu Catalog ({menuItems.length} dishes)
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMeal(null);
                    setMealForm({
                      name: '',
                      category: 'Rice Dishes',
                      shortDescription: '',
                      fullDescription: '',
                      priceNaira: 5500,
                      image: '/src/assets/images/dish_jollof_chicken_1795202397003.jpg',
                      isAvailable: true,
                      isFeatured: false,
                    });
                    setMealModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#143628] text-white text-sm font-medium hover:bg-[#1D4B38] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Dish</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((meal) => (
                  <div
                    key={meal.id}
                    className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-[#F3EEE6] relative overflow-hidden">
                        <img
                          src={meal.image}
                          alt={meal.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow ${
                              meal.is_available ? 'bg-[#16A34A] text-white' : 'bg-[#B91C1C] text-white'
                            }`}
                          >
                            {meal.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 space-y-2">
                        <p className="text-xs font-semibold text-[#C05621] uppercase tracking-wider">
                          {meal.category}
                        </p>
                        <h3 className="font-display text-lg font-semibold text-[#1C1917]">
                          {meal.name}
                        </h3>
                        <p className="text-xs text-[#57534E] line-clamp-2">
                          {meal.short_description}
                        </p>
                        <p className="tabular-nums font-display text-lg font-semibold text-[#143628] pt-1">
                          {formatNaira(meal.price_naira)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border-t border-[#1C1917]/8 flex items-center justify-end gap-2 bg-[#FAF7F2]/50">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMeal(meal);
                          setMealForm({
                            name: meal.name,
                            category: meal.category,
                            shortDescription: meal.short_description,
                            fullDescription: meal.full_description,
                            priceNaira: meal.price_naira,
                            image: meal.image,
                            isAvailable: meal.is_available,
                            isFeatured: meal.is_featured,
                          });
                          setMealModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1C1917]/15 text-xs font-medium text-[#1C1917] hover:bg-[#F3EEE6] cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteMeal(meal.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B91C1C]/20 text-xs font-medium text-[#B91C1C] hover:bg-[#B91C1C]/8 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 4. CATEGORIES TAB ================= */}
          {activeTab === 'categories' && (
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                  Menu Categories ({categories.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#143628] text-white text-sm font-medium hover:bg-[#1D4B38] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 divide-y divide-[#1C1917]/8">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-base font-semibold text-[#1C1917]">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#57534E]">ID: {cat.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCategory(cat.id)}
                      className="p-2 rounded-lg text-[#57534E] hover:text-[#B91C1C] hover:bg-[#B91C1C]/8 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 5. CUSTOMERS TAB ================= */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                Customer Directory ({customers.length})
              </h2>

              <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-[#1C1917]/10 text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Orders Placed</th>
                      <th className="py-3.5 px-4">Total Spent</th>
                      <th className="py-3.5 px-4">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1917]/8">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-sm text-[#57534E]">
                          No customer records found.
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => (
                        <tr key={c.userId} className="hover:bg-[#FAF7F2]/60 transition-colors">
                          <td className="py-4 px-4 font-semibold text-[#1C1917]">
                            {c.fullName || 'Guest User'}
                          </td>
                          <td className="py-4 px-4 text-[#57534E]">{c.email}</td>
                          <td className="py-4 px-4 tabular-nums font-semibold">{c.orderCount}</td>
                          <td className="py-4 px-4 tabular-nums font-semibold text-[#143628]">
                            {formatNaira(c.totalSpent)}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs uppercase font-semibold text-[#C05621]">
                              {c.role}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 6. ANALYTICS TAB ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: 'Total Paid Revenue',
                    value: formatNaira(analytics?.totalPaidRevenue ?? 0),
                  },
                  {
                    label: 'Pending Revenue',
                    value: formatNaira(analytics?.totalPendingRevenue ?? 0),
                  },
                  { label: 'Total Orders', value: analytics?.totalOrders ?? 0 },
                  { label: 'Average Order Value', value: formatNaira(analytics?.averageOrderValue ?? 0) },
                ].map((card, i) => (
                  <div key={i} className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-6 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                      {card.label}
                    </p>
                    <p className="tabular-nums font-display text-3xl font-semibold text-[#143628]">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-6 space-y-4">
                <h3 className="font-display text-lg font-semibold text-[#1C1917]">
                  Export Financial Reports
                </h3>
                <p className="text-sm text-[#57534E]">
                  Download complete verified transaction and order revenue records as a CSV export.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const csv = 'Reference,Email,TotalNaira,PaymentStatus,Status,Date\n' +
                      orders.map(o => `${o.reference},${o.email},${o.total_naira},${o.payment_status},${o.status},${o.created_at}`).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mamas_kitchen_orders_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#143628] text-white text-sm font-medium hover:bg-[#1D4B38] transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Orders CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= 7. STAFF TAB ================= */}
          {activeTab === 'staff' && role === 'owner' && (
            <div className="space-y-8">
              <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-6 space-y-4">
                <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                  Invite New Staff Member
                </h2>
                <form onSubmit={handleInviteStaff} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="staff@mamaskitchen.ng"
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917] focus:outline-none focus:border-[#143628]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    Send Invitation
                  </button>
                </form>
                {inviteError && <p className="text-xs text-[#B91C1C]">{inviteError}</p>}
              </div>

              <div className="space-y-4">
                <h3 className="font-display text-lg font-semibold text-[#1C1917]">
                  Active Staff &amp; Owners
                </h3>
                <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 divide-y divide-[#1C1917]/8">
                  {staffList.map((st) => (
                    <div key={st.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-display text-base font-semibold text-[#1C1917]">
                          {st.full_name || 'Staff Member'}
                        </h4>
                        <p className="text-xs text-[#57534E]">{st.email}</p>
                      </div>
                      <span className="text-xs uppercase font-semibold px-2.5 py-1 rounded bg-[#143628]/10 text-[#143628]">
                        {st.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {invitations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold text-[#1C1917]">
                    Pending Invitations
                  </h3>
                  <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 divide-y divide-[#1C1917]/8">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[#1C1917]">{inv.email}</p>
                          <p className="text-xs text-[#57534E]">Role: {inv.role} (Pending sign-in)</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#D97706]/10 text-[#D97706]">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 8. SETTINGS TAB ================= */}
          {activeTab === 'settings' && role === 'owner' && (
            <div className="max-w-2xl bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-6 sm:p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                Restaurant Settings
              </h2>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={settings.restaurantName}
                    onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917]"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/15 max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1C1917]/10">
              <div>
                <p className="text-xs font-semibold text-[#C05621]">Order Details</p>
                <h3 className="font-display text-xl font-semibold text-[#1C1917]">
                  {selectedOrder.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-[#57534E] hover:text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-[#57534E]">Customer: <strong className="text-[#1C1917]">{selectedOrder.email}</strong></p>
              <p className="text-[#57534E]">Status: <strong className="text-[#143628] uppercase">{selectedOrder.status}</strong></p>
              <p className="text-[#57534E]">Payment: <strong className="text-[#143628] uppercase">{selectedOrder.payment_status}</strong></p>

              <div className="border-t border-[#1C1917]/10 pt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">Ordered Items</p>
                {selectedOrder.order_items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{item.quantity} × {item.name}</span>
                    <span className="tabular-nums font-medium">{formatNaira(item.line_total_naira)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#1C1917]/10 pt-3 flex justify-between font-semibold text-base">
                <span>Total Amount</span>
                <span className="tabular-nums text-[#143628]">{formatNaira(selectedOrder.total_naira)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#1C1917] hover:bg-[#F3EEE6] transition-colors cursor-pointer"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-lg bg-[#143628] text-white text-sm font-medium hover:bg-[#1D4B38] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MEAL CREATE/EDIT MODAL ================= */}
      {mealModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/15 max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1C1917]/10">
              <h3 className="font-display text-xl font-semibold text-[#1C1917]">
                {editingMeal ? 'Edit Menu Dish' : 'Add New Menu Dish'}
              </h3>
              <button
                type="button"
                onClick={() => setMealModalOpen(false)}
                className="p-1 rounded-lg text-[#57534E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  required
                  value={mealForm.name}
                  onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                    Category
                  </label>
                  <select
                    value={mealForm.category}
                    onChange={(e) => setMealForm({ ...mealForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917]"
                  >
                    <option value="Rice Dishes">Rice Dishes</option>
                    <option value="Swallow and Soups">Swallow and Soups</option>
                    <option value="Other Nigerian Specials">Other Nigerian Specials</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                    Price (₦ NGN)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    value={mealForm.priceNaira}
                    onChange={(e) => setMealForm({ ...mealForm, priceNaira: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  required
                  value={mealForm.shortDescription}
                  onChange={(e) => setMealForm({ ...mealForm, shortDescription: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                  Image Path / URL
                </label>
                <input
                  type="text"
                  required
                  value={mealForm.image}
                  onChange={(e) => setMealForm({ ...mealForm, image: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm text-[#1C1917]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                  <input
                    type="checkbox"
                    checked={mealForm.isAvailable}
                    onChange={(e) => setMealForm({ ...mealForm, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded border-[#1C1917]/20 text-[#143628]"
                  />
                  <span>Available on Menu</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMealModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#1C1917] hover:bg-[#F3EEE6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#143628] text-white text-sm font-medium hover:bg-[#1D4B38]"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CATEGORY CREATE MODAL ================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/15 max-w-sm w-full p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-[#1C1917]">Add New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#1C1917]/20 bg-[#FAF7F2] text-sm"
              />
              {categoryError && <p className="text-xs text-[#B91C1C]">{categoryError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#143628] text-white text-xs font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
