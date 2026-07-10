import express from "express";
import { requireAdmin, AuthedRequest } from "../middleware/auth";
import { supabase } from "../lib/supabase";

export const customersRouter = express.Router();

// Get all customers (users with role = 'user')
customersRouter.get("/", requireAdmin as any, async (_req: AuthedRequest, res) => {
  try {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .eq("role", "user")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("customers fetch error:", usersError);
      return res.status(500).json({ error: "db_error", detail: usersError.message });
    }

    // Calculate order stats for each user
    const customers = await Promise.all((users || []).map(async (user: any) => {
      try {
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("total_amount, created_at")
          .eq("user_id", user.id);

        if (ordersError) {
          console.error("Error fetching orders for user:", user.id, ordersError);
        }

        const totalOrders = orders?.length || 0;
        const totalSpent = orders?.reduce((sum: number, order: any) => {
          const amount = Number(order.total_amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0) || 0;
        
        // Sort orders by created_at descending to get the most recent
        const sortedOrders = orders?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) || [];
        
        const lastOrder = sortedOrders.length > 0 
          ? new Date(sortedOrders[0].created_at).toLocaleDateString() 
          : "N/A";

        return {
          id: user.id,
          name: user.full_name || user.email?.split("@")[0] || "Unknown",
          email: user.email,
          mobile: user.mobile || "N/A",
          totalOrders,
          totalSpent,
          lastOrder,
          joined: user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
          address: user.address || "",
          city: user.city || "",
          state: user.state || "",
          pincode: user.pincode || "",
        };
      } catch (err) {
        console.error("Error processing customer:", user.id, err);
        return {
          id: user.id,
          name: user.full_name || user.email?.split("@")[0] || "Unknown",
          email: user.email,
          mobile: user.mobile || "N/A",
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: "N/A",
          joined: user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
          address: user.address || "",
          city: user.city || "",
          state: user.state || "",
          pincode: user.pincode || "",
        };
      }
    }));

    return res.json({ customers });
  } catch (error) {
    console.error("customers error:", error);
    return res.status(500).json({ error: "server_error" });
  }
});

// Get single customer by ID
customersRouter.get("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.params.id)
      .eq("role", "user")
      .maybeSingle();

    if (error) {
      console.error("customer fetch error:", error);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "not_found" });
    }

    const customer = {
      id: data.id,
      name: data.full_name || data.email?.split("@")[0] || "Unknown",
      email: data.email,
      mobile: data.mobile || "N/A",
      totalOrders: data.total_orders || 0,
      totalSpent: data.total_spent || 0,
      lastOrder: data.last_order_date ? new Date(data.last_order_date).toLocaleDateString() : "N/A",
      joined: data.created_at ? new Date(data.created_at).toLocaleDateString() : "N/A",
      address: data.address || "",
      city: data.city || "",
      state: data.state || "",
      pincode: data.pincode || "",
    };

    return res.json({ customer });
  } catch (error) {
    console.error("customer error:", error);
    return res.status(500).json({ error: "server_error" });
  }
});

// Update customer
customersRouter.put("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    if (body.full_name != null) updates.full_name = body.full_name;
    if (body.mobile != null) updates.mobile = body.mobile;
    if (body.address != null) updates.address = body.address;
    if (body.city != null) updates.city = body.city;
    if (body.state != null) updates.state = body.state;
    if (body.pincode != null) updates.pincode = body.pincode;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .eq("role", "user")
      .select()
      .maybeSingle();

    if (error) {
      console.error("customer update error:", error);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "not_found" });
    }

    const customer = {
      id: data.id,
      name: data.full_name || data.email?.split("@")[0] || "Unknown",
      email: data.email,
      mobile: data.mobile || "N/A",
      totalOrders: data.total_orders || 0,
      totalSpent: data.total_spent || 0,
      lastOrder: data.last_order_date ? new Date(data.last_order_date).toLocaleDateString() : "N/A",
      joined: data.created_at ? new Date(data.created_at).toLocaleDateString() : "N/A",
      address: data.address || "",
      city: data.city || "",
      state: data.state || "",
      pincode: data.pincode || "",
    };

    return res.json({ customer });
  } catch (error) {
    console.error("customer update error:", error);
    return res.status(500).json({ error: "server_error" });
  }
});

// Delete customer
customersRouter.delete("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id)
      .eq("role", "user");

    if (error) {
      console.error("customer delete error:", error);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("customer delete error:", error);
    return res.status(500).json({ error: "server_error" });
  }
});
