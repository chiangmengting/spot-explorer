
# Spot Explorer

地図を操作しながら、指定した地点の周辺スポットを検索できる Web アプリケーションです。

提供された CSV データを PostgreSQL にインポートし、PostGIS による距離検索、地図とスポット一覧の連動、地図中心地点の住所表示を実装しています。

## 主な機能

- **周辺スポット検索**
  - 地図の中心座標を基準に、指定半径内のスポットを検索
  - 検索半径を 1 / 3 / 5 / 10 km から選択可能
  - 地図の移動・ズーム操作に応じて検索結果を更新
  - 検索範囲を地図上に円で表示

- **地図とスポット一覧の連動**
  - 検索結果を地図上のマーカーと一覧に表示
  - スポット一覧は中心地点からの距離が近い順に表示
  - 一覧からスポットを選択すると、該当地点へ地図を移動
  - マーカーの Popup にスポット情報を表示

- **地図中心地点の住所表示**
  - OpenStreetMap Nominatim API による逆ジオコーディング
  - 地図移動後に中心地点の住所を自動更新
  - API 呼び出し頻度を抑えるための Debounce・Cache を実装

- **データの自動初期化**
  - Docker Compose 起動時に Migration と Seed を自動実行
  - 提供 CSV データ 200 件を PostgreSQL にインポート
  - Seed の重複実行を防止

## 技術スタック

| 分類 | 技術 |
| --- | --- |
| Frontend | Next.js (App Router), React, TypeScript |
| UI | Tailwind CSS |
| Map | Leaflet, React Leaflet, OpenStreetMap |
| Backend | NestJS, TypeScript |
| ORM | TypeORM |
| Database | PostgreSQL 17, PostGIS 3.5 |
| Reverse Geocoding | OpenStreetMap Nominatim |
| Testing | Vitest |
| Infrastructure | Docker, Docker Compose |
| Package Manager | pnpm |

## システム構成

```text
Browser
   |
   v
Next.js (Web)
   |
   | API Rewrite
   v
NestJS (API)
   |
   +------------------------+
   |                        |
   v                        v
PostgreSQL / PostGIS     Nominatim API
   |                        |
   |                        v
   |                   住所情報の取得
   |
   v
スポットの距離検索
```

Docker Compose では、以下のサービスを使用しています。

| Service | 役割 |
| --- | --- |
| db | PostgreSQL / PostGIS |
| init | Migration・Seed の実行 |
| api | NestJS Backend |
| web | Next.js Frontend |

起動順序を制御し、データベースの初期化が完了してから API を起動する構成としています。

---

## 環境構築

### 必要環境

- Docker
- Docker Compose

Docker を利用する場合、Node.js や pnpm をホスト環境にインストールする必要はありません。

ローカルで直接開発する場合は、Node.js 26 および pnpm 12 を使用します。

### 1. リポジトリの取得

```bash
git clone <REPOSITORY_URL>
cd spot-explorer
```

`<REPOSITORY_URL>` は提出する GitHub リポジトリの URL に置き換えてください。

### 2. 環境変数の設定

プロジェクトルートで以下を実行します。

```bash
cp .env.example .env
```

`.env` の設定例：

```dotenv
POSTGRES_PASSWORD=dev_password
DB_HOST=localhost
NOMINATIM_USER_AGENT=SpotExplorerCodingTest/1.0 (contact: your-email@example.com)
```

各環境変数の用途：

| 変数 | 説明 |
| --- | --- |
| POSTGRES_PASSWORD | PostgreSQL の接続パスワード |
| DB_HOST | ローカル開発時の DB ホスト |
| NOMINATIM_USER_AGENT | Nominatim API に送信するアプリ識別情報 |

`NOMINATIM_USER_AGENT` のメールアドレスは、実際に連絡可能なアドレスへ変更してください。

`dev_password` はローカル開発用のサンプル値です。本番環境では安全なパスワードを使用してください。

`.env` は Git の管理対象から除外しています。

### 3. アプリケーションの起動

```bash
docker compose up --build
```

初回起動時は Docker Image のビルドとデータベースの初期化が実行されるため、数分かかる場合があります。

起動後、以下にアクセスしてください。

**http://localhost:3000**

バックグラウンドで起動する場合：

```bash
docker compose up -d --build
```

---

## 実行手順

### アプリケーションの操作

1. ブラウザで `http://localhost:3000` にアクセスします。
2. 地図をドラッグして検索したい地点へ移動します。
3. 右側の「検索半径」から検索範囲を選択します。
4. 検索結果が地図上のマーカーとスポット一覧に表示されます。
5. スポット一覧から項目を選択すると、該当地点へ移動して Popup を表示します。
6. 「現在の中心地点」に地図中心付近の住所が表示されます。

### コンテナの状態確認

```bash
docker compose ps -a
```

正常起動時の状態：

| Service | 状態 |
| --- | --- |
| db | Up (healthy) |
| init | Exited (0) |
| api | Up |
| web | Up |

`init` は初期化専用のサービスのため、正常終了後は `Exited (0)` になります。

