import React, { useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  LayoutGrid, 
  List, 
  Check, 
  X, 
  ExternalLink, 
  Filter, 
  ArrowUpDown,
  Tag,
  PackageCheck,
  PackageX,
  Sparkles,
  Move
} from "lucide-react";
import { Product, Category } from "../types";
import { formatNTD, formatImageUrl } from "../utils/formatters";
import { getProductCategories } from "../utils/categoryHelpers";

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDuplicateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onTogglePublished: (product: Product) => void;
  onToggleStock: (product: Product) => void;
  onOpenReorder: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  categories,
  onAddProduct,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onTogglePublished,
  onToggleStock,
  onOpenReorder,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [publishFilter, setPublishFilter] = useState<"all" | "published" | "unpublished">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [sortBy, setSortBy] = useState<"custom" | "id-desc" | "id-asc" | "price-desc" | "price-asc" | "name">("custom");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          getProductCategories(p, categories).some((c) => c.name.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) =>
        p.categories.some(
          (c) => String(c.id) === selectedCategory
        )
      );
    }

    // Publication status filter
    if (publishFilter === "published") {
      result = result.filter((p) => p.is_published);
    } else if (publishFilter === "unpublished") {
      result = result.filter((p) => !p.is_published);
    }

    if (stockFilter === "in_stock") {
      result = result.filter((p) => p.in_stock === true);
    } else if (stockFilter === "out_of_stock") {
      result = result.filter((p) => p.in_stock !== true);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "custom") {
        const orderA = a.sort_order !== undefined ? a.sort_order : a.id;
        const orderB = b.sort_order !== undefined ? b.sort_order : b.id;
        return orderA - orderB;
      }
      if (sortBy === "id-desc") return b.id - a.id;
      if (sortBy === "id-asc") return a.id - b.id;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "name") return a.name.localeCompare(b.name, "zh-TW");
      return 0;
    });

    return result;
  }, [products, categories, searchQuery, selectedCategory, publishFilter, stockFilter, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-[#E5E2D9] space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-[#8A8576] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋商品名稱、SKU、成分簡介..."
              className="w-full bg-[#FAF9F6] text-xs sm:text-sm text-[#2D2D2D] placeholder-[#8A8576] pl-10 pr-8 py-2.5 rounded-sm border border-[#D1C9BC] focus:outline-none focus:border-[#7C8B7C] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8576] hover:text-[#2D2D2D]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Actions & View switch */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#FAF9F6] border border-[#D1C9BC] rounded-sm p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-xs transition cursor-pointer ${
                  viewMode === "table" ? "bg-[#7C8B7C] text-white shadow-xs" : "text-[#8A8576] hover:text-[#2D2D2D]"
                }`}
                title="列表視圖"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-xs transition cursor-pointer ${
                  viewMode === "grid" ? "bg-[#7C8B7C] text-white shadow-xs" : "text-[#8A8576] hover:text-[#2D2D2D]"
                }`}
                title="網格視圖"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Reorder Products Button */}
            <button
              onClick={onOpenReorder}
              className="px-4 py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#D1C9BC] text-[#2D2D2D] font-bold text-xs rounded-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
              title="按此讀取商品自訂排序並進行重新排序調整"
            >
              <Move className="w-4 h-4 text-[#7C8B7C]" />
              <span>自訂排序維護</span>
            </button>

            {/* Add Product Button */}
            <button
              onClick={onAddProduct}
              className="px-4 py-2.5 bg-[#7C8B7C] hover:bg-[#6A796A] text-white font-bold text-xs rounded-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>新增商品維護</span>
            </button>
          </div>
        </div>

        {/* Filters dropdowns */}
        <div className="pt-3 border-t border-[#E5E2D9] flex flex-wrap items-center gap-3 text-xs">
          
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#8A8576]" />
            <span className="font-semibold text-[#6E6A5E]">分類：</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#FAF9F6] border border-[#D1C9BC] text-[#2D2D2D] rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-[#7C8B7C]"
            >
              <option value="all">全部分類 ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#8A8576]" />
            <span className="font-semibold text-[#6E6A5E]">狀態：</span>
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value as typeof publishFilter)}
              className="bg-[#FAF9F6] border border-[#D1C9BC] text-[#2D2D2D] rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-[#7C8B7C]"
            >
              <option value="all">全部狀態</option>
              <option value="published">已上架</option>
              <option value="unpublished">已下架</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-[#8A8576]" />
            <span className="font-semibold text-[#6E6A5E]">庫存：</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
              className="bg-[#FAF9F6] border border-[#D1C9BC] text-[#2D2D2D] rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-[#7C8B7C]"
            >
              <option value="all">全部庫存</option>
              <option value="in_stock">有庫存</option>
              <option value="out_of_stock">無庫存</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8A8576]" />
            <span className="font-semibold text-[#6E6A5E]">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FAF9F6] border border-[#D1C9BC] text-[#2D2D2D] rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-[#7C8B7C]"
            >
              <option value="custom">自訂排序</option>
              <option value="id-desc">ID 新到舊</option>
              <option value="id-asc">ID 舊到新</option>
              <option value="price-desc">價格：高至低</option>
              <option value="price-asc">價格：低至高</option>
              <option value="name">商品名稱排序</option>
            </select>
          </div>

          {/* Count Badge */}
          <div className="ml-auto text-[#8A8576] text-xs font-mono">
            顯示 <span className="font-bold text-[#2D2D2D]">{filteredProducts.length}</span> / {products.length} 項商品
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-[#E5E2D9] space-y-3">
          <PackageX className="w-12 h-12 text-[#D1C9BC] mx-auto" />
          <p className="text-base font-bold text-[#2D2D2D]">未找到符合條件的商品</p>
          <p className="text-xs text-[#8A8576]">請嘗試調整搜尋關鍵字或清除篩選條件。</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setPublishFilter("all");
              setStockFilter("all");
            }}
            className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#EAE7DC] text-[#2D2D2D] text-xs font-medium rounded-sm border border-[#D1C9BC] cursor-pointer transition"
          >
            重設篩選條件
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E2D9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E5E2D9] text-[#6E6A5E] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">縮圖</th>
                  <th className="py-3 px-4">ID / SKU</th>
                  <th className="py-3 px-4">商品名稱與分類</th>
                  <th className="py-3 px-4 text-right">售價 / 定價 (NT$)</th>
                  <th className="py-3 px-4 text-center">上架狀態</th>
                  <th className="py-3 px-4 text-center">庫存狀態</th>
                  <th className="py-3 px-4 text-center">排序</th>
                  <th className="py-3 px-4 text-center w-36">維護操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2D9]">
                {filteredProducts.map((p) => {
                  const mainImage = p.images && p.images[0]?.src
                    ? formatImageUrl(p.images[0].src)
                    : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=200";

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                      {/* Image */}
                      <td className="py-3 px-4">
                        <div className="w-11 h-11 bg-[#FAF9F6] border border-[#E5E2D9] rounded-sm overflow-hidden shrink-0">
                          <img
                            src={mainImage}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=200";
                            }}
                          />
                        </div>
                      </td>

                      {/* ID / SKU */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#6E6A5E]">
                        <div className="font-bold text-[#2D2D2D]">#{p.id}</div>
                        <div className="text-[10px] text-[#8A8576] truncate max-w-[100px]">{p.sku}</div>
                      </td>

                      {/* Name & Categories */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-sm text-[#2D2D2D] line-clamp-1 hover:text-[#7C8B7C]">
                          {p.name}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getProductCategories(p, categories).map((c) => (
                            <span
                              key={c.id}
                              className="px-1.5 py-0.5 bg-[#FAF9F6] text-[#7C8B7C] border border-[#E5E2D9] text-[10px] rounded-xs font-medium"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="font-bold text-sm text-[#2D2D2D]">
                          {formatNTD(p.price)}
                        </div>
                        {p.regular_price > p.price && (
                          <div className="text-[10px] text-[#8A8576] line-through">
                            定價 {formatNTD(p.regular_price)}
                          </div>
                        )}
                      </td>

                      {/* Stock Status Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onTogglePublished(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            p.is_published
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                          }`}
                          title="點擊切換上架狀態"
                        >
                          {p.is_published ? (
                            <>
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>已上架</span>
                            </>
                          ) : (
                            <>
                              <PackageX className="w-3.5 h-3.5" />
                              <span>已下架</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleStock(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            p.in_stock === true
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
                          }`}
                          title="點擊切換庫存狀態"
                        >
                          {p.in_stock === true ? <PackageCheck className="w-3.5 h-3.5" /> : <PackageX className="w-3.5 h-3.5" />}
                          <span>{p.in_stock === true ? "有庫存" : "無庫存"}</span>
                        </button>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#6E6A5E]">
                        {p.sort_order !== undefined ? p.sort_order : "-"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-[#2E4F2D] hover:bg-[#EAE7DC] rounded-sm transition cursor-pointer"
                            title="編輯商品"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDuplicateProduct(p)}
                            className="p-1.5 text-[#6E6A5E] hover:bg-[#EAE7DC] rounded-sm transition cursor-pointer"
                            title="複製商品"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-sm transition cursor-pointer"
                            title="刪除商品"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((p) => {
            const mainImage = p.images && p.images[0]?.src
              ? formatImageUrl(p.images[0].src)
              : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400";

            return (
              <div
                key={p.id}
                className="bg-white rounded-lg border border-[#E5E2D9] shadow-xs overflow-hidden flex flex-col group hover:shadow-md transition"
              >
                {/* Image */}
                <div className="relative aspect-4/3 bg-[#FAF9F6] border-b border-[#E5E2D9] overflow-hidden">
                  <img
                    src={mainImage}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono rounded-xs">
                      #{p.id}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onTogglePublished(p)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs cursor-pointer ${
                          p.is_published
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-amber-600 text-white border-amber-500"
                        }`}
                        title="切換上架狀態"
                      >
                        {p.is_published ? "已上架" : "已下架"}
                      </button>
                      <button
                        onClick={() => onToggleStock(p)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs cursor-pointer ${
                          p.in_stock === true
                            ? "bg-sky-600 text-white border-sky-500"
                            : "bg-slate-600 text-white border-slate-500"
                        }`}
                        title="切換庫存狀態"
                      >
                        {p.in_stock === true ? "有庫存" : "無庫存"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1 flex-wrap text-[10px] text-[#7C8B7C] font-semibold mb-1">
                      {getProductCategories(p, categories).map((c) => (
                        <span key={c.id}>• {c.name}</span>
                      ))}
                    </div>
                    <h4 className="font-bold text-sm text-[#2D2D2D] line-clamp-2 leading-snug">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-[#8A8576] font-mono mt-0.5">
                      SKU: {p.sku}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E5E2D9] flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold font-mono text-[#2D2D2D]">
                        {formatNTD(p.price)}
                      </div>
                      {p.regular_price > p.price && (
                        <div className="text-[10px] text-[#8A8576] line-through font-mono">
                          {formatNTD(p.regular_price)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditProduct(p)}
                        className="p-1.5 bg-[#FAF9F6] hover:bg-[#EAE7DC] text-[#2D2D2D] rounded-sm border border-[#D1C9BC] transition cursor-pointer"
                        title="編輯"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateProduct(p)}
                        className="p-1.5 bg-[#FAF9F6] hover:bg-[#EAE7DC] text-[#2D2D2D] rounded-sm border border-[#D1C9BC] transition cursor-pointer"
                        title="複製"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-sm border border-red-200 transition cursor-pointer"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
