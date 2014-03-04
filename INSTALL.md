# 7kai Tasks for Windows

Windows 7 32bit版で検証しました。

## MySQL及びPerlインストール
- [strawberry-perl-5.18.0.1-32bit.msi](http://strawberryperl.com/) をインストール
- [mysql-installer-community-5.6.13.0.msi](http://dev.mysql.com/downloads/mysql/) をインストール

## システムの環境変数 PATH の先頭に以下を追加

	C:\Program Files\MySQL\MySQL Server 5.6\bin;

http://screen.chihaya-pm.org/aa0619c398ac9f171f6f0d94019cab75.png

## MySQLユーザー作成

MySQL 5.6 Command Line Clientを開き、ODBC@localhostというユーザーを作成（パスワードなし）

	GRANT ALL PRIVILEGES ON test.* TO ODBC@localhost IDENTIFIED BY 'dummy';
	SET PASSWORD FOR ODBC@localhost = '';

	CREATE DATABASE tasks DEFAULT CHARSET utf8;
	GRANT ALL PRIVILEGES ON tasks.* TO tasks@localhost IDENTIFIED BY 'dummy';
	SET PASSWORD FOR tasks@localhost = '';
	FLUSH PRIVILEGES;
	quit;

## 7kai Tasksインストール

7kai TasksをzipでDownloadし、デスクトップに伸長します、8/8 17:00以降のものをご利用下さい。

コマンドプロンプトを開き、依存モジュール群をインストール

	cd Desktop\7kai-Tasks-master
	cpanm Carton
	cpanm Module::CoreList
	cpanm -L local http://strawberryperl.com/package/kmx/perl-modules-patched/Crypt-OpenSSL-Random-0.04_patched.tar.gz
	cpanm -L local --force http://strawberryperl.com/package/kmx/perl-modules-patched/DBD-mysql-4.021_patched.tar.gz
	carton install

## DBを初期化

	mysql -u tasks tasks < sql\my.sql

## 設定ファイルを編集

### config/development.pl

	use DoubleSpark::Config;
	my $config = DoubleSpark::Config->new({
	    base_url => 'http://127.0.0.1:5000'
	});
	$config->{DB}->[0] = 'dbi:mysql:dbname=tasks'; # DB名
	$config->{DB}->[1] = 'tasks'; # DB接続ユーザー名
	$config->{DB}->[2] = ''; # DB接続パスワード
	$config;

## 起動

	carton exec -- local\bin\plackup

起動後、ブラウザで http://127.0.0.1:5000 にアクセスすると7kai Tasksが開きます。

これでGoogle OpenIDによるSignInは使えるようになったと思います。

TwitterやFacebookアカウントによるSignInを有効にする場合、以下のファイルが必要です。

- config\tw.key ... Consumer key
- config\tw.secret ... Consumer secret
- config\fb.key ... アプリID / APIキー
- config\fb.secret ... アプリのシークレットキー

それぞれ一行で末尾に改行を含めず書き込んで下さい。

## Apacheを通す場合

以下の用な感じでリバースプロキシー出来ます。

	<VirtualHost *:80>
		ServerName  tasks.example.com
		ProxyPass / http://127.0.0.1:5000/
		ProxyPassReverse / http://127.0.0.1:5000/
	</VirtualHost>