### データ件数の確認

```bash
docker compose exec -T db \
  psql -U spot_user -d spot_explorer \
  -c "SELECT COUNT(*) FROM spots;"
```

提供された CSV データに基づき、200 件が登録されます。

### アプリケーションの停止

```bash
docker compose down
```

このコマンドでは PostgreSQL の Named Volume は削除されません。

データを含めて初期化する場合は `docker compose down -v` を使用できますが、保存済みデータが削除されるため注意してください。

---

## API

### スポット周辺検索

```http
GET /spots?lat=35.681236&lng=139.767125&radiusKm=3
```

| Parameter | 説明 |
| --- | --- |
| lat | 中心地点の緯度（-90 ～ 90） |
| lng | 中心地点の経度（-180 ～ 180） |
| radiusKm | 検索半径（0.1 ～ 100 km） |

レスポンス例：

```json
[
  {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "name": "東京駅",
    "category": "交通機関",
    "address": "東京都千代田区",
    "description": null,
    "location": {
      "type": "Point",
      "coordinates": [139.767125, 35.681236]
    },
    "distanceMeters": 0
  }
]
```

検索結果は中心地点からの距離が近い順に返却します。

### 逆ジオコーディング

```http
GET /geocoding/reverse?lat=35.681236&lng=139.767125
```

レスポンス例：

```json
{
  "address": "JR東京駅;10番線, 丸の内一丁目, 丸の内, 千代田区, 東京, 100-0005, 日本",
  "lat": 35.681236,
  "lng": 139.767125
}
```

住所情報は Nominatim API から取得します。

外部 API の障害やタイムアウト時には HTTP 503 を返します。

---

## 使用した主要ライブラリとその選定理由

### Next.js (App Router)

React ベースのフロントエンドフレームワークとして採用しました。

App Router によるコンポーネント構成と、API Rewrite を利用した Backend との連携が可能です。

地図表示はブラウザ API に依存するため、React Leaflet を Client Component として扱い、Dynamic Import により SSR を無効化しています。

### React Leaflet / Leaflet

地図の描画・マーカー表示・地図操作イベントの取得に採用しました。

Google Maps API と比較して、地図表示に API Key が不要であり、今回の課題に必要な機能を比較的シンプルに実装できる点を重視しました。

地図タイルには OpenStreetMap を使用しています。

### NestJS

Backend の責務を Module / Controller / Service に分離できるため採用しました。

DTO と ValidationPipe による入力値検証や、Dependency Injection によるテスト容易性も選定理由です。

### TypeORM

課題の指定技術であることに加え、Entity と Migration によってデータベース構造を管理できるため採用しました。

PostGIS の空間型・空間検索関数については、QueryBuilder と SQL 関数を組み合わせて利用しています。

### PostgreSQL / PostGIS

緯度・経度を扱う地理空間検索を効率的に実装するため採用しました。

PostGIS の `geography` 型と空間インデックスにより、指定半径内のスポット検索をデータベース側で実行しています。

### OpenStreetMap Nominatim

地図中心地点の住所取得に利用しています。

Google Geocoding API も検討しましたが、今回の開発環境とコストを考慮して Nominatim を採用しました。

公共 API の利用制限に配慮し、Backend 経由で呼び出す構成としています。

---

## 実装時に特に工夫した点、および技術的な判断を行った箇所

### 1. PostGIS による地理空間検索

スポットの位置情報は以下の型で保持しています。

```sql
geography(Point, 4326)
```

半径検索には `ST_DWithin()` を使用しています。

```sql
ST_DWithin(
  location,
  ST_SetSRID(
    ST_MakePoint(:lng, :lat),
    4326
  )::geography,
  :radiusMeters
)
```

また、距離の計算には `ST_Distance()` を使用しています。

`geography` 型では距離をメートル単位で扱えるため、検索半径を km から m に変換して利用しています。

さらに GiST インデックスを設定し、検索対象の絞り込みを効率化しています。

アプリケーション側で全件取得して距離を計算する方式ではなく、データベース側で検索を完結させる設計としました。

### 2. Docker Compose による自動初期化

初期データの登録を手動操作に依存させないため、初期化専用の `init` Service を設けました。

```text
db (healthy)
    |
    v
init
    |
    +-- TypeORM Migration
    |
    +-- CSV Seed
    |
    v
api
    |
    v
web
```

`depends_on` の `service_healthy` と `service_completed_successfully` を利用し、初期化処理が成功した後に API が起動する構成としています。

また、Seed 実行時に既存データを確認し、データが存在する場合は重複登録を避けています。

全くデータのない新規 Docker Volume からの起動テストも実施しました。

### 3. Reverse Geocoding API の呼び出し最適化

Nominatim の公共 API へのアクセスを抑えるため、Frontend と Backend の両方で制御を実装しました。

**Frontend**

- 地図移動後の住所取得に 1.5 秒の Debounce を設定
- `AbortController` により不要になったリクエストをキャンセル
- 住所取得中・取得失敗時の表示を分離

**Backend**

