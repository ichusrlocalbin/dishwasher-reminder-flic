# ボタンを押した経過時間に応じて光の色を変える

## 使用用途

* 食洗機のスイッチ入れ忘れのリマインダ

## なぜ?

* [http://ichusrlocalbin.github.io/dishwasher-reminder](http://ichusrlocalbin.github.io/dishwasher-reminder) 参照

## 機能

* flicでボタンを押したらherokuにその時刻を通知
* herokuから取得した状態に応じて、milightの光の色を変更

## 環境

### flic

* raspberry-pi 3 model B  
  flicを登録したiphoneがないと動作せず、自分が不在時に家族が使えないので、raspberry piを使うようにした。
* ライブラリ: https://github.com/50ButtonsEach/fliclib-linux-hci

### milight

* ライブラリ: https://github.com/oeuillot/node-milight

## 試行錯誤

### milightコマンド送信間隔

* milightを設置した玄関は、人感センサーで点灯する。
* 点灯していないときにmilightのコマンドを送っても無視される。
* いつ点灯しているかはコマンド送信側では分からない。
* 随時コマンドを送信し続ける必要がある。
* この送信間隔が長いと、人感センサーが感知してから点灯し、光の色が変わるまでの時間が遅くなる。

### リマインダの色

* 聞き取り調査の結果、白の点滅が、リマインダとして一番良かった。これを実現するためには、(白など固定の色(Discoモード以外の色)に設定後)、Discoモードの信号を2回連続で送る必要がある。
* 1回目のDiscoモード信号が赤で、2回目の信号を送る間に、この色が入り煩わしいので、諦めた。
* 2つライトがつけられたので、1つは白色灯を、残りにmilightを設置し、milightは固定の光にすることで、煩わしくない色、かつ、リマインダとして気づける色にした。

## 準備

あらかじめ、次のコマンドで、 `flic.sqlite3` ファイルを作成しておく。

```
sudo setcap cap_net_admin=ep fliclib-linux-hci/bin/armv6l/flicd # root以外で実行できるように
fliclib-linux-hci/bin/armv6l/flicd -f flic.sqlite3 -f flic.sqlite3
liclib-linux-hci/clientlib/nodejs/newscanwizard.js
```

7秒押せと言われたから、7秒押しつづけると、 `flic.sqlite3` に登録される。

## 実行

```
fliclib-linux-hci/bin/armv6l/flicd -f flic.sqlite3 & node dishwasher.js
```

## Dockerで実行

### imageの作成

```
sudo docker build -t dishwasher .
```

### boot時に自動起動

* 参考: https://docs.docker.com/engine/admin/host_integration/

`/etc/systemd/system/docker-dishwasher.service` を追加

```
[Unit]
Description=Dishwasher container
Requires=docker.service
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker run -e URL=<dishwasher-reminder-home-statusが動いているherokuとかのURL> --privileged --net=host --name dw dishwasher node
ExecStop=/usr/bin/docker stop -t 2 dw
ExecStopPost=/usr/bin/docker rm -f dw

[Install]
WantedBy=default.target
```

変更時の起動

```
sudo systemctl daemon-reload
sudo systemctl start docker-dishwasher.service
```

boot時に有効化

```
sudo systemctl enable docker-dishwasher.service
```
