package DoubleSpark::Config;
use strict;
use warnings;

sub new {
    my ($class, $args) = @_;
    
    +{
        ext_url => 'https://chrome.google.com/webstore/detail/dolhpjcchfcnkcanamhgcgbnmcogdank',
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
        Twitter => {
            consumer_key_file => 'config/tw.key',
            consumer_secret_file => 'config/tw.secret',
            callback => "$args->{base_url}/signin/twitter/callback",
            oauth_urls => {
                request_token_url  => 'https://api.twitter.com/oauth/request_token',
                authorization_url  => 'https://api.twitter.com/oauth/authorize',
                authentication_url => 'https://api.twitter.com/oauth/authenticate',
                access_token_url   => 'https://api.twitter.com/oauth/access_token',
                xauth_url          => 'https://api.twitter.com/oauth/access_token'
            }
        },
        Facebook => {
            postback => "$args->{base_url}/signin/facebook/callback",
            app_id_file => 'config/fb.key',
            secret_file => 'config/fb.secret'
        },
        Dropbox => {
            key_file => '',
            secret_file => '',
            callback_url => "$args->{base_url}/signin/dropbox/callback"
        },
        OpenID => {
            return_to => "$args->{base_url}/signin/openid/callback",
            realm => "$args->{base_url}/"
        },
        Skeleton => {
            Account => {
                state => {
                    star => {},
                    mute => {},
                    sort => {
                        list => {}
                    },
                }
            }
        }
        
    };
}

1;
