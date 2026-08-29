import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUp, 
  ChevronsDown,
  RefreshCw,
  Save,
  Check,
  Move,
  Image as ImageIcon
} from "lucide-react";
import { Product } from "../types";
import { saveProductsOrderToFirestore, fetchProductsFromFirestore } from "../lib/firebase";
import { formatImageUrl } from "../utils/formatters";

interface ProductReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedProducts: Product[]) => void;
}

const ProductImageFallback: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}> = ({ src, alt, className = "", fallbackClassName = "" }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={fallbackClassName || "w-full h-full flex items-center justify-center bg-[#FAF9F6] text-[#8A8576]"}>
        <ImageIcon className="w-5 h-5" />
      </div>
    );
  }

  return (
    <img
      src={formatImageUrl(src)}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export const ProductReorderModal: React.FC<ProductReorderModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [draggedProductId, setDraggedProductId] = useState<number | null>(null);
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null);
  const reorderListRef = useRef<HTMLDivElement | null>(null);
  const dragAutoScrollRef = useRef<number | null>(null);

  const clearDragState = () => {
    setDraggedProductId(null);
    setDragPointer(null);
    if (dragAutoScrollRef.current) {
      cancelAnimationFrame(dragAutoScrollRef.current);
      dragAutoScrollRef.current = null;
    }
  };

  const isDragAllowedTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return true;
    return !target.closest("[data-no-drag='true']");
  };

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>, productId: number) => {
    if (searchQuery || localProducts.length < 2 || !isDragAllowedTarget(event.target)) return;

    const handle = (event.target as HTMLElement).closest("[data-drag-handle='true']");
    if (!handle) return;

    event.preventDefault();
    event.stopPropagation();
    setDraggedProductId(productId);
    setDragPointer({ x: event.clientX, y: event.clientY });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggedProductId) return;

    const listElement = reorderListRef.current;
    if (!listElement) return;

    const rect = listElement.getBoundingClientRect();
    const pointerY = event.clientY;
    const scrollThreshold = 90;
    const scrollStep = 14;

    if (pointerY < rect.top + scrollThreshold) {
      listElement.scrollTop = Math.max(0, listElement.scrollTop - scrollStep);
    } else if (pointerY > rect.bottom - scrollThreshold) {
      listElement.scrollTop = Math.min(listElement.scrollHeight - listElement.clientHeight, listElement.scrollTop + scrollStep);
    }

    setDragPointer({ x: event.clientX, y: event.clientY });

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-reorder-id]") as HTMLElement | null;
    if (!target) return;

    const targetId = Number(target.dataset.reorderId);
    if (!Number.isFinite(targetId) || targetId === draggedProductId) return;

    setLocalProducts((prev) => {
      const fromIndex = prev.findIndex((product) => product.id === draggedProductId);
      const toIndex = prev.findIndex((product) => product.id === targetId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  // Load latest data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLatestProducts();
      clearDragState();
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
        className="bg-white rounded-xl shadow-2xl border border-[#E5E2D9] w-full max-w-3xl h-[85vh] flex flex-col select-none"
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E2D9] flex items-center justify-between bg-[#FAF9F6]">
          <div>
            <h3 className="text-base sm:text-lg font-light font-bold text-[#2D2D2D] flex items-center gap-2">
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

        <div className="px-4 py-2 border-b border-[#E5E2D9] bg-[#FAF9F6]">
          <p className="text-[11px] text-[#6E6A5E] leading-relaxed">
            {draggedProductId !== null
              ? "正在拖曳：將商品移動到其他位置即可連續調整排序。"
              : "可直接點擊箭頭調整，或直接拖曳商品到新位置。"}
          </p>
        </div>

        {/* List Content */}
        <div
          ref={reorderListRef}
          className="flex-1 overflow-y-auto p-4 space-y-2"
          onPointerMove={handlePointerMove}
          onPointerUp={clearDragState}
          onPointerLeave={clearDragState}
        >
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
                const mainImage = product.images && product.images[0]?.src ? product.images[0].src : "";

                const isFirst = originalIndex === 0;
                const isLast = originalIndex === localProducts.length - 1;

                return (
                  <div 
                    key={product.id}
                    data-reorder-id={String(product.id)}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`flex items-center gap-3 p-2.5 rounded-sm border transition-all select-none ${
                      draggedProductId === product.id
                        ? "bg-[#F4F6F1] border-[#7C8B7C] shadow-md opacity-40 scale-[0.99]"
                        : "bg-white border-[#E5E2D9] hover:border-[#7C8B7C] hover:bg-[#FAF9F6]"
                    }`}
                    style={{ WebkitUserSelect: "none", userSelect: "none", touchAction: "pan-y" }}
                  >
                    {/* Index Badge */}
                    <div
                      data-drag-handle="true"
                      onPointerDown={(e) => beginDrag(e, product.id)}
                      onPointerUp={clearDragState}
                      className="w-10 text-center font-mono text-xs font-bold text-[#8A8576] bg-[#FAF9F6] py-1 border border-[#E5E2D9] rounded-sm shrink-0 cursor-grab active:cursor-grabbing touch-none"
                    >
                      {originalIndex + 1}
                    </div>

                    {/* Image */}
                    <div className="w-10 h-10 bg-[#FAF9F6] border border-[#E5E2D9] rounded-sm overflow-hidden shrink-0">
                      <ProductImageFallback
                        src={mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        fallbackClassName="w-full h-full flex items-center justify-center bg-[#FAF9F6] text-[#8A8576]"
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
                    <div
                      data-no-drag="true"
                      onPointerDown={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 shrink-0"
                    >
                      {/* Top */}
                      <button
                        data-no-drag="true"
                        onClick={() => moveItem(originalIndex, "top")}
                        disabled={isFirst || !!searchQuery}
                        className="p-1.5 text-[#6E6A5E] hover:bg-white hover:text-[#2D2D2D] border border-transparent hover:border-[#D1C9BC] rounded-sm transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer"
                        title="移至最前"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Up */}
                      <button
                        data-no-drag="true"
                        onClick={() => moveItem(originalIndex, "up")}
                        disabled={isFirst || !!searchQuery}
                        className="p-1.5 text-[#6E6A5E] hover:bg-white hover:text-[#2D2D2D] border border-transparent hover:border-[#D1C9BC] rounded-sm transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer"
                        title="上移"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Down */}
                      <button
                        data-no-drag="true"
                        onClick={() => moveItem(originalIndex, "down")}
                        disabled={isLast || !!searchQuery}
                        className="p-1.5 text-[#6E6A5E] hover:bg-white hover:text-[#2D2D2D] border border-transparent hover:border-[#D1C9BC] rounded-sm transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:border-transparent cursor-pointer"
                        title="下移"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Bottom */}
                      <button
                        data-no-drag="true"
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

          {draggedProductId !== null && dragPointer && (
            <div
              className="pointer-events-none fixed z-[60] w-[280px] max-w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-[#7C8B7C] bg-white shadow-xl opacity-95"
              style={{ left: dragPointer.x, top: dragPointer.y }}
            >
              <div className="flex items-center gap-3 p-2.5">
                <div className="w-10 h-10 bg-[#FAF9F6] border border-[#E5E2D9] rounded-sm overflow-hidden shrink-0">
                  <ProductImageFallback
                    src={localProducts.find((product) => product.id === draggedProductId)?.images?.[0]?.src || ""}
                    alt={localProducts.find((product) => product.id === draggedProductId)?.name || "drag item"}
                    className="w-full h-full object-cover"
                    fallbackClassName="w-full h-full flex items-center justify-center bg-[#FAF9F6] text-[#8A8576]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-[#2D2D2D] truncate">
                    {localProducts.find((product) => product.id === draggedProductId)?.name || "商品"}
                  </h4>
                  <p className="text-[10px] text-[#8A8576] font-mono uppercase truncate mt-0.5">
                    SKU: {localProducts.find((product) => product.id === draggedProductId)?.sku || ""}
                  </p>
                </div>
              </div>
            </div>
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
