# Online Store Admin Panel

泉心生活 Spring Heart Living — 商品後台管理系統

這個專案是一個 React + Vite + Firebase 的後台管理介面，用於管理商品、分類與自訂排序，並直接同步到 Firestore。

---

## 功能總覽

- 商品維護：新增、編輯、刪除、複製商品
- 分類維護：新增、編輯、刪除分類
- 商品自訂排序：以拖曳或箭頭方式調整排序
- 各分類商品數量統計
- 商品/分類排序欄位支援 `sort_order`
- 內建圖片失敗回退圖示
- 背景 modal 鎖定頁面滾動

---

## 技術堆疊

- React 19
- TypeScript 5.8
- Vite 6
- Tailwind CSS 4
- Firebase / Firestore
- lucide-react

---

## 專案結構

```bash
online-store-admin-panel/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
├── src/
│   ├── components/
│   │   ├── AdminHeader.tsx
│   │   ├── BrandLogo.tsx
│   │   ├── CategoryEditModal.tsx
│   │   ├── CategoryManagement.tsx
│   │   ├── ProductEditModal.tsx
│   │   ├── ProductManagement.tsx
│   │   └── ProductReorderModal.tsx
│   ├── lib/
│   │   └── firebase.ts
│   ├── utils/
│   │   ├── categoryHelpers.ts
│   │   ├── formatters.ts
│   │   └── image.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
├── README.md
└── .gitignore
```

---

## 安裝與啟動

### 1) 安裝依賴

```bash
npm install
```

### 2) 啟動開發伺服器

```bash
npm run dev
```

### 3) 型別檢查

```bash
npm run type-check
```

### 4) 建置正式檔

```bash
npm run build
```

### 5) 預覽建置結果

```bash
npm run preview
```

---

## Firebase 設定

專案目前使用 Firestore 直接讀寫資料，並依賴下列設定檔：

- `firebase-applet-config.json`
- `firebase-blueprint.json`
- `firestore.rules`

若你要在本機或部署環境重用，請確認 Firebase 專案與 Firestore collection 名稱一致，尤其是：

- `products`
- `categories`

---

## 主要資料模型

### Product

- `id`
- `name`
- `slug`
- `sku`
- `price`
- `regular_price`
- `is_published`
- `in_stock`
- `images`
- `categories`
- `tags`
- `attributes`
- `sort_order?`

### Category

- `id`
- `name`
- `slug`
- `sort_order?`

---

## 發布與部署

目前專案支援 Vite build，並可部署至靜態站點或 GitHub Pages / Vercel / Netlify 等平台，部署前請先執行：

```bash
npm run build
```

---

## 注意事項

- `sort_order` 是用來控制商品與分類顯示順序的主要欄位。
- 若商品圖片網址失效，系統會顯示統一的圖片佔位 icon，而不是顯示看起來像真圖的錯誤內容。
- modal 打開時會鎖定背景捲動，避免使用者在對話框內被底層頁面干擾。

---

## 授權

本專案為私人專案，僅供泉心生活 Spring Heart Living 內部後台維護使用。
