CREATE TABLE account (
    account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , name TEXT NOT NULL
    , last_login DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;
CREATE TABLE tw_account (
    tw_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , user_id BIGINT UNSIGNED NOT NULL UNIQUE
    , screen_name VARCHAR(20) NOT NULL UNIQUE
    , created_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;
CREATE TABLE list (
    list_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , owner VARCHAR(256) NOT NULL COMMENT 'tw-user_id, fb-id'
    , created_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;
CREATE INDEX list_owner ON list(owner);
CREATE TABLE list_member (
    list_member_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , list_id BIGINT UNSIGNED NOT NULL
    , member VARCHAR(256) NOT NULL COMMENT 'tw-user_id, fb-id'
    , created_on DATETIME NOT NULL
    , FOREIGN KEY (list_id) REFERENCES list(list_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;
CREATE TABLE feedback (
    feedback_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , comment VARCHAR(1024) NOT NULL
    , account_id BIGINT UNSIGNED
    , ua VARCHAR(256) NOT NULL
    , remote_ip VARCHAR(15) NOT NULL
    , created_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;