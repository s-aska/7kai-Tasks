+{
    max_history => 10,
    DB => [
        'dbi:mysql:dbname=doublespark;sql-mode=STRICT_TRANS_TABLES',
        'root',
        '',
        +{
            RaiseError         => 1,
            AutoCommit         => 1,
            FetchHashKeyName   => 'NAME_lc',
            ShowErrorStatement => 1,
            ChopBlanks         => 1,
            mysql_enable_utf8  => 1
        }
    ],
    CouchDB => {
        uri => 'http://localhost:5984/doublespark',
    },
    Twitter => {
        consumer_key_file => 'config/tw.key',
        consumer_secret_file => 'config/tw.secret',
        callback => 'http://tasks.7kai.org/signin/twitter/callback',
        oauth_urls => {
            request_token_url  => "https://api.twitter.com/oauth/request_token",
            authorization_url  => "https://api.twitter.com/oauth/authorize",
            authentication_url => "https://api.twitter.com/oauth/authenticate",
            access_token_url   => "https://api.twitter.com/oauth/access_token",
            xauth_url          => "https://api.twitter.com/oauth/access_token"
        }
    },
    Facebook => {
        postback => 'http://tasks.7kai.org/signin/facebook/callback',
        app_id_file => '',
        secret_file => ''
    },
    Dropbox => {
        key_file => '',
        secret_file => '',
        callback_url => 'http://tasks.7kai.org/signin/dropbox/callback'
    },
    OpenID => {
        return_to => 'http://tasks.7kai.org/signin/openid/callback',
        realm => 'http://tasks.7kai.org/'
    }
};
