# 錬金店経営ゲーム（3日プロトタイプ）

## 起動手順
1. このフォルダで `python3 -m http.server 8000` を実行
2. ブラウザで `http://localhost:8000` を開く

## 構成
- `index.html`: 画面構造（タイトル/ゲーム/リザルト）
- `style.css`: UIスタイル
- `main.js`: ゲームロジック（曜日進行、依頼、納品、錬金、販売、セーブ）

## セーブ
- `localStorage` キー: `alchemy_shop_save_v1`
- タイトル画面「つづきから」でロード、リセットで削除
