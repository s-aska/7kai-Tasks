DROP DATABASE doublespark;

BEGIN;

CREATE DATABASE doublespark default character SET utf8;

USE doublespark;

CREATE TABLE account (
    account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , data MEDIUMBLOB NOT NULL
    , is_owner TINYINT(1)
    , modified_on BIGINT UNSIGNED NOT NULL
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;

CREATE TABLE tw_account (
    tw_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) character set ascii NOT NULL UNIQUE COMMENT 'tw-user_id'
    , name VARCHAR(20) character set ascii NOT NULL UNIQUE
    , data MEDIUMBLOB NOT NULL
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE fb_account (
    fb_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) character set ascii NOT NULL UNIQUE COMMENT 'fb-id'
    , name VARCHAR(256) NOT NULL
    , data MEDIUMBLOB NOT NULL
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE email_account (
    email_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) character set ascii NOT NULL UNIQUE COMMENT 'email address'
    , name VARCHAR(20)
    , password_saltedhash VARCHAR(256)
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE google_account (
    google_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) character set ascii NOT NULL UNIQUE COMMENT 'email address'
    , name VARCHAR(64)
    , data MEDIUMBLOB NOT NULL
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE list (
    list_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , code VARCHAR(256) character set ascii NOT NULL COMMENT '*_account.code'
    , data MEDIUMBLOB NOT NULL
    , public_code VARCHAR(16) character set ascii
    , invite_code VARCHAR(16) character set ascii
    , actioned_on BIGINT UNSIGNED NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;
CREATE INDEX list_code ON list(code);

CREATE TABLE list_member (
    list_member_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , list_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) character set ascii NOT NULL COMMENT '*_account.code'
    , created_on DATETIME NOT NULL
    , FOREIGN KEY (list_id) REFERENCES list(list_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;
CREATE INDEX list_member_code ON list_member(code);

CREATE TABLE list_account (
    list_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , list_id BIGINT UNSIGNED NOT NULL
    , account_id BIGINT UNSIGNED NOT NULL
    , created_on DATETIME NOT NULL
    , FOREIGN KEY (list_id) REFERENCES list(list_id) ON DELETE CASCADE
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE request (
    request_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , code VARCHAR(256) character set ascii NOT NULL COMMENT '*_account.code'
    , name VARCHAR(256) character set ascii NOT NULL COMMENT 'screen_name'
    , lang VARCHAR(2) character set ascii NOT NULL
    , request TEXT NOT NULL
    , response TEXT NOT NULL
    , is_public TINYINT(1)
    , label_class ENUM('success', 'warning', 'important', 'notice')
    , label_name VARCHAR(16) character set ascii NOT NULL
    , data MEDIUMBLOB NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;

CREATE TABLE question (
    question_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , code VARCHAR(256) character set ascii NOT NULL COMMENT '*_account.code'
    , lang VARCHAR(2) character set ascii NOT NULL
    , question TEXT NOT NULL
    , answer TEXT NOT NULL
    , is_public TINYINT(1)
    , data MEDIUMBLOB NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;

COMMIT;
