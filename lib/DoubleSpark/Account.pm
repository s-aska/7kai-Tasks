package DoubleSpark::Account;
use strict;
use warnings;
# use Class::Accessor::Lite (
#     ro  => [ qw(id type code name angel_id) ]
# );

sub new {
    my ($class, $c) = @_;
    
    my $account = $c->session->get('account');
    
    # return $account if $account;
    
    my $account_id;
    if ($account) {
        $account_id = $account->{account_id};
    }
    
    # from sign in with twitter
    if (my $tw_account = $c->session->get('tw_account')) {
        
        $c->session->set('screen_name', $tw_account->{screen_name});
        $c->session->set('profile_image_url', $tw_account->{profile_image_url});
        
        my $db = $c->db;
        my $tw_account_db =
            $db->single('tw_account', { user_id => $tw_account->{user_id} });
        
        my $account;
        # exists account
        if ($tw_account_db) {
            unless ($account_id) {
                my $account_db =
                    $db->single('account', { account_id => $tw_account_db->account_id });
                $account_id = $account_db->account_id;
            }
        }
        
        # new twitter account
        else {
            # new account
            unless ($account_id) {
                my $account_db = $db->insert('account', {
                    name       => $tw_account->{screen_name},
                    last_login => \'now()',
                    created_on => \'now()',
                    updated_on => \'now()'
                });
                $account_id = $account_db->account_id;
                my $list = $db->insert('list', {
                    account_id => $account_id,
                    created_on => \'now()'
                });
                my $doc_id = 'list-' . $list->list_id;
                my $name = $tw_account->{screen_name} . "'s List";
                my $owner = '@' . $tw_account->{screen_name};
                $c->save_doc({
                    _id => $doc_id,
                    name => $name,
                    privacy => 'closed',
                    owner   => $owner,
                    members => [],
                    tasks => []
                });
            }
            my $tw_account_db = $db->insert('tw_account', {
                account_id => $account_id,
                user_id => $tw_account->{user_id},
                screen_name => $tw_account->{screen_name},
                created_on => \'now()'
            });
        }
        $c->session->remove('tw_account');
    }
    
    # no sign in
    die 'Forbidden' unless $account_id;
    
    $c->session->set('account', {
        account_id => $account_id
    });
    
    my $doc;
    eval {
        my $doc_id = 'account-' . $account_id;
        eval {
            $doc = $c->open_doc($doc_id);
        };if ($@) {
            if (ref $@ && $@->headers->{Status} == 404) {
                $c->save_doc({ _id => $doc_id });
                $doc = $c->open_doc($doc_id);
            } else {
                # FIXME: 
                warn $@;
            }
        }
    };if ($@) {
        # FIXME: 
        warn $@;
    }
    
    $doc->{tw} ||= {};
    $doc->{state}->{watch} ||= {};
    $doc->{state}->{checkbox} ||= {};
    $doc->{state}->{button} ||= {};
    $doc->{state}->{hide_list} ||= {};
    $doc->{state}->{sort}->{task} ||= {};
    $doc->{state}->{read}->{list} ||= {};
    
    $doc->{account_id} = $account_id;
    
    bless $doc, $class;
}

sub set_social_accounts {
    my ($self, $c) = @_;
    
    my @codes;
    
    # twitter
    my $tws = $c->db->search('tw_account', {
        account_id => $self->{account_id}
    });
    my @tw_accounts;
    for my $tw ($tws->all) {
        push @codes, '@' . $tw->screen_name;
        push @tw_accounts, $tw->get_columns;
    }
    $self->{tw_accounts} = \@tw_accounts;
    
    # facebook
    
    $self->{codes} = \@codes;
}

sub set_lists {
    my ($self, $c) = @_;
    
    my @list_ids1 = map {
        'list-' . $_->list_id
    } $c->db->search('list', {
        account_id => $self->{account_id}
    })->all;
    
    my @list_ids2 = map {
        'list-' . $_->list_id
    } $c->db->search('list_member', {
        code => $self->{codes}
    })->all;
    
    # unique
    my @list_ids = do { my %h; grep { !$h{$_}++ } (@list_ids1, @list_ids2) };
    
    my $lists = $c->open_docs(\@list_ids);
    
    $self->{lists} = $lists->{rows};
}

sub to_hashref {
    my $self = shift;
    
    return {%{$self}};
}

sub has_role_admin {
    my ($self, $list) = @_;
    
    for my $user_id (keys %{ $self->{tw} }) {
        my $tw = $self->{tw}->{$user_id};
        if ('@' . $tw->{screen_name} eq $list->{owner}) {
            return 1;
        }
    }
    
    return ;
}

sub has_role_member {
    my ($self, $list) = @_;
    
    for my $code ($list->{owner}, @{$list->{members}}) {
        for my $user_id (keys %{ $self->{tw} }) {
            my $tw = $self->{tw}->{$user_id};
            if ('@' . $tw->{screen_name} eq $code) {
                return 1;
            }
        }
    }
    
    return ;
}

1;
