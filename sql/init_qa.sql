INSERT INTO question(question, answer) VALUES('アイコンの意味がわかりません。', 'Helpを参照下さい。');
INSERT INTO question(question, answer) VALUES('いつまで開発は続くのでしょうか。', '私が敗北を認めるまで続きます。');
INSERT INTO question(question, answer) VALUES('英語で表示されません。', '?lang=ja をURLに付加するとAccept-Languageヘッダーを弄らずに英語表記に切り替えることが出来ます。');
INSERT INTO question(question, answer) VALUES('いつ開発しているのでしょうか。', '通勤/食事/睡眠の合間に設計し仕事の合間に実装しています。');
INSERT INTO question(question, answer) VALUES('対応ブラウザは何ですか。', 'デスクトップ通知（拡張機能）を含むすべての機能が利用出来るのはGoogle Chromeだけですが、基本的な機能は他のブラウザでもご利用頂けます。</p>');
INSERT INTO question(question, answer) VALUES('質問に投稿しても反映されません。', '私が回答するまで反映されません。');
INSERT INTO question(question, answer) VALUES('依頼者←担当者←依頼者とアイコンが並ぶのは逆ではないでしょうか。', '左端にキーマンが揃うように設計している為、右から左の流れでアイコンが並んでいます。');

UPDATE question SET is_public = 1;
