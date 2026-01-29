# Synapstellar 🌌

あなたの読書体験を宇宙の星々として可視化するWebアプリケーション。

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS
- **3Dビジュアライゼーション**: Three.js + React Three Fiber
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **ホスティング**: Vercel

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 環境変数

`.env.local` ファイルに以下を設定してください：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## ディレクトリ構造

```
src/
├── app/           # App Router ページ
├── components/    # UIコンポーネント
├── lib/           # ユーティリティ、Supabaseクライアント
├── hooks/         # カスタムフック
└── types/         # TypeScript型定義
```
