import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Image as ImageIcon, Tag, Check, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Product, Category, ProductImage, ProductAttribute } from "../types";
import { formatImageUrl } from "../utils/formatters";

interface ProductEditModalProps {
  isOpen: boolean;
  product: Product | null; // null means adding a new product
  categories: Category[];
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  product,
  categories,
  onClose,
  onSave
}) => {
  const isEditing = Boolean(product);

  const [id, setId] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [inStock, setInStock] = useState<boolean>(false);
  const [isOnHot, setIsOnHot] = useState<boolean>(false);
  const [shortDescription, setShortDescription] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  
  // Categories selection
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Images list
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>("");

  // Tags string
  const [tagsInput, setTagsInput] = useState<string>("");

  // Attributes
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [attrName, setAttrName] = useState<string>("");
  const [attrTerms, setAttrTerms] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setId(product ? product.id : Date.now());
      setName(product ? product.name : "");
      setSku(product ? product.sku : `SH-${Math.floor(1000 + Math.random() * 9000)}`);
      setSlug(product ? product.slug : "");
      setPrice(product ? product.price : 0);
      setRegularPrice(product ? product.regular_price : 0);
      setIsPublished(product ? product.is_published === true : false);
      setInStock(product ? product.in_stock === true : false);
      setIsOnHot(product ? Boolean(product.isOnHot) : false);
      setShortDescription(product ? product.short_description : "");
      setSortOrder(product && product.sort_order !== undefined ? product.sort_order : 0);
      
      // Clean description/features to plain text without bullet prefixes
      let initialDesc = "";
      if (product) {
        if (product.features && product.features.length > 0) {
          initialDesc = product.features.join("\n");
        } else if (product.description) {
          initialDesc = product.description
            .split("\n")
            .map((line) => line.replace(/^[•\-\*\s]+/, "").trim())
            .filter(Boolean)
            .join("\n");
        }
      }
      setDescription(initialDesc);
      setSelectedCategoryIds(
        product ? product.categories.map((c) => c.id) : (categories.length > 0 ? [categories[0].id] : [])
      );
      setImages(
        product && product.images && product.images.length > 0
          ? product.images
          : [{ id: 1, src: "", alt: "" }]
      );
      setNewImageUrl("");
      setTagsInput(
        product && product.tags ? product.tags.map((t) => t.name).join(", ") : ""
      );
      setAttributes(
        product && product.attributes ? product.attributes : []
      );
      setAttrName("");
      setAttrTerms("");
      setIsSubmitting(false);
      setErrorMsg(null);
    }
  }, [isOpen, product, categories]);

  // Auto generate slug if name changes and slug is empty
  useEffect(() => {
    if (!product && name && !slug) {
      setSlug(name.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-"));
    }
  }, [name, product, slug]);

  const handleCategoryToggle = (catId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      { id: Date.now(), src: newImageUrl.trim(), alt: name || "商品圖" }
    ]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (idxToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleMoveImage = (idx: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleUpdateImageUrl = (idx: number, newUrl: string) => {
    setImages((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], src: newUrl };
      return copy;
    });
  };

  const handleAddAttribute = () => {
    if (!attrName.trim()) return;
    const terms = attrTerms.split(",").map((t) => t.trim()).filter(Boolean);
    setAttributes((prev) => [
      ...prev,
      { id: Date.now(), name: attrName.trim(), terms }
    ]);
    setAttrName("");
    setAttrTerms("");
  };

  const handleRemoveAttribute = (attrId: number) => {
    setAttributes((prev) => prev.filter((a) => a.id !== attrId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("請輸入商品名稱");
      return;
    }

    if (selectedCategoryIds.length === 0) {
      setErrorMsg("請至少選擇一個商品分類");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Map selected categories
    const mappedCategories = categories
      .filter((c) => selectedCategoryIds.includes(c.id))
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

    // Map tags
    const mappedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t, idx) => ({ id: idx + 1, name: t, slug: t.toLowerCase().replace(/\s+/g, "-") }));

    // Filter valid images
    const validImages = images.filter((img) => img.src.trim().length > 0);
    if (validImages.length === 0) {
      validImages.push({
        id: 1,
        src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
        alt: name
      });
    }

    // Parse description into clean feature lines (each newline is treated as one item)
    const cleanLines = description
      .split("\n")
      .map((line) => line.replace(/^[•\-\*\s]+/, "").trim())
      .filter(Boolean);

    const updatedProduct: Product = {
      id: Number(id),
      name: name.trim(),
      sku: sku.trim() || `SH-${id}`,
      slug: slug.trim() || `product-${id}`,
      price: Number(price) || 0,
      regular_price: Number(regularPrice) || Number(price) || 0,
      is_published: isPublished,
      isOnHot,
      in_stock: inStock,
      short_description: shortDescription.trim(),
      description: cleanLines.join("\n"),
      features: cleanLines,
      categories: mappedCategories,
      tags: mappedTags,
      images: validImages,
      attributes: attributes,
      sort_order: Number(sortOrder)
    };

    try {
      await onSave(updatedProduct);
      onClose();
    } catch (err: any) {
      setErrorMsg(`儲存失敗: ${err.message || "發生未知錯誤"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl border border-[#E5E2D9] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E5E2D9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C8B7C]"></span>
            <h3 className="font-light font-bold text-lg text-[#2D2D2D]">
              {isEditing ? `編輯商品 #${id}` : "新增商品維護"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#EAE7DC] text-[#8A8576] hover:text-[#2D2D2D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C8B7C] border-b border-[#E5E2D9] pb-1">
              基本資訊
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                  商品名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：摩雅精油 - 快樂鼠尾草 10ml"
                  className="w-full text-sm px-3.5 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="例如：SH-ESS-001"
                  className="w-full text-sm px-3.5 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="例如：clary-sage-essential-oil"
                  className="w-full text-sm px-3.5 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C8B7C] border-b border-[#E5E2D9] pb-1">
              價格與狀態
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                  售價 (NT$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                  定價 (NT$)
                </label>
                <input
                  type="number"
                  min="0"
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                  自訂排序
                </label>
                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  placeholder="數字越小越前面"
                  className="w-full text-sm px-3.5 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="inline-flex items-center cursor-pointer gap-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-[#7C8B7C] rounded-xs border-[#D1C9BC] focus:ring-[#7C8B7C]"
                />
                <span className="text-xs font-semibold text-[#2D2D2D]">
                  上架
                </span>
              </label>
              <label className="inline-flex items-center cursor-pointer gap-2">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 text-[#7C8B7C] rounded-xs border-[#D1C9BC] focus:ring-[#7C8B7C]"
                />
                <span className="text-xs font-semibold text-[#2D2D2D]">有庫存</span>
              </label>
              <label className="inline-flex items-center cursor-pointer gap-2">
                <input
                  type="checkbox"
                  checked={isOnHot}
                  onChange={(e) => setIsOnHot(e.target.checked)}
                  className="w-4 h-4 text-[#7C8B7C] rounded-xs border-[#D1C9BC] focus:ring-[#7C8B7C]"
                />
                <span className="text-xs font-semibold text-[#2D2D2D]">熱銷推薦</span>
              </label>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C8B7C] border-b border-[#E5E2D9] pb-1">
              商品分類 <span className="text-red-500">*</span>
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-3 py-1.5 rounded-sm text-xs border font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#7C8B7C] text-white border-[#7C8B7C] shadow-xs"
                        : "bg-[#FAF9F6] text-[#6E6A5E] border-[#D1C9BC] hover:border-[#8A8576]"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image URLs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C8B7C] border-b border-[#E5E2D9] pb-1">
              商品圖片網址
            </h4>
            
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="輸入圖片網址 (例如 https://.../image.jpg)"
                className="flex-1 text-xs px-3 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 py-2 bg-[#7C8B7C] hover:bg-[#6A796A] text-white text-xs font-medium rounded-sm transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                新增網址
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {images.map((img, idx) => (
                <div key={img.id || idx} className="relative group border border-[#E5E2D9] rounded-sm p-1.5 bg-[#FAF9F6] flex flex-col justify-between min-h-[175px]">
                  <div>
                    <div className="relative h-24 bg-[#EAE7DC] rounded-xs overflow-hidden">
                      {img.src ? (
                        <img
                          src={formatImageUrl(img.src)}
                          alt={img.alt || name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8A8576]">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      
                      {/* 顯示目前圖片順序編號 */}
                      <span className="absolute top-1 left-1 bg-[#2D2D2D]/85 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-sm">
                        #{idx + 1}
                      </span>
                    </div>

                    <input
                      type="url"
                      value={img.src}
                      onChange={(e) => handleUpdateImageUrl(idx, e.target.value)}
                      placeholder="圖片網址 (e.g. https://...)"
                      className="w-full text-[10px] px-1.5 py-1 border border-[#D1C9BC] rounded-xs mt-2 focus:outline-none focus:border-[#7C8B7C] bg-white text-[#2D2D2D] font-mono"
                      title="直接在此編輯圖片網址"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#E5E2D9]">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, "left")}
                        className={`p-1.5 rounded-sm border transition flex items-center justify-center ${
                          idx === 0
                            ? "text-gray-300 border-gray-100 cursor-not-allowed bg-transparent"
                            : "text-[#6E6A5E] border-[#D1C9BC] hover:bg-[#EAE7DC] active:bg-[#D5D0C1] bg-white cursor-pointer"
                        }`}
                        title="往左移 (排序往前)"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMoveImage(idx, "right")}
                        className={`p-1.5 rounded-sm border transition flex items-center justify-center ${
                          idx === images.length - 1
                            ? "text-gray-300 border-gray-100 cursor-not-allowed bg-transparent"
                            : "text-[#6E6A5E] border-[#D1C9BC] hover:bg-[#EAE7DC] active:bg-[#D5D0C1] bg-white cursor-pointer"
                        }`}
                        title="往右移 (排序往後)"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-sm transition flex items-center justify-center cursor-pointer"
                      title="移除此圖片"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Short & Full Descriptions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C8B7C] border-b border-[#E5E2D9] pb-1">
              商品簡介與文案內容
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                簡短描述 / 摘要說明
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="簡短介紹商品的主要賣點或特色..."
                className="w-full text-xs px-3 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
                詳細商品說明 (每行換行將自動視為一個項目)
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="在此直接輸入商品特色，每一行換行會自動成為獨立項目。
例如：
100% 天然精油調和
溫和配方，敏感肌適用
通過專利超音波低溫冷萃技術"
                className="w-full text-xs px-3 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C] leading-relaxed"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#2D2D2D]">
              商品標籤 (以逗號隔開)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="例如：複方精油, 漢方養生, 水療SPA, 熱銷推薦"
              className="w-full text-xs px-3 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
            />
          </div>

          {/* Attributes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C8B7C] border-b border-[#E5E2D9] pb-1">
              規格與屬性 (例如 容量: 10ml, 50ml)
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                value={attrName}
                onChange={(e) => setAttrName(e.target.value)}
                placeholder="屬性名稱 (如：容量)"
                className="w-1/3 text-xs px-3 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
              />
              <input
                type="text"
                value={attrTerms}
                onChange={(e) => setAttrTerms(e.target.value)}
                placeholder="選項 (以逗號隔開，如: 10ml, 50ml, 100ml)"
                className="flex-1 text-xs px-3 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-3 py-2 bg-[#7C8B7C] hover:bg-[#6A796A] text-white text-xs font-medium rounded-sm transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                新增屬性
              </button>
            </div>

            {attributes.length > 0 && (
              <div className="space-y-2 pt-1">
                {attributes.map((attr) => (
                  <div key={attr.id} className="flex items-center justify-between p-2 bg-[#FAF9F6] border border-[#E5E2D9] rounded-sm text-xs">
                    <div>
                      <span className="font-bold text-[#2D2D2D] mr-2">{attr.name}:</span>
                      <span className="text-[#6E6A5E]">{attr.terms.join(", ")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(attr.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E5E2D9] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-[#6E6A5E] hover:text-[#2D2D2D] bg-white hover:bg-[#EAE7DC] border border-[#D1C9BC] rounded-sm transition cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-[#7C8B7C] hover:bg-[#6A796A] rounded-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>儲存中...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditing ? "儲存更新" : "確認新增商品"}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
