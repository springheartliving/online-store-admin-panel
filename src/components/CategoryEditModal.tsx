import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Tag } from "lucide-react";
import { Category } from "../types";

interface CategoryEditModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (category: Category) => Promise<void>;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave
}) => {
  const isEditing = Boolean(category);

  const [id, setId] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when modal opens or category changes
  useEffect(() => {
    if (isOpen) {
      setId(category ? category.id : Date.now());
      setName(category ? category.name : "");
      setSlug(category ? category.slug : "");
      setIsSubmitting(false);
      setErrorMsg(null);
    }
  }, [isOpen, category]);

  useEffect(() => {
    if (!category && name && !slug) {
      setSlug(name.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-"));
    }
  }, [name, category, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("請輸入分類名稱");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const updatedCategory: Category = {
      id: Number(id),
      name: name.trim(),
      slug: slug.trim() || `category-${id}`,
    };

    try {
      await onSave(updatedCategory);
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
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl border border-[#E5E2D9] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#FAF9F6] border-b border-[#E5E2D9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#7C8B7C]" />
            <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
              {isEditing ? `編輯分類 #${id}` : "新增商品分類"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[#EAE7DC] text-[#8A8576] hover:text-[#2D2D2D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#2D2D2D] mb-1">
              名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：超音波SPA氣泡浴設備"
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
              placeholder="例如：spa-bubble-equipment"
              className="w-full text-xs px-3.5 py-2 border border-[#D1C9BC] rounded-sm focus:outline-none focus:border-[#7C8B7C]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5E2D9]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-[#6E6A5E] bg-white hover:bg-[#EAE7DC] border border-[#D1C9BC] rounded-sm transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-[#7C8B7C] hover:bg-[#6A796A] rounded-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>儲存中...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? "儲存分類" : "確認新增"}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
