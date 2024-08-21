# Symbol Node Watcher Peer対応版

## 何が出来るのか

設定したノードの稼働を監視します。
もし、他のノードと大きくブロック高が離れていたら`symbol-bootstrap`を`stop`し`run -d`します。また、設定していれば Discord にて通知します。

なお、本ライブラリは自身で使うために作成したものです。不具合等一切の責任は取りませんことをあらかじめご了承ください。
MIT ライセンスです、お好きにご利用ください。

## Install

```sh
git clone https://github.com/ccHarvestasya/symbol-node-watcher.git
cd symbol-node-watcher
npm i
npm run build
sudo npm i -g .
```

### 証明書

動いているノードの証明書は使用できないので、別途 simple-symbol-node-cert-cli などで証明書を作成してください。

```sh
sudo npm i -g simple-symbol-node-cert-cli
simple-symbol-node-cert-cli generate --nodedays 7300
```

## Usage

### `config` の設定

以下雛形に沿って`config.json`を作成してください。もしくはライブラリ内にある`config.json`を編集してください。場所はどこでも良いです（起動時にパスを指定する）

```json
{
  "nodePath": "/home/user/symbol-node",
  "discordWebhookUrl": "https://discord.com/api/webhooks/1247840486480****/xwcTXEKBL-NC9fXoByZZbb-s5A8qxLAhmD5ikToCBwz79aX3WBYWEF3k7xX4M******",
  "cronExpression": "0 0 * * * *",
  "symbolServiceUrl": "https://symbol.services/nodes?filter=suggested&limit=5",
  "differenceHeight": 5,
  "differenceFinHeight": 100,
  "stopCommand": "symbol-bootstrap stop",
  "runCommand": "symbol-bootstrap run -d",
  "enablePeerCheck": false,
  "peerPort": 7900,
  "certPath": "cert"
}
```

- `nodePath` あなたのノードのパスです。普段`symbol-bootstrap` コマンドを実行している箇所。
- `discordWebhookUrl` Discord 通知用の WebhookURL を設定してください。空だと何も起こりません。

  `サーバー設定 -> 連携サービス -> ウェブフック` で新たなウェブフックを作成可能です。

- `cronExpression` cron の設定。秒/分/時/日/月/曜日。
- `symbolServiceUrl` ここから他のノードの情報を取得しています、基本的にはこのままで良い。ここが停止すると使えない。
- `differenceHeight` 他のノード群の最大ブロックと自分のブロックの差がこれ以上になると異常と判断します。
- `differenceFinHeight` 他のノード群の最大ファイナライズと自分のファイナライズの差がこれ以上になると異常と判断します。
- `stopCommand` bootstrap の場合はこのままで OK。
- `runCommand` bootstrap の場合はこのままで OK。
- `enablePeerCheck` Peer ノードの場合、`true`にする。
- `peerPort` 7900 で OK。
- `certPath` symbol-node-configurator などで作成した証明書の場所。

### 起動

```sh
symbol-node-watcher start /path/to/config.json
```

or

```sh
symbol-node-watcher start
```

もしライブラリ内の config.json を書き換えた場合はオプションの config.json へのパスは不要です。

### 停止

```sh
symbol-node-watcher stop
```

## こういうときは？

### ブロック高取得が失敗する

ノードの設定の`trustedHosts`に`172.20.0.1`を追加する。

```yml
trustedHosts: 127.0.0.1, 172.20.0.1
```

### ブロック高取得が*たまに*失敗する

#### 別ツールで証明書を使用している場合

別ツールで使用している証明書を流用してください。  
同IP、別証明書の場合、リジェクト対象となります。

## さいごに

fork 元を作ってくれた toshi さんに感謝。
