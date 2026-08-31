import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, AlertCircle, Sparkles, RefreshCw, LockKeyhole } from "lucide-react";
import { Product, Category } from "./types";
import { AdminHeader, AdminTab } from "./components/AdminHeader";
import { ProductManagement } from "./components/ProductManagement";
import { CategoryManagement } from "./components/CategoryManagement";
import { ProductEditModal } from "./components/ProductEditModal";
import { CategoryEditModal } from "./components/CategoryEditModal";
import { ProductReorderModal } from "./components/ProductReorderModal";
import { BrandLogo } from "./components/BrandLogo";

import {
  fetchProductsFromFirestore,
  fetchCategoriesFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore
} from "./lib/firebase";

function normalizeProducts(data: unknown): Product[] {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const product = item as Product;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      regular_price: product.regular_price,
      is_published: product.is_published === true,
      isOnHot: product.isOnHot === true,
      short_description: product.short_description,
      description: product.description,
      features: product.features,
      categories: product.categories,
      tags: product.tags,
      images: product.images.map(({ id, src }) => ({ id, src })),
      attributes: product.attributes,
      in_stock: product.in_stock === true,
      sort_order: product.sort_order
    };
  });
}

function normalizeCategories(data: unknown): Category[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      const category = item as Category;
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        sort_order: category.sort_order
      };
    })
    .sort((a, b) => {
      const orderA = a.sort_order !== undefined ? a.sort_order : a.id;
      const orderB = b.sort_order !== undefined ? b.sort_order : b.id;
      return orderA - orderB;
    });
}

