# Web制作 案件台帳 — デプロイ済み設定

## Supabase
- プロジェクト: Web制作 案件台帳
- リージョン: ap-northeast-1（東京）
- URL: https://ehovgxyqlongollwyrml.supabase.co

## Netlify デプロイ手順

### ① GitHubにpush
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_NAME/webstudio-ledger.git
git push -u origin main
```

### ② Netlifyと連携
1. app.netlify.com → Add new site > Import an existing project
2. GitHubリポジトリを選択
3. Build settings:
   - Build command: `node build.js`
   - Publish directory: `.`
4. Deploy site

### ③ Resend設定後（メール機能を有効化する場合）
Site settings > Environment variables に追加:
- RESEND_API_KEY = re_xxxxxxxxxxxx
- RESEND_FROM_EMAIL = noreply@yourdomain.com
→ Trigger deploy で反映

## テーブル
- clients（取引先）
- projects（案件）
