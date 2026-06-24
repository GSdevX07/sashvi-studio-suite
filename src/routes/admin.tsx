import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Gem, Layers, Star, Image as ImageIcon, Sparkles, ShoppingBag,
  Users, MessageSquare, Instagram, Tag, Settings, TrendingUp, TrendingDown, IndianRupee,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { PRODUCTS, formatINR } from "@/lib/products";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Sashvi Studio" }] }),
  component: Admin,
});

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Saree Catalog", icon: Package },
  { label: "Jewellery Catalog", icon: Gem },
  { label: "Combos", icon: Layers },
  { label: "Saree Styles", icon: Sparkles },
  { label: "Jewellery Styles", icon: Sparkles },
  { label: "Orders Registry", icon: ShoppingBag },
  { label: "Customer List", icon: Users },
  { label: "Buyer Reviews", icon: MessageSquare },
  { label: "Instagram Feed", icon: Instagram },
  { label: "Hero Banners", icon: ImageIcon },
  { label: "New Arrivals", icon: Star },
  { label: "Featured Collections", icon: Star },
  { label: "Budget Store", icon: Tag },
  { label: "Coupons & Offers", icon: Tag },
  { label: "Website Settings", icon: Settings },
];

function StatCard({ label, value, delta, up = true, icon: Icon }: { label: string; value: string; delta: string; up?: boolean; icon: typeof IndianRupee }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="eyebrow">{label}</div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-accent"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 font-display text-3xl text-foreground">{value}</div>
      <div className={`mt-1 inline-flex items-center gap-1 text-xs ${up ? "text-emerald-700" : "text-destructive"}`}>
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />} {delta}
      </div>
    </div>
  );
}

function Admin() {
  const orders = [
    { id: "#SS-2418", customer: "Ananya R.", item: "Emerald Kanjivaram Silk", total: 8499, status: "Processing" },
    { id: "#SS-2417", customer: "Lakshmi V.", item: "Ruby Temple Necklace Set", total: 3299, status: "Shipped" },
    { id: "#SS-2416", customer: "Sneha K.", item: "Bagru Mul Cotton", total: 1799, status: "Delivered" },
    { id: "#SS-2415", customer: "Divya P.", item: "Jadau Kundan Bridal Set", total: 9999, status: "Processing" },
    { id: "#SS-2414", customer: "Meera S.", item: "Pink Saree & Jhumka Combo", total: 3499, status: "Shipped" },
  ];

  return (
    <div className="min-h-screen bg-secondary/50 text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-background lg:block">
          <div className="border-b border-border px-6 py-5"><Logo /></div>
          <nav className="space-y-0.5 p-3">
            {NAV.map((n) => (
              <button
                key={n.label}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  n.active ? "bg-foreground text-background" : "text-foreground/75 hover:bg-secondary"
                }`}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          {/* Topbar */}
          <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-5 lg:px-10">
              <div>
                <div className="eyebrow">Studio</div>
                <h1 className="font-display text-xl">Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/" className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium uppercase tracking-widest hover:border-accent">View Site</Link>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground font-display">S</div>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 lg:p-10">
            {/* Stats */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Revenue (30d)" value={formatINR(248900)} delta="+12.4% vs last month" icon={IndianRupee} />
              <StatCard label="Orders" value="184" delta="+8 this week" icon={ShoppingBag} />
              <StatCard label="New Customers" value="62" delta="+5.1%" icon={Users} />
              <StatCard label="Avg. Order Value" value={formatINR(1352)} delta="-1.8%" up={false} icon={TrendingUp} />
            </div>

            {/* Recent + Inventory */}
            <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
              <section className="rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="font-display text-lg">Recent Orders</h2>
                  <button className="text-xs uppercase tracking-widest text-accent">View all</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-6 py-3">Order</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Item</th>
                        <th className="px-6 py-3">Total</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="border-b border-border/60 last:border-0">
                          <td className="px-6 py-4 font-medium">{o.id}</td>
                          <td className="px-6 py-4 text-foreground/80">{o.customer}</td>
                          <td className="px-6 py-4 text-foreground/80">{o.item}</td>
                          <td className="px-6 py-4">{formatINR(o.total)}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              o.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                              o.status === "Shipped" ? "bg-accent/15 text-accent" :
                              "bg-secondary text-foreground/80"
                            }`}>{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="font-display text-lg">Top Catalog</h2>
                  <button className="text-xs uppercase tracking-widest text-accent">Manage</button>
                </div>
                <ul className="divide-y divide-border">
                  {PRODUCTS.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-6 py-3">
                      <img src={p.image} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{p.categories.join(" · ")}</div>
                      </div>
                      <div className="text-sm font-medium">{formatINR(p.price)}</div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Quick actions */}
            <section className="grid gap-5 md:grid-cols-3">
              {[
                { t: "Add Saree", d: "Multi-category, multiple images, featured & new toggles." },
                { t: "Schedule Banner", d: "Upload desktop & mobile banners with date range." },
                { t: "Approve Reviews", d: "3 pending · feature standout customer stories." },
              ].map((q) => (
                <div key={q.t} className="rounded-2xl border border-dashed border-border bg-card/60 p-6">
                  <div className="eyebrow mb-2">Quick action</div>
                  <h3 className="font-display text-xl">{q.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{q.d}</p>
                  <button className="mt-4 rounded-full bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground">Open</button>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
