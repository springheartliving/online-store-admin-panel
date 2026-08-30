import React, { useState, useMemo } from "react";
import { Search, Plus, Edit3, Trash2 } from "lucide-react";
import { Category, Product } from "../types";

interface CategoryManagementProps {
  categories: Category[];
  products: Product[];
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: number) => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  products,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate product count per category
  const categoryProductCounts = useMemo(() => {
    const map = new Map<number, number>();
    products.forEach((prod) => {
      prod.categories.forEach((cat) => {
        map.set(cat.id, (map.get(cat.id) || 0) + 1);
      });
    });
    return map;
  }, [products]);

  // Filter categories
  const filteredCategories = useMemo(() => {
    const sortedCategories = [...categories].sort((a, b) => {
      const orderA = a.sort_order !== undefined ? a.sort_order : a.id;
      const orderB = b.sort_order !== undefined ? b.sort_order : b.id;
      return orderA - orderB;
    });

    if (!searchQuery.trim()) return sortedCategories;
    const q = searchQuery.toLowerCase().trim();
    return sortedCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-[#E5E2D9] flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8A8576] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋分類名稱或 Slug..."
            className="w-full bg-[#FAF9F6] text-xs sm:text-sm text-[#2D2D2D] placeholder-[#8A8576] pl-10 pr-8 py-2 rounded-sm border border-[#D1C9BC] focus:outline-none focus:border-[#7C8B7C]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8576]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Add Category Button */}
        <button
          onClick={onAddCategory}
          className="w-full sm:w-auto px-4 py-2 bg-[#7C8B7C] hover:bg-[#6A796A] text-white font-bold text-xs rounded-sm shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>新增商品分類</span>
        </button>

      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E2D9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#E5E2D9] text-[#6E6A5E] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">分類名稱</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4 text-center w-28">排序</th>
                <th className="py-3.5 px-4 text-center">包含商品數</th>
                <th className="py-3.5 px-4 text-center w-28">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2D9]">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8A8576]">
                    尚未建立或找不到符合條件的商品分類
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const count = categoryProductCounts.get(c.id) || 0;
                  return (
                    <tr key={c.id} className="hover:bg-[#FAF8F5] transition-colors">                      
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-[#2D2D2D] flex items-center gap-1.5">
                          {/* <Tag className="w-3.5 h-3.5 text-[#7C8B7C]" /> */}
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#8A8576]">
                        {c.slug}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2.5 py-1 bg-[#FAF9F6] border border-[#E5E2D9] rounded-full text-xs font-bold text-[#2D2D2D]">
                          {c.sort_order !== undefined ? c.sort_order : c.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2.5 py-1 bg-[#FAF9F6] border border-[#E5E2D9] rounded-full text-xs font-bold text-[#2D2D2D]">
                          {count} 項
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditCategory(c)}
                            className="p-1.5 text-[#2E4F2D] hover:bg-[#EAE7DC] rounded-sm transition cursor-pointer"
                            title="編輯分類"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteCategory(c.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-sm transition cursor-pointer"
                            title="刪除分類"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
