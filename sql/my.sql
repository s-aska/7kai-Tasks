# DROP DATABASE doublespark;
# CREATE DATABASE doublespark default character SET utf8;
# USE doublespark;

BEGIN;

CREATE TABLE account (
    account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , data MEDIUMBLOB NOT NULL
    , is_owner TINYINT
    , modified_on BIGINT UNSIGNED NOT NULL
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;

CREATE TABLE tw_account (
    tw_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) CHARACTER SET ASCII NOT NULL UNIQUE COMMENT 'tw-user_id'
    , name VARCHAR(20) CHARACTER SET ASCII NOT NULL UNIQUE
    , data MEDIUMBLOB NOT NULL
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE fb_account (
    fb_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) CHARACTER SET ASCII NOT NULL UNIQUE COMMENT 'fb-id'
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
    , code VARCHAR(256) CHARACTER SET ASCII NOT NULL UNIQUE COMMENT 'email address'
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
    , code VARCHAR(256) CHARACTER SET ASCII NOT NULL UNIQUE COMMENT 'email address'
    , name VARCHAR(64)
    , data MEDIUMBLOB NOT NULL
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE list (
    list_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , data MEDIUMBLOB NOT NULL
    , public_code VARCHAR(16) CHARACTER SET ASCII
    , invite_code VARCHAR(16) CHARACTER SET ASCII
    , actioned_on BIGINT UNSIGNED NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

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
    , account_id BIGINT UNSIGNED NOT NULL
    , name VARCHAR(256) CHARACTER SET ASCII NOT NULL COMMENT 'screen_name'
    , lang VARCHAR(2) CHARACTER SET ASCII NOT NULL
    , request TEXT NOT NULL
    , response TEXT NOT NULL
    , is_public TINYINT
    , label_class ENUM('success', 'warning', 'important', 'notice')
    , label_name VARCHAR(16) CHARACTER SET ASCII NOT NULL
    , data MEDIUMBLOB NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;

CREATE TABLE question (
    question_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , lang VARCHAR(2) CHARACTER SET ASCII NOT NULL
    , question TEXT NOT NULL
    , answer TEXT NOT NULL
    , is_public TINYINT
    , data MEDIUMBLOB NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;

CREATE TABLE app (
    app_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , name VARCHAR(32) NOT NULL UNIQUE
    , description VARCHAR(256) NOT NULL
    , website VARCHAR(256) CHARACTER SET ASCII NOT NULL
    , organization VARCHAR(256) NOT NULL
    , organization_website VARCHAR(256) CHARACTER SET ASCII NOT NULL
    , callback_url VARCHAR(256) NOT NULL
    , consumer_key VARCHAR(16) CHARACTER SET ASCII NOT NULL
    , consumer_secret VARCHAR(32) CHARACTER SET ASCII NOT NULL
    , access_level ENUM('r', 'rw')
    , data MEDIUMBLOB NOT NULL
    , tokens INT DEFAULT 0
    , is_disabled TINYINT DEFAULT 0
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE request_token (
    request_token_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , app_id BIGINT UNSIGNED NOT NULL
    , account_id BIGINT UNSIGNED
    , token VARCHAR(32) CHARACTER SET ASCII NOT NULL
    , secret VARCHAR(32) CHARACTER SET ASCII NOT NULL
    , realm VARCHAR(32) CHARACTER SET ASCII NOT NULL
    , consumer_key VARCHAR(16) CHARACTER SET ASCII NOT NULL
    , expired_on INT DEFAULT 0
    , callback_url VARCHAR(256)
    , verifier VARCHAR(8) CHARACTER SET ASCII
    , is_exchanged_to_access_token TINYINT DEFAULT 0
    , is_authorized_by_user TINYINT DEFAULT 0
    , is_expired TINYINT DEFAULT 0
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (app_id) REFERENCES app(app_id) ON DELETE CASCADE
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE access_token (
    access_token_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , app_id BIGINT UNSIGNED NOT NULL
    , account_id BIGINT UNSIGNED NOT NULL
    , access_token VARCHAR(64) CHARACTER SET ASCII NOT NULL
    , access_token_secret VARCHAR(64) CHARACTER SET ASCII NOT NULL
    , access_level ENUM('r', 'rw')
    , is_disabled TINYINT DEFAULT 0
    , authenticated_on DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (app_id) REFERENCES app(app_id) ON DELETE CASCADE
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;

CREATE TABLE request_log (
    request_log_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , consumer_key VARCHAR(64) CHARACTER SET ASCII NOT NULL
    , nonce VARCHAR(64) CHARACTER SET ASCII NOT NULL
    , timestamp INT NOT NULL
) ENGINE=InnoDB charset=utf8;

COMMIT;
