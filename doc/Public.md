# 公開用JSON/JSONPフォーマット

http://jsonviewer.stack.hu/ あたりで構造を確認すると楽です。

## 構造

    { ... List
        tasks: [
            { ... Task
                actions: [
                    { ... Action
                        action: 'create-task' ... Action Code
                    }
                ]
            }
        ],
        users: [
            { ... User
                code: 'tw-XXXXX' ... User Code
            }
        ],
        members: [
            'tw-XXXXX', ... User Code
            'tw-XXXXX',
        ]
    }

## List

    id ... リストID
    name ... リスト名
    owner ... リストオーナー (形式:ユーザーコード)
    members ... リストメンバー (形式:ユーザーコードの配列)
    tasks ... タスク (項Task参照)
    users ... ユーザー (項User参照, 関係者のメタ情報でコードからアイコンや名前を引く際使用）
    public_code ... 公開URLに使用されているコード
    last_task_id ... 新しいタスクIDを生成する際に使用する値
    actioned_on ... 最終更新日時（形式:ミリ精度のUNIX TIME）

## User

    icon ... アイコンURL
    name ... 名前
    code ... ユーザーコード

## Task

    id ... タスクID
    name ... タスク名
    status ... 0: 未着手, 1: 処理中, 2: 処理済
    closed ... 0: 未完了, 1: 完了済
    registrant ... 登録者 (形式:ユーザーコード)
    assign ... 担当者 (形式:ユーザーコードの配列)
    actions ... コメント (Actionの配列、項Action参照)
    due ... 期日 (形式:MM/DD/YYYY)
    created_on ... 作成日時（形式:ミリ精度のUNIX TIME）
    updated_on ... 更新日時（形式:ミリ精度のUNIX TIME）

## Action

    id ... アクションID（タスク内ユニーク）
    code ... アクション者 (形式:ユーザーコード)
    action ... 操作内容 (項Action Code参照)
    message ... コメント内容
    time ... アクション日時

## Action Code

    create-task    ... タスクを作成
    update-task    ... タスクを更新
    reopen-task    ... タスクを更新 (処理済 ... 未着手)
    start-task     ... タスクに着手
    fix-task       ... タスクを処理
    close-task     ... タスクを完了
    rereopen-task  ... タスクを更新 (完了 ... 未着手)
    restart-task   ... タスクを更新 (処理済 ... 着手)
    refix-task     ... タスクを更新 (完了 ... 処理済)
    comment        ... コメント
