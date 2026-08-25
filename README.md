# Online Store Admin Panel
**泉心生活 Spring Heart Living — 商品後台管理系統**

管理員後台，用於管理 Firestore 資料庫中的商品與分類。

---

## Tech Stack

| 技術 | 版本 |
|------|------|
| React | 19 |
| TypeScript | 5.8 |
| Vite | 6 |
| Tailwind CSS | 4 |
| Firebase / Firestore | 12 |
| lucide-react | 0.546 |
| motion | 12 |

---

## 本地開發

### 1. 安裝套件

```bash
npm install
```

### 2. Firebase 設定

Firebase 設定已硬編碼於 `firebase-applet-config.json`，不需要額外設定。

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:5173](http://localhost:5173)

### 4. TypeScript 型別檢查

```bash
npm run type-check
```

---

## 建置

```bash
npm run build
```

輸出至 `dist/` 資料夾。可用以下指令預覽：

```bash
npm run preview
```

---

## 部署

### GitHub Pages（自動部署）

每次 push 到 `main` branch 即自動觸發 GitHub Actions 部署：

1. Runner 執行 `npm ci` + `npm run type-check` + `npm run build`
2. 建置產物推送至 `gh-pages` branch
3. 發布至 `https://<your-username>.github.io/online-store-admin-panel/`

**首次設定步驟：**

1. 至 GitHub Repo → **Settings** → **Pages**
2. Source 選擇 **"Deploy from a branch"**
3. Branch 選 **`gh-pages`** / `/ (root)`
4. 儲存後等待 Actions 完成即可

### 手動觸發

至 GitHub → **Actions** → **Deploy to GitHub Pages** → **Run workflow**

---

## 資料庫

使用 **Cloud Firestore** 儲存商品、分類、報價單：

| Collection | 說明 |
|------------|------|
| `products` | 商品資料（含 `sort_order` 排序欄位）|
| `categories` | 商品分類 |

Firebase Project ID: `primeval-ellipse-39brs`  
Firestore Database: `ai-studio-springheartlivin-f2a957a1-914f-42f7-afd3-33224e63e709`

---

## 專案結構

```
online-store-admin-panel/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自動部署
├── src/
│   ├── components/             # React 元件
│   ├── lib/
│   │   └── firebase.ts         # Firestore CRUD 操作
│   ├── utils/                  # 工具函式
│   ├── App.tsx                 # 主應用程式
│   ├── main.tsx
│   ├── types.ts                # TypeScript 型別定義
│   └── index.css
├── firebase-applet-config.json # Firebase 設定（公開，無 secret）
├── firestore.rules             # Firestore 安全規則
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 功能說明

- **商品管理** — 新增、編輯、刪除、複製商品，管理上架與庫存狀態，自訂排序
- **分類管理** — 新增、編輯、刪除分類，查看各分類商品數量
- **Firestore 資料** — 商品、分類與排序資料統一從 Cloud Firestore 讀寫

---

## License

Private — 泉心生活 Spring Heart Living © 2025
