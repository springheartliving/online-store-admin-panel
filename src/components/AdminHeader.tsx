import React from "react";
import { 
  Package, 
  Tag, 
  FileText, 
  RefreshCw, 
  Plus, 
  Sparkles, 
  Database,
  Building2,
  Settings,
  LogOut
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export type AdminTab = "products" | "categories";

interface AdminHeaderProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  totalProducts: number;
  publishedCount: number;
  inStockCount: number;
  totalCategories: number;
  onQuickAddProduct: () => void;
  onQuickAddCategory: () => void;
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onTabChange,
  totalProducts,
  publishedCount,
  inStockCount,
  totalCategories,
  onQuickAddProduct,
  onQuickAddCategory,
  onLogout
}) => {
  return (
    <header className="w-full bg-white border-b border-[#E5E2D9] text-[#2D2D2D] sticky top-0 z-40 shadow-xs">
      
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo & System Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#FAF8F2] border border-[#E5E2D9] flex items-center justify-center rounded-md shrink-0 shadow-xs p-1">
              <BrandLogo className="w-full h-full text-[#2E4F2D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono font-bold text-lg sm:text-xl tracking-tight text-[#2D2D2D]">
                  泉心生活
                </h1>
                <span className="px-2 py-0.5 bg-[#2E4F2D] text-white font-mono font-bold text-[10px] rounded-xs uppercase tracking-wider">
                  後台維護
                </span>
              </div>
              <p className="text-[11px] text-[#8A8576] tracking-wide font-light hidden sm:block">
                Spring Heart Living
              </p>
            </div>
          </div>

          {/* Quick Header Stats (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono border-l border-r border-[#E5E2D9] px-6 py-1">
            <div className="text-center">
              <div className="text-[10px] text-[#8A8576]">總商品數</div>
              <div className="font-bold text-sm text-[#2D2D2D]">{totalProducts}</div>
            </div>
            <div className="w-px h-6 bg-[#E5E2D9]"></div>
            <div className="text-center">
              <div className="text-[10px] text-[#8A8576]">已上架</div>
              <div className="font-bold text-sm text-emerald-700">{publishedCount}</div>
            </div>
            <div className="w-px h-6 bg-[#E5E2D9]"></div>
            <div className="text-center">
              <div className="text-[10px] text-[#8A8576]">有庫存</div>
              <div className="font-bold text-sm text-emerald-700">{inStockCount}</div>
            </div>            
            <div className="w-px h-6 bg-[#E5E2D9]"></div>
            <div className="text-center">
              <div className="text-[10px] text-[#8A8576]">商品分類</div>
              <div className="font-bold text-sm text-[#2D2D2D]">{totalCategories}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onQuickAddProduct}
              className="px-3.5 py-2 bg-[#7C8B7C] hover:bg-[#6A796A] text-white font-bold text-xs rounded-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">新增商品</span>
              <span className="sm:hidden">商品</span>
            </button>            
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 bg-white hover:bg-[#FAF9F6] text-[#2D2D2D] font-medium text-xs rounded-sm border border-[#D1C9BC] shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#7C8B7C]" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </div>

        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-[#FAF9F6] border-t border-[#E5E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2">
            
            {/* Products Tab */}
            <button
              onClick={() => onTabChange("products")}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "products"
                  ? "bg-[#7C8B7C] text-white shadow-xs"
                  : "bg-transparent text-[#6E6A5E] hover:text-[#2D2D2D] hover:bg-[#EAE7DC]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>商品管理 ({totalProducts})</span>
            </button>

            {/* Categories Tab */}
            <button
              onClick={() => onTabChange("categories")}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "categories"
                  ? "bg-[#7C8B7C] text-white shadow-xs"
                  : "bg-transparent text-[#6E6A5E] hover:text-[#2D2D2D] hover:bg-[#EAE7DC]"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>分類維護 ({totalCategories})</span>
            </button>

          </nav>
        </div>
      </div>

    </header>
  );
};
