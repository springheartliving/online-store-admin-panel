import React, { useState, useEffect } from "react";
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUp, 
  ChevronsDown,
  RefreshCw,
  Save,
  Check,
  Move
} from "lucide-react";
import { Product } from "../types";
import { saveProductsOrderToFirestore, fetchProductsFromFirestore } from "../lib/firebase";
import { formatImageUrl } from "../utils/formatters";

interface ProductReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedProducts: Product[]) => void;
}

export const ProductReorderModal: React.FC<ProductReorderModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load latest data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLatestProducts();
    }
  }, [isOpen]);

  const loadLatestProducts = async () => {
    setLoading(true);
    try {
      const prods = await fetchProductsFromFirestore();
      setLocalProducts(prods);
    } catch (error) {
      console.error("Error fetching products for reordering:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Reordering functions
  const moveItem = (index: number, direction: "up" | "down" | "top" | "bottom") => {
    const updated = [...localProducts];
    const targetItem = updated[index];

    if (direction === "up" && index > 0) {
      updated.splice(index, 1);
      updated.splice(index - 1, 0, targetItem);
    } else if (direction === "down" && index < updated.length - 1) {
      updated.splice(index, 1);
      updated.splice(index + 1, 0, targetItem);
    } else if (direction === "top" && index > 0) {
      updated.splice(index, 1);
      updated.unshift(targetItem);
    } else if (direction === "bottom" && index < updated.length - 1) {
      updated.splice(index, 1);
      updated.push(targetItem);
    }

    setLocalProducts(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Assign the new sort_order strictly in sequence
      const updatedWithNewOrder = localProducts.map((p, idx) => ({
        ...p,
        sort_order: idx
      }));

      await saveProductsOrderToFirestore(updatedWithNewOrder);
      onSaveSuccess(updatedWithNewOrder);
      onClose();
    } catch (error) {
      console.error("Failed to save product ordering:", error);
      alert("儲存排序失敗，請稍後再試。");
    } finally {
      setSaving(false);
    }
  };

  // Filter products locally just for quick search finding within the modal
  const filteredProducts = localProducts.map((product, originalIndex) => ({
    product,
    originalIndex
  })).filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.product.name.toLowerCase().includes(q) ||
      item.product.sku.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        id="product-reorder-modal" 
        className="bg-white rounded-lg shadow-2xl border border-[#E5E2D9] w-full max-w-3xl h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E2D9] flex items-center justify-between bg-[#FAF9F6]">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#2D2D2D] flex items-center gap-2">
              <Move className="w-5 h-5 text-[#7C8B7C]" />
              商品自訂排序維護
            </h3>
            <p className="text-xs text-[#8A8576] mt-0.5">
              依照在此設定的先後順序進行商品列表排序，設定完畢後請點擊儲存，更新將即時寫入資料庫。
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A8576] hover:text-[#2D2D2D] rounded-sm hover:bg-[#EAE7DC] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filter bar within modal */}
        <div className="p-4 border-b border-[#E5E2D9] bg-[#FAF9F6] flex gap-3 items-center">
          <input
            type="text"
            placeholder="在排序清單中搜尋名稱或型號定位..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white text-xs text-[#2D2D2D] placeholder-[#8A8576] px-3 py-2 rounded-sm border border-[#D1C9BC] focus:outline-none focus:border-[#7C8B7C]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[#8A8576] hover:text-[#2D2D2D] font-medium"
            >
              清除
            </button>
          )}
          <button
            onClick={loadLatestProducts}
            disabled={loading}
            className="p-2 text-[#7C8B7C] border border-[#D1C9BC] rounded-sm hover:bg-white transition cursor-pointer disabled:opacity-50"
            title="重新讀取資料庫"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-8 h-8 text-[#7C8B7C] animate-spin" />
              <p className="text-xs text-[#8A8576]">正在讀取商品最新資料與排序...</p>
            </div>
          ) : localProducts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#8A8576]">
              暫無商品資料
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredProducts.map(({ product, originalIndex }) => {
                const mainImage = product.images && product.images[0]?.src
                  ? formatImageUrl(product.images[0].src)
                  : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=200";

                const isFirst = originalIndex === 0;
                const isLast = originalIndex === localProducts.length - 1;

                return (
                  <div 
                    key={product.id}
                    className="flex items-center gap-3 p-2.5 bg-white border border-[#E5E2D9] rounded-sm hover:border-[#7C8B7C] hover:bg-[#FAF9F6] transition-all"
                  >
                    {/* Index Badge */}
                    <div className="w-10 text-center font-mono text-xs font-bold text-[#8A8576] bg-[#FAF9F6] py-1 border border-[#E5E2D9] rounded-sm shrink-0">
                      {originalIndex + 1}
                    </div>

                    {/* Image */}
                    <div className="w-10 h-10 bg-[#FAF9F6] border border-[#E5E2D9] rounded-sm overflow-hidden shrink-0">
                      <img 
                        src={mainImage} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=200";
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-[#2D2D2D] truncate">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-[#8A8576] font-mono uppercase truncate mt-0.5">
                        SKU: {product.sku}
                      </p>
                    </div>

                    {/* Controls (Action Buttons) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Top */}
                      <button
                        onClick={() => moveItem(originalIndex, "top")}
                        disabled={isFirst || !!searchQuery}
                        className="p-1.5 text-[#6E6A5E] hover:bg-white hover:text-[#2D2D2D] border border-transparent hover:border-[#D1C9BC] rounded-sm transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer"
                        title="移至最前"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Up */}
                      <button
                        onClick={() => moveItem(originalIndex, "up")}
                        disabled={isFirst || !!searchQuery}
                        className="p-1.5 text-[#6E6A5E] hover:bg-white hover:text-[#2D2D2D] border border-transparent hover:border-[#D1C9BC] rounded-sm transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer"
                        title="上移"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Down */}
                      <button
                        onClick={() => moveItem(originalIndex, "down")}
                        disabled={isLast || !!searchQuery}
                        className="p-1.5 text-[#6E6A5E] hover:bg-white hover:text-[#2D2D2D] border border-transparent hover:border-[#D1C9BC] rounded-sm transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer"
                        title="下移"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Bottom */}
                      <button
                        onClick={() => moveItem(originalIndex, "bottom")}
                        disabled={isLast || !!searchQuery}
                        className="p-1.5 text-[#6E6A5E] hover:bg-white hover:text-[#2D2D2D] border border-transparent hover:border-[#D1C9BC] rounded-sm transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer"
                        title="移至最後"
                      >
                        <ChevronsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {searchQuery && filteredProducts.length === 0 && (
            <div className="h-full flex items-center justify-center text-xs text-[#8A8576]">
              找不到相符的商品
            </div>
          )}

          {searchQuery && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-sm text-center">
              ⚠️ 注意：在啟用「搜尋過濾」時，排序調整按鈕將會暫時禁用，以防止跨頁索引錯誤。如需調整順序，請清除搜尋。
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E2D9] flex items-center justify-between bg-[#FAF9F6]">
          <span className="text-xs text-[#8A8576] font-medium">
            共 <span className="font-bold text-[#2D2D2D]">{localProducts.length}</span> 項商品已載入
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#FAF9F6] border border-[#D1C9BC] text-[#2D2D2D] text-xs font-bold rounded-sm transition cursor-pointer active:scale-98"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || localProducts.length === 0}
              className="px-4 py-2 bg-[#7C8B7C] hover:bg-[#6A796A] text-white text-xs font-bold rounded-sm transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>儲存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>儲存自訂排序</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
