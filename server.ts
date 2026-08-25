import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
const app = express();
const PORT = 3000;

app.use(express.json());

// Load cached or scraped product data
const dataDir = path.join(process.cwd(), "src", "data");
const productsFile = path.join(dataDir, "products.json");
const categoriesFile = path.join(dataDir, "categories.json");

function getProducts() {
  try {
    if (fs.existsSync(productsFile)) {
      return JSON.parse(fs.readFileSync(productsFile, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading products.json:", err);
  }
  return [];
}

function getCategories() {
  try {
    if (fs.existsSync(categoriesFile)) {
      return JSON.parse(fs.readFileSync(categoriesFile, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading categories.json:", err);
  }
  return [];
}

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API: Get structured products
app.get("/api/products", (req, res) => {
  const products = getProducts();
  const { category, search, minPrice, maxPrice } = req.query;

  let filtered = products;

  if (category && typeof category === "string" && category !== "all") {
    filtered = filtered.filter((p: any) =>
      p.categories.some((c: any) => c.slug === category || c.name === category)
    );
  }

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) filtered = filtered.filter((p: any) => p.price >= min);
  }

  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) filtered = filtered.filter((p: any) => p.price <= max);
  }

  res.json({
    success: true,
    total: filtered.length,
    products: filtered,
    source: "https://meetspa.lohastime.com.tw/"
  });
});

// API: Get categories
app.get("/api/categories", (req, res) => {
  const categories = getCategories();
  res.json({
    success: true,
    categories
  });
});

// API: Sync / Refetch live data from meetspa.lohastime.com.tw
app.post("/api/sync-data", async (req, res) => {
  try {
    const catRes = await fetch("https://meetspa.lohastime.com.tw/wp-json/wc/store/v1/products/categories?per_page=100", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    let categories: any[] = [];
    if (catRes.ok) {
      categories = await catRes.json();
    }

    let products: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const prodRes = await fetch(`https://meetspa.lohastime.com.tw/wp-json/wc/store/v1/products?per_page=50&page=${page}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (!prodRes.ok) break;
      const pageProducts = await prodRes.json();
      if (!Array.isArray(pageProducts) || pageProducts.length === 0) break;
      products.push(...pageProducts);
      const totalPages = prodRes.headers.get("x-wp-totalpages");
      if (totalPages && page >= parseInt(totalPages, 10)) {
        hasMore = false;
      } else {
        page++;
      }
    }

    const cleanHtml = (str: string) => {
      if (!str) return "";
      return str.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#8211;/g, "-").replace(/\s+/g, " ").trim();
    };

    const processed = products.map((p: any) => {
      const rawPrice = p.prices?.price ? parseInt(p.prices.price, 10) / Math.pow(10, p.prices.currency_minor_unit || 0) : 0;
      const rawRegPrice = p.prices?.regular_price ? parseInt(p.prices.regular_price, 10) / Math.pow(10, p.prices.currency_minor_unit || 0) : rawPrice;
      const rawSalePrice = p.prices?.sale_price ? parseInt(p.prices.sale_price, 10) / Math.pow(10, p.prices.currency_minor_unit || 0) : null;

      let price = rawPrice;
      if (price === 0) {
        const match = (p.description || "").match(/NT\$?\s*([0-9,]+)/i) || (p.short_description || "").match(/NT\$?\s*([0-9,]+)/i);
        if (match) price = parseInt(match[1].replace(/,/g, ""), 10);
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku || `MEET-${p.id}`,
        permalink: p.permalink,
        price: price > 0 ? price : 2800,
        regular_price: rawRegPrice > 0 ? rawRegPrice : (price > 0 ? price : 2800),
        sale_price: rawSalePrice,
        isOnSale: p.prices?.is_on_sale || false,
        currency: p.prices?.currency_code || "TWD",
        currency_symbol: p.prices?.currency_symbol || "NT$",
        short_description: cleanHtml(p.short_description),
        description: cleanHtml(p.description || ""),
        raw_short_description: p.short_description,
        raw_description: p.description || "",
        categories: (p.categories || []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
        tags: (p.tags || []).map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })),
        images: (p.images || []).map((img: any) => ({
          id: img.id,
          src: img.src,
          thumbnail: img.thumbnail,
          alt: img.alt || p.name
        })),
        attributes: (p.attributes || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          terms: (a.terms || []).map((t: any) => t.name)
        })),
        in_stock: p.is_in_stock ?? true,
        has_options: p.has_options || false
      };
    });

    if (processed.length > 0) {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(productsFile, JSON.stringify(processed, null, 2));
      if (categories.length > 0) {
        fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2));
      }
    }

    res.json({
      success: true,
      message: `成功從 meetspa.lohastime.com.tw 同步 ${processed.length} 項商品與 ${categories.length} 個分類！`,
      count: processed.length
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite middleware & Static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MeetSpa Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