const ACCESS_STORAGE_KEY = "spring-heart-admin-unlocked";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGateReady, setIsGateReady] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [gateError, setGateError] = useState<string>("");

  const expectedPassword = useMemo(() => (import.meta.env.VITE_ENTRY_PASSWORD ?? "").trim(), []);

  useEffect(() => {
    const isLocalDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const savedUnlockState = localStorage.getItem(ACCESS_STORAGE_KEY) === "true";
    setIsUnlocked(isLocalDev || savedUnlockState);
    setIsGateReady(true);
  }, []);

  const handleUnlock = () => {
    if (!expectedPassword) {
      setGateError("尚未設定密碼");
      return;
    }

    if (passwordInput === expectedPassword) {
      localStorage.setItem(ACCESS_STORAGE_KEY, "true");
      setIsUnlocked(true);
      setGateError("");
      setPasswordInput("");
      return;
    }

    setGateError("密碼錯誤");
    setPasswordInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_STORAGE_KEY);
    setIsUnlocked(false);
    setPasswordInput("");
    setGateError("");
  };

  // Active admin tab
  const [activeTab, setActiveTab] = useState<AdminTab>("products");

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Reorder modal state
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load Firestore data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const fsProducts = await fetchProductsFromFirestore();
        const fsCategories = await fetchCategoriesFromFirestore();

        setProducts(normalizeProducts(fsProducts));
        setCategories(normalizeCategories(fsCategories));
      } catch (err) {
        console.error("Error loading Firestore data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Product CRUD
  const handleSaveProduct = async (productToSave: Product) => {
    try {
      await saveProductToFirestore(productToSave);
      setProducts((prev) => {
        const existingIdx = prev.findIndex((p) => p.id === productToSave.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = productToSave;
          return next;
        }
        return [productToSave, ...prev];
      });
      showToast(editingProduct ? `已成功更新商品「${productToSave.name}」` : `已新增商品「${productToSave.name}」`);
    } catch (err: any) {
      showToast(`商品儲存失敗: ${err.message}`, "error");
      throw err;
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    if (!window.confirm(`確定要刪除商品「${target.name}」(#${productId}) 嗎？此操作無法撤銷。`)) {
      return;
    }

    try {
      await deleteProductFromFirestore(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(`已刪除商品「${target.name}」`);
    } catch (err: any) {
      showToast(`刪除商品失敗: ${err.message}`, "error");
    }
  };

  const handleTogglePublished = async (product: Product) => {
    const updated = { ...product, is_published: product.is_published !== true };
    try {
      await saveProductToFirestore(updated);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      showToast(`商品「${product.name}」已切換為 ${updated.is_published ? "【上架】" : "【下架】"}`);
    } catch (err: any) {
      showToast(`修改上架狀態失敗: ${err.message}`, "error");
    }
  };

  const handleToggleStock = async (product: Product) => {
    const updated = { ...product, in_stock: product.in_stock !== true };
    try {
      await saveProductToFirestore(updated);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      showToast(`商品「${product.name}」庫存狀態已切換為 ${updated.in_stock ? "【有庫存】" : "【無庫存】"}`);
    } catch (err: any) {
      showToast(`修改庫存狀態失敗: ${err.message}`, "error");
    }
  };

  const handleDuplicateProduct = (product: Product) => {
    const newId = Date.now();
    const cloned: Product = {
      ...product,
      id: newId,
      name: `${product.name} (複製)`,
      sku: `${product.sku}-COPY`,
      slug: `${product.slug}-copy-${Math.floor(Math.random() * 1000)}`
    };
    setEditingProduct(cloned);
    setIsProductModalOpen(true);
  };

  // Category CRUD
  const handleSaveCategory = async (categoryToSave: Category) => {
    try {
      await saveCategoryToFirestore(categoryToSave);
      const changedProducts = products.filter((product) =>
        product.categories.some((category) => category.id === categoryToSave.id)
      ).map((product) => ({
        ...product,
        categories: product.categories.map((category) =>
          category.id === categoryToSave.id
            ? { id: categoryToSave.id, name: categoryToSave.name, slug: categoryToSave.slug }
            : category
        )
      }));

      if (editingCategory && changedProducts.length > 0) {
        await Promise.all(changedProducts.map((product) => saveProductToFirestore(product)));
        setProducts((prev) => prev.map((product) =>
          changedProducts.find((changedProduct) => changedProduct.id === product.id) ?? product
        ));
      }

      setCategories((prev) => {
        const next = [...prev];
        const existingIdx = next.findIndex((c) => c.id === categoryToSave.id);
        if (existingIdx >= 0) {
          next[existingIdx] = categoryToSave;
        } else {
          next.push(categoryToSave);
        }
        return next.sort((a, b) => {
          const orderA = a.sort_order !== undefined ? a.sort_order : a.id;
          const orderB = b.sort_order !== undefined ? b.sort_order : b.id;
          return orderA - orderB;
        });
      });
      showToast(editingCategory ? `已成功更新分類「${categoryToSave.name}」` : `已新增分類「${categoryToSave.name}」`);
    } catch (err: any) {
      showToast(`分類儲存失敗: ${err.message}`, "error");
      throw err;
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    const target = categories.find((c) => c.id === categoryId);
    if (!target) return;
    if (!window.confirm(`確定要刪除分類「${target.name}」(#${categoryId}) 嗎？`)) {
      return;
    }

    try {
      await deleteCategoryFromFirestore(categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      showToast(`已刪除分類「${target.name}」`);
    } catch (err: any) {
      showToast(`刪除分類失敗: ${err.message}`, "error");
    }
  };

  const publishedCount = useMemo(() => products.filter((p) => p.is_published).length, [products]);
  const inStockCount = useMemo(() => products.filter((p) => p.in_stock === true).length, [products]);

  if (!isGateReady) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#6E6A5E] text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin" />
          載入中...
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#F5F1EA] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-[#E5E2D9] bg-white shadow-sm p-6 sm:p-7">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-lg bg-[#FAF8F2] border border-[#E5E2D9] p-2 flex items-center justify-center">
              <BrandLogo className="w-full h-full text-[#2E4F2D]" />
            </div>
          </div>

          <div className="text-center mb-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8A8576] font-semibold">Spring Heart Living</p>
            <h1 className="mt-2 text-2xl font-bold text-[#2D2D2D]">後台維護</h1>
          </div>

          <label className="block text-xs font-semibold text-[#2D2D2D] mb-2">請輸入密碼</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8576]" />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUnlock();
                }
              }}
              placeholder="輸入密碼"
              className="w-full rounded-sm border border-[#D1C9BC] bg-[#FAF9F6] pl-9 pr-3 py-2.5 text-sm text-[#2D2D2D] placeholder:text-[#8A8576] focus:outline-none focus:border-[#7C8B7C]"
            />
          </div>

          {gateError && (
            <div className="mt-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {gateError}
            </div>
          )}

          <button
            type="button"
            onClick={handleUnlock}
            className="mt-5 w-full rounded-sm bg-[#7C8B7C] hover:bg-[#6A796A] text-white font-bold text-sm px-4 py-2.5 transition"
          >
            進入後台
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2D2D2D] font-sans antialiased flex flex-col">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`px-4 py-3 rounded-md shadow-xl border text-xs font-bold flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-[#2E4F2D] text-white border-[#2E4F2D]"
              : "bg-red-700 text-white border-red-800"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <AdminHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalProducts={products.length}
        publishedCount={publishedCount}
        inStockCount={inStockCount}
        totalCategories={categories.length}
        onQuickAddProduct={() => {
          setEditingProduct(null);
          setIsProductModalOpen(true);
        }}
        onQuickAddCategory={() => {
          setEditingCategory(null);
          setIsCategoryModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#7C8B7C] animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#6E6A5E]">正在讀取 Firestore 資料庫內容...</p>
          </div>
        ) : (
          <>
            {/* Tab 1: Products */}
            {activeTab === "products" && (
              <ProductManagement
                products={products}
                categories={categories}
                onAddProduct={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                onEditProduct={(product) => {
                  setEditingProduct(product);
                  setIsProductModalOpen(true);
                }}
                onDuplicateProduct={handleDuplicateProduct}
                onDeleteProduct={handleDeleteProduct}
                onTogglePublished={handleTogglePublished}
                onToggleStock={handleToggleStock}
                onOpenReorder={() => setIsReorderModalOpen(true)}
              />
            )}

            {/* Tab 2: Categories */}
            {activeTab === "categories" && (
              <CategoryManagement
                categories={categories}
                products={products}
                onAddCategory={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                onEditCategory={(category) => {
                  setEditingCategory(category);
                  setIsCategoryModalOpen(true);
                }}
                onDeleteCategory={handleDeleteCategory}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E2D9] py-6 text-center text-xs text-[#8A8576]">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-light">泉心生活 Spring Heart Living - 後台維護系統</p>          
        </div>
      </footer>

      {/* Product Edit / Add Modal */}
      <ProductEditModal
        isOpen={isProductModalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
      />

      {/* Category Edit / Add Modal */}
      <CategoryEditModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
      />

      {/* Product Custom Sorting Modal */}
      <ProductReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        onSaveSuccess={(updatedProducts) => {
          setProducts(updatedProducts);
          showToast("商品自訂順序已成功寫入 Firestore 資料庫並套用排序！");
        }}
      />

    </div>
  );
}
