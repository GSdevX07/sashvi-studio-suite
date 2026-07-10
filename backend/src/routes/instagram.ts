import express from "express";
import { requireAdmin, AuthedRequest } from "../middleware/auth";
import { supabase } from "../lib/supabase";

export const instagramRouter = express.Router();

// Log all requests to Instagram feed routes
instagramRouter.use((req, _res, next) => {
  console.log("Instagram feed route called:", req.method, req.path);
  next();
});

// Get all Instagram feed items
instagramRouter.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("instagram_feed")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Instagram feed fetch error:", error);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }

    // Transform database format to frontend format
    const transformed = (data || []).map((item: any) => ({
      id: item.id,
      title: item.title || "",
      url: item.instagram_url || "",
      mediaType: item.type || "post",
      thumbnail: item.thumbnail_image || "",
      productMap: item.product_map || {},
      caption: item.caption || "",
      isActive: true, // Default to active since is_active doesn't exist
      linkedProducts: item.linked_products || [],
    }));

    return res.json({ feed: transformed });
  } catch (error) {
    console.error("Instagram feed error:", error);
    return res.status(500).json({ error: "server_error" });
  }
});

// Add Instagram feed item
instagramRouter.post("/", requireAdmin as any, async (req: AuthedRequest, res) => {
  try {
    const item = req.body;
    console.log("Instagram feed POST request body:", item);
    console.log("Linked products in request:", item.linkedProducts);
    
    const { data, error } = await supabase
      .from("instagram_feed")
      .insert({
        title: item.title || "",
        instagram_url: item.url,
        type: item.mediaType,
        thumbnail_image: item.thumbnail,
        caption: item.caption || "",
        linked_products: item.linkedProducts || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Instagram feed insert error:", error);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }

    console.log("Instagram feed inserted successfully:", data);

    // Fetch updated feed
    const { data: feed } = await supabase
      .from("instagram_feed")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Fetched feed after insert:", feed);

    // Transform response
    const transformed = (feed || []).map((item: any) => ({
      id: item.id,
      title: item.title || "",
      url: item.instagram_url || "",
      mediaType: item.type || "post",
      thumbnail: item.thumbnail_image || "",
      productMap: item.product_map || {},
      caption: item.caption || "",
      isActive: true,
      linkedProducts: item.linked_products || [],
    }));

    return res.json({ feed: transformed });
  } catch (error) {
    console.error("Instagram feed post error:", error);
    return res.status(500).json({ error: "server_error" });
  }
});

// Update Instagram feed item
instagramRouter.put("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const item = req.body;
    console.log("Instagram feed PUT request for id:", id);
    console.log("Instagram feed PUT request body:", item);
    console.log("Linked products in PUT request:", item.linkedProducts);
    
    const { data, error } = await supabase
      .from("instagram_feed")
      .update({
        title: item.title || "",
        instagram_url: item.url,
        type: item.mediaType,
        thumbnail_image: item.thumbnail,
        caption: item.caption || "",
        linked_products: item.linkedProducts || [],
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Instagram feed update error:", error);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }

    console.log("Instagram feed updated successfully:", data);

    // Fetch updated feed
    const { data: feed } = await supabase
      .from("instagram_feed")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Fetched feed after update:", feed);

    // Transform response
    const transformed = (feed || []).map((item: any) => ({
      id: item.id,
      title: item.title || "",
      url: item.instagram_url || "",
      mediaType: item.type || "post",
      thumbnail: item.thumbnail_image || "",
      productMap: item.product_map || {},
      caption: item.caption || "",
      isActive: true,
      linkedProducts: item.linked_products || [],
    }));

    return res.json({ feed: transformed });
  } catch (error) {
    console.error("Instagram feed update error:", error);
    return res.status(500).json({ error: "server_error" });
  }
});

// Delete Instagram feed item
instagramRouter.delete("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("instagram_feed")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Instagram feed delete error:", error);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }

    // Fetch updated feed
    const { data: feed } = await supabase
      .from("instagram_feed")
      .select("*")
      .order("created_at", { ascending: false });

    // Transform response
    const transformed = (feed || []).map((item: any) => ({
      id: item.id,
      title: item.title || "",
      url: item.instagram_url || "",
      mediaType: item.type || "post",
      thumbnail: item.thumbnail_image || "",
      productMap: item.product_map || {},
      caption: item.caption || "",
      isActive: true,
      linkedProducts: item.linked_products || [],
    }));

    return res.json({ feed: transformed });
  } catch (error) {
    console.error("Instagram feed delete error:", error);
    return res.status(500).json({ error: "server_error" });
  }
});
