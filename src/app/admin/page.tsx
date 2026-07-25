"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ADMIN_PASSWORD, SCOUT_PRODUCTS } from "@/lib/constants";

type Tab = "scout" | "distributors" | "orders" | "payments" | "analytics" | "progress" | "debugger";

// ---- Types ----
type Supplier = {
  id: number;
  name: string;
  type: string;
  platform: string | null;
  url: string;
  contactEmail: string;
  notes: string;
  niches: string[];
  isActive: boolean;
  autoFulfill: boolean;
};
type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  items: { name: string; quantity: number; price: number }[];
  createdAt: string;
};
type ProgressNote = { id: number; type: string; title: string; content: string; status: string; priority: string; category: string; dueDate: string | null; createdAt: string };
type ScanResult = { scanId: string; status: string; summary: string; issues: string[]; backupCreated: boolean; fixesApplied: number; duration: number; createdAt?: string };
type AnalyticsData = { products: number; orders: number; subscribers: number; revenue: number; nicheBreakdown: { niche: string; product_count: number; total_value: number }[] };
type ScoutProduct = typeof SCOUT_PRODUCTS[number];
type Platform = { id: string; name: string; description: string; logo: string; requiredFields: string[]; niches: string[] };

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("scout");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setAuthed(true);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8"
        >
          <h1 className="font-display text-2xl font-bold text-white text-center">🔐 Engine Room</h1>
          <p className="text-white/50 text-sm text-center mt-2">Enter password to access admin</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-accent font-mono"
            />
            <button type="submit" className="btn-primary w-full">
              Enter
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "scout", label: "AI Scout", icon: "🔍" },
    { id: "distributors", label: "Distributors", icon: "🏭" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "progress", label: "Progress", icon: "📝" },
    { id: "debugger", label: "Debugger", icon: "🔧" },
  ];

  return (
    <div className="min-h-screen bg-obsidian text-white font-mono">
      {/* Top Bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold tracking-wider">NORVANA</span>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded">ENGINE ROOM</span>
        </div>
        <a href="/" className="text-xs text-white/40 hover:text-white transition-colors">
          ← Back to Store
        </a>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-16 md:w-56 border-r border-white/10 min-h-[calc(100vh-57px)] p-3">
          <nav className="space-y-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  tab === t.id
                    ? "bg-indigo-accent text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden md:inline">{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-57px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "scout" && <ScoutTab />}
              {tab === "distributors" && <DistributorsTab />}
              {tab === "orders" && <OrdersTab />}
              {tab === "payments" && <PaymentsTab />}
              {tab === "analytics" && <AnalyticsTab />}
              {tab === "progress" && <ProgressTab />}
              {tab === "debugger" && <DebuggerTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ============ AI SCOUT TAB ============
function ScoutTab() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [recommendations, setRecommendations] = useState<ScoutProduct[]>(SCOUT_PRODUCTS);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setChat((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setChat((prev) => [...prev, { role: "assistant", content: data.response }]);
      setRecommendations(data.recommendations);
    } catch {
      setChat((prev) => [...prev, { role: "assistant", content: "Error connecting to scout." }]);
    }
    setMessage("");
    setLoading(false);
  };

  const handleAddToCatalog = async (product: ScoutProduct) => {
    const slug = product.name.toLowerCase().replace(/\s+/g, "-");
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        slug,
        description: `Trending ${product.category} item with a ${product.margin} profit margin.`,
        price: 39.99,
        niche: product.category.toLowerCase().replace(/\s+/g, "-"),
        volumeNumber: 3,
        tags: [product.category.toLowerCase(), product.badge || "scout"].filter(Boolean),
      }),
    });
    alert(`${product.name} added to catalog!`);
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-6">🔍 AI Scout</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat */}
        <div className="bg-white/5 rounded-xl border border-white/10 flex flex-col h-[500px]">
          <div className="p-4 border-b border-white/10">
            <p className="text-xs text-white/50">Ask about trending products, margins, or bestsellers</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.role === "user" ? "text-indigo-light text-right" : "text-white/70"}`}>
                <span className="text-xs text-white/30 block mb-1">{msg.role === "user" ? "You" : "Scout"}</span>
                {msg.content}
              </div>
            ))}
            {loading && <p className="text-xs text-white/30 animate-pulse">Thinking...</p>}
          </div>
          <div className="p-4 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask the scout..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-accent"
            />
            <button onClick={handleSend} className="px-4 py-2 bg-indigo-accent rounded-lg text-sm hover:bg-indigo-dark transition-colors">
              Send
            </button>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {recommendations.map((product, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{product.name}</span>
                  {product.badge && (
                    <span className={`badge text-xs ${
                      product.badge === "bestseller" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                    }`}>
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                  <span>Score: {product.trendScore}</span>
                  <span>Margin: {product.margin}</span>
                  <span>{product.supplierCount} suppliers</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-accent/20 flex items-center justify-center text-indigo-light font-bold text-sm">
                  {product.trendScore}
                </div>
              </div>
              <button
                onClick={() => handleAddToCatalog(product)}
                className="text-xs text-indigo-light hover:text-white transition-colors shrink-0"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ DISTRIBUTORS TAB ============
function DistributorsTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    name: "", type: "manual", platform: "", url: "", contactEmail: "", notes: "", niches: [] as string[], autoFulfill: false
  });
  const [credentials, setCredentials] = useState({ apiKey: "", apiSecret: "", accessToken: "", shopDomain: "" });
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    const [suppRes, platRes] = await Promise.all([
      fetch("/api/suppliers"),
      fetch("/api/platforms"),
    ]);
    setSuppliers(await suppRes.json());
    setPlatforms(await platRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const niches = ["home-fragrance", "kitchen", "home-decor", "workspace", "art", "garden", "wellness", "bath", "stationery"];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowAddModal(false);
    setForm({ name: "", type: "manual", platform: "", url: "", contactEmail: "", notes: "", niches: [], autoFulfill: false });
    load();
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConnectModal) return;
    setConnectionStatus(null);

    const res = await fetch(`/api/suppliers/${showConnectModal.id}/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (data.connectionTest) {
      setConnectionStatus(data.connectionTest);
    } else {
      setConnectionStatus({ success: true, message: "Credentials saved" });
    }
    load();
  };

  const handleSync = async (supplierId: number) => {
    const res = await fetch(`/api/suppliers/${supplierId}/sync`, { method: "POST" });
    const data = await res.json();
    alert(data.success ? `Synced ${data.synced} products!` : `Sync failed: ${data.error}`);
  };

  const toggleActive = async (supplier: Supplier) => {
    await fetch(`/api/suppliers/${supplier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...supplier, isActive: !supplier.isActive }),
    });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold">🏭 Distributors & Suppliers</h2>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-accent rounded-lg text-sm hover:bg-indigo-dark transition-colors">
          + Add Distributor
        </button>
      </div>

      {/* Platform Grid */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-white/50 mb-3">Supported Platforms</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {platforms.map((p) => (
            <div key={p.id} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
              <span className="text-2xl">{p.logo}</span>
              <p className="text-sm font-semibold mt-2">{p.name}</p>
              <p className="text-xs text-white/40 mt-1 line-clamp-2">{p.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Suppliers */}
      <div className="space-y-3">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{platforms.find(p => p.id === supplier.platform)?.logo || "📋"}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{supplier.name}</span>
                    <span className={`badge text-xs ${supplier.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {supplier.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="badge text-xs bg-white/10 text-white/50">{supplier.type}</span>
                    {supplier.autoFulfill && <span className="badge text-xs bg-indigo-500/20 text-indigo-400">Auto-fulfill</span>}
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {supplier.platform || "Manual"} • {supplier.niches?.length || 0} niches
                    {supplier.url && <> • <a href={supplier.url} target="_blank" rel="noreferrer" className="text-indigo-light hover:underline">{supplier.url}</a></>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {supplier.type !== "manual" && (
                  <>
                    <button onClick={() => { setShowConnectModal(supplier); setCredentials({ apiKey: "", apiSecret: "", accessToken: "", shopDomain: "" }); setConnectionStatus(null); }} className="text-xs px-3 py-1.5 bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors">
                      🔑 Connect
                    </button>
                    <button onClick={() => handleSync(supplier.id)} className="text-xs px-3 py-1.5 bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors">
                      🔄 Sync
                    </button>
                  </>
                )}
                <button onClick={() => toggleActive(supplier)} className="text-xs px-3 py-1.5 bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors">
                  {supplier.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <p className="text-center text-white/30 py-8">No distributors added yet. Add one to get started!</p>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-bold mb-4">Add Distributor</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30" placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-3">
                <select className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="manual">Manual</option>
                  <option value="api">API Connected</option>
                  <option value="dropship">Dropship</option>
                  <option value="wholesale">Wholesale</option>
                </select>
                <select className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                  <option value="">Select Platform</option>
                  {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <input className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30" placeholder="Website URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              <input className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30" placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              <div>
                <label className="text-xs text-white/50 mb-2 block">Niches</label>
                <div className="flex flex-wrap gap-2">
                  {niches.map((n) => (
                    <button key={n} type="button" onClick={() => setForm({ ...form, niches: form.niches.includes(n) ? form.niches.filter(x => x !== n) : [...form.niches, n] })} className={`badge text-xs cursor-pointer ${form.niches.includes(n) ? "bg-indigo-accent text-white" : "bg-white/5 text-white/50"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={form.autoFulfill} onChange={(e) => setForm({ ...form, autoFulfill: e.target.checked })} className="rounded" />
                Auto-fulfill orders (automatically send to supplier)
              </label>
              <textarea className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 min-h-[60px]" placeholder="Notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-accent rounded-lg text-sm hover:bg-indigo-dark transition-colors">Add Distributor</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display text-lg font-bold mb-4">Connect {showConnectModal.name}</h3>
            <form onSubmit={handleConnect} className="space-y-4">
              {showConnectModal.platform === "shopify" && (
                <input className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30" placeholder="Shop Domain (e.g., myshop.myshopify.com)" value={credentials.shopDomain} onChange={(e) => setCredentials({ ...credentials, shopDomain: e.target.value })} />
              )}
              <input className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30" placeholder="API Key" value={credentials.apiKey} onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })} />
              <input type="password" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30" placeholder="API Secret (optional)" value={credentials.apiSecret} onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })} />
              <input className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30" placeholder="Access Token" value={credentials.accessToken} onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })} />
              {connectionStatus && (
                <div className={`p-3 rounded-lg text-sm ${connectionStatus.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {connectionStatus.success ? "✅" : "❌"} {connectionStatus.message}
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-accent rounded-lg text-sm hover:bg-indigo-dark transition-colors">Test & Save</button>
                <button type="button" onClick={() => setShowConnectModal(null)} className="px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ORDERS TAB ============
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/orders");
    setOrders(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const fulfillOrder = async (id: number) => {
    const res = await fetch(`/api/orders/${id}/fulfill`, { method: "POST" });
    const data = await res.json();
    if (data.error) {
      alert(`Fulfillment failed: ${data.error}`);
    } else {
      alert(`Order sent to suppliers!`);
      load();
    }
  };

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
  const revenue = orders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0);
  const paidCount = orders.filter(o => o.paymentStatus === "paid").length;

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-2">📦 Orders</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-light">{orders.length}</p>
          <p className="text-xs text-white/40">Total Orders</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">${revenue.toFixed(2)}</p>
          <p className="text-xs text-white/40">Paid Revenue</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{paidCount}</p>
          <p className="text-xs text-white/40">Paid</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{orders.filter((o) => o.status === "pending").length}</p>
          <p className="text-xs text-white/40">Pending</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "pending", "processing", "shipped", "delivered"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === s ? "bg-indigo-accent text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((o) => (
          <div key={o.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-mono text-sm text-indigo-light">{o.orderNumber}</span>
                <span className="text-xs text-white/40 ml-3">{o.customerName}</span>
                <span className={`ml-3 badge text-xs ${o.paymentStatus === "paid" ? "bg-green-500/20 text-green-400" : o.paymentStatus === "failed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {o.paymentStatus}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">${o.total.toFixed(2)}</span>
                {o.paymentStatus === "paid" && o.status === "processing" && (
                  <button onClick={() => fulfillOrder(o.id)} className="text-xs px-3 py-1.5 bg-indigo-accent/20 text-indigo-light rounded-lg hover:bg-indigo-accent/30 transition-colors">
                    🚀 Fulfill
                  </button>
                )}
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-white/30 text-center py-8">No orders found.</p>}
      </div>
    </div>
  );
}

// ============ PAYMENTS TAB ============
function PaymentsTab() {
  const hasStripe = true; // In production, check process.env.NEXT_PUBLIC_HAS_STRIPE

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-6">💳 Payments & Stripe</h2>

      {/* Stripe Setup Guide */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl">💳</span>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Stripe Integration</h3>
            <p className="text-sm text-white/50 mt-1">Accept credit cards, Apple Pay, Google Pay, and more.</p>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-accent/20 text-indigo-light text-xs font-bold flex items-center justify-center">1</span>
                <p className="text-sm text-white/70">Create a <a href="https://dashboard.stripe.com/register" target="_blank" rel="noreferrer" className="text-indigo-light hover:underline">Stripe account</a></p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-accent/20 text-indigo-light text-xs font-bold flex items-center justify-center">2</span>
                <p className="text-sm text-white/70">Get your API keys from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="text-indigo-light hover:underline">Stripe Dashboard</a></p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-accent/20 text-indigo-light text-xs font-bold flex items-center justify-center">3</span>
                <p className="text-sm text-white/70">Add environment variables:</p>
              </div>
            </div>

            <div className="mt-4 bg-black/30 rounded-lg p-4 font-mono text-xs text-white/70">
              <p className="text-white/40"># Add to .env file:</p>
              <p className="mt-1">STRIPE_SECRET_KEY=sk_live_xxxx</p>
              <p>STRIPE_WEBHOOK_SECRET=whsec_xxxx</p>
              <p>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx</p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-accent/20 text-indigo-light text-xs font-bold flex items-center justify-center">4</span>
              <p className="text-sm text-white/70">Set up webhook endpoint: <code className="bg-black/30 px-1 rounded">/api/webhooks/stripe</code></p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <span className="text-2xl">💵</span>
          <h4 className="font-semibold mt-2">Credit Cards</h4>
          <p className="text-xs text-white/40 mt-1">Visa, Mastercard, Amex, Discover</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <span className="text-2xl">📱</span>
          <h4 className="font-semibold mt-2">Digital Wallets</h4>
          <p className="text-xs text-white/40 mt-1">Apple Pay, Google Pay</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <span className="text-2xl">🔒</span>
          <h4 className="font-semibold mt-2">Secure Checkout</h4>
          <p className="text-xs text-white/40 mt-1">PCI-compliant, 3D Secure</p>
        </div>
      </div>

      {/* Webhook Events */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h3 className="font-semibold mb-4">Webhook Events Handled</h3>
        <div className="space-y-2 text-sm">
          {[
            { event: "checkout.session.completed", desc: "Order marked as paid, begins processing" },
            { event: "payment_intent.succeeded", desc: "Receipt URL captured" },
            { event: "payment_intent.payment_failed", desc: "Order marked as payment failed" },
            { event: "charge.refunded", desc: "Order cancelled, payment marked refunded" },
          ].map((e) => (
            <div key={e.event} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <code className="text-indigo-light text-xs">{e.event}</code>
              <span className="text-xs text-white/40">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ ANALYTICS TAB ============
function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p className="text-white/30 text-sm">Loading analytics...</p>;

  const maxValue = Math.max(...(data.nicheBreakdown?.map((n: AnalyticsData["nicheBreakdown"][0]) => n.total_value) || [1]));

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-6">📊 Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Products", value: data.products, color: "text-indigo-light" },
          { label: "Orders", value: data.orders, color: "text-green-400" },
          { label: "Subscribers", value: data.subscribers, color: "text-yellow-400" },
          { label: "Revenue", value: `$${Number(data.revenue).toFixed(2)}`, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      <h3 className="font-semibold text-sm mb-4">Sales by Niche</h3>
      <div className="space-y-3">
        {data.nicheBreakdown?.map((niche: AnalyticsData["nicheBreakdown"][0]) => (
          <div key={niche.niche} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">{niche.niche}</span>
              <span className="text-xs text-white/40">{niche.product_count} products • ${Number(niche.total_value).toFixed(0)}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-accent rounded-full transition-all" style={{ width: `${(niche.total_value / maxValue) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ PROGRESS TAB ============
function ProgressTab() {
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [form, setForm] = useState({ type: "task", title: "", content: "", priority: "medium", category: "general" });

  const load = useCallback(async () => {
    const res = await fetch("/api/progress");
    setNotes(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ type: "task", title: "", content: "", priority: "medium", category: "general" });
    load();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/progress/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteNote = async (id: number) => {
    await fetch(`/api/progress/${id}`, { method: "DELETE" });
    load();
  };

  const handleExport = (format: string) => {
    window.open(`/api/progress/export?format=${format}`, "_blank");
  };

  const priorityColors: Record<string, string> = { high: "text-red-400", medium: "text-yellow-400", low: "text-green-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold">📝 Progress</h2>
        <div className="flex gap-2">
          <button onClick={() => handleExport("json")} className="text-xs px-3 py-1.5 bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors">Export JSON</button>
          <button onClick={() => handleExport("markdown")} className="text-xs px-3 py-1.5 bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors">Export MD</button>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="task">Task</option>
            <option value="note">Note</option>
            <option value="milestone">Milestone</option>
          </select>
          <select className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <textarea className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none min-h-[60px]" placeholder="Content..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <button type="submit" className="px-4 py-2 bg-indigo-accent rounded-lg text-sm hover:bg-indigo-dark transition-colors">Add Note</button>
      </form>

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase text-white/30">{note.type}</span>
                <span className={`text-xs ${priorityColors[note.priority] || "text-white/40"}`}>● {note.priority}</span>
                <span className="font-semibold text-sm">{note.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <select value={note.status} onChange={(e) => updateStatus(note.id, e.target.value)} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none">
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <button onClick={() => deleteNote(note.id)} className="text-xs text-red-400 hover:text-red-300">✕</button>
              </div>
            </div>
            {note.content && <p className="text-xs text-white/40 mt-2">{note.content}</p>}
          </div>
        ))}
        {notes.length === 0 && <p className="text-sm text-white/30 text-center py-8">No notes yet.</p>}
      </div>
    </div>
  );
}

// ============ DEBUGGER TAB ============
function DebuggerTab() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/debugger/history");
    setHistory(await res.json());
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const runScan = async () => {
    setScanning(true);
    const res = await fetch("/api/debugger/scan", { method: "POST" });
    const data = await res.json();
    setResult(data);
    setScanning(false);
    loadHistory();
  };

  const statusColors: Record<string, string> = { passed: "text-green-400", warnings: "text-yellow-400", errors: "text-red-400" };

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-6">🔧 Self-Healing Debugger</h2>
      <button onClick={runScan} disabled={scanning} className="px-6 py-3 bg-indigo-accent rounded-lg text-sm hover:bg-indigo-dark transition-colors disabled:opacity-50 mb-6">
        {scanning ? "⏳ Scanning..." : "▶ Run Diagnostic Scan"}
      </button>

      {result && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-lg font-bold ${statusColors[result.status]}`}>
              {result.status === "passed" ? "✅" : result.status === "warnings" ? "⚠️" : "❌"} {result.status.toUpperCase()}
            </span>
            <span className="text-xs text-white/30">Scan ID: {result.scanId.slice(0, 8)}</span>
          </div>
          <p className="text-sm text-white/60">{result.summary}</p>
          {result.issues.length > 0 && (
            <ul className="mt-3 space-y-1">
              {result.issues.map((issue, i) => (
                <li key={i} className="text-xs text-yellow-400">• {issue}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-6 mt-4 text-xs text-white/30">
            <span>Duration: {result.duration}ms</span>
            <span>Fixes: {result.fixesApplied}</span>
            <span>Backup: {result.backupCreated ? "Yes" : "No"}</span>
          </div>
        </div>
      )}

      <h3 className="font-semibold text-sm mb-3">Scan History</h3>
      <div className="space-y-2">
        {history.map((scan) => (
          <div key={scan.scanId} className="bg-white/5 rounded-xl border border-white/10 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${statusColors[scan.status]}`}>{scan.status}</span>
              <span className="text-xs text-white/30 font-mono">{scan.scanId.slice(0, 8)}</span>
            </div>
            <span className="text-xs text-white/30">{scan.issues.length} issues • {scan.duration}ms</span>
          </div>
        ))}
        {history.length === 0 && <p className="text-sm text-white/30 text-center py-4">No scans yet.</p>}
      </div>
    </div>
  );
}