- 24 時間のインメモリ Cache
- 最大 1,000 件の Cache 保持
- 座標の小数点以下 3 桁による Cache Key の正規化
- 同一地点への同時リクエストの統合
- 外部 API リクエストの直列化
- リクエスト開始間隔を最低 1.1 秒に制御
- 8 秒の Timeout

これにより、同じ地点への繰り返しアクセスや短時間の連続操作による外部 API 呼び出しを削減しています。

なお、現在の Cache と Rate Limiting は単一 Backend Process 内での制御です。

### 4. 地図とスポット一覧の状態共有

地図とスポット一覧が別々に API を呼び出す構成を避けるため、共通の親コンポーネントである `SpotExplorer` に検索状態を集約しました。

主に以下の State を管理しています。

- 地図中心座標
- 検索半径
- スポット検索結果
- 選択中スポット
- Loading / Error
- 中心地点の住所

これにより、地図と一覧で同じ検索結果を利用しています。

また、スポット一覧の選択イベントと検索結果の更新を区別し、検索結果更新時に不要な `flyTo()` が実行されないようにしています。

### 5. API 入力値の検証

NestJS の DTO と ValidationPipe を利用し、緯度・経度・検索半径の入力値を検証しています。

不正な入力値や想定外の Query Parameter は HTTP 400 として処理します。

### 6. データベース構造の管理

TypeORM の `synchronize` は無効化しています。

```typescript
synchronize: false
```

データベースの変更は Migration で管理し、環境ごとの Schema の再現性を確保しています。

---

## テスト

### Backend

```bash
cd apps/api

pnpm exec tsc --noEmit
pnpm exec eslint src
pnpm exec vitest run
```

以下の内容を検証しています。

- Controller から Service へのパラメータ受け渡し
- 検索半径の km → m 変換
- 距離による昇順ソートの指定
- Reverse Geocoding の Cache
- 同一座標への同時リクエストの統合
- 外部 API の直列実行とリクエスト間隔

外部 API は Mock を使用しており、Unit Test では Nominatim への実リクエストは発生しません。

### Frontend

```bash
cd apps/web

pnpm exec tsc --noEmit
pnpm exec eslint src
pnpm build
```

### API Validation

正常な検索パラメータで HTTP 200 が返ること、不正な緯度・経度・検索半径や必須パラメータ不足で HTTP 400 が返ることを確認しています。

### Docker Compose

新規 Docker Compose Project と空の PostgreSQL Volume を利用し、以下を確認しています。

- PostgreSQL / PostGIS の初期化
- Migration の自動実行
- CSV データ 200 件の自動登録
- NestJS / Next.js の正常起動
- Frontend から Backend API への接続

---

## 時間が足りず実装を簡略化した箇所や、今後の改善点

### 1. Cache の永続化・共有

現在の Reverse Geocoding Cache は NestJS Process 内のメモリで管理しています。

そのため、Container の再起動時に Cache が失われます。

複数 Instance で運用する場合は、Redis などの共有 Cache を導入することを検討します。

Rate Limiting についても、複数 Instance 間で制御できる仕組みが必要です。

### 2. Seed の Upsert 対応

現在の Seed は、既存データが存在する場合に処理をスキップする簡易方式です。

今後はスポットごとの安定した識別子を導入し、Upsert による追加・更新に対応することで、部分的なデータ登録や差分更新にも対応できるようにしたいと考えています。

### 3. フロントエンドの検索 Cache

現在は Debounce と `AbortController` によって API 呼び出しを制御しています。

今後は TanStack Query などを利用し、検索条件に応じた Cache、リクエストの重複排除、再取得制御を追加することを検討しています。

### 4. Reverse Geocoding の運用

Nominatim の公共 API には利用制限があります。

現在は単一 Process でのリクエスト制御を実装していますが、公開サービスとして多数のユーザーが利用する場合は、共有 Rate Limiting、Queue 長の制限、アクセス制御などが必要です。

また、地図操作中は中心座標を更新し、住所は移動停止後に取得する設計としています。

より高頻度な住所表示が必要な場合は、商用 Geocoding API や専用サービスの利用を検討します。

### 5. テストの拡充

現在は主要な Backend の Unit Test と手動の動作確認を実施しています。

今後は以下の追加を検討しています。

- PostGIS を使用した Integration Test
- API の E2E Test
- Playwright による地図操作の E2E Test
- 外部 API 障害時のテスト
- Frontend の Component Test

### 6. 大量データへの対応

今回のデータは 200 件ですが、データ量が増えた場合は、検索結果のページネーションやマーカーのクラスタリングを検討します。

---

## 補足事項

- 本アプリケーションは Coding Test 用の実装です。
- PostgreSQL のポートはローカルホストのみに公開しています。
- API Key やパスワードなどの機密情報は `.env` で管理し、Git には含めません。
- 地図タイルと住所情報には OpenStreetMap 関連サービスを使用しています。
- 公開環境で利用する場合は、各サービスの利用ポリシーに従ったアクセス制御・キャッシュ・リクエスト制限が必要です。

地図データ・住所データ © OpenStreetMap contributors
