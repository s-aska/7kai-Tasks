package DoubleSpark::Web::C::API::Account;
use strict;
use warnings;
use Calendar::Japanese::Holiday;
use Digest::MD5 qw(md5_hex);
use DoubleSpark::API::Account;
use DoubleSpark::API::Comment;
use DoubleSpark::API::List;
use DoubleSpark::API::Task;
use DoubleSpark::Validator::Query;
use Encode;
use JSON::XS;
use Log::Minimal;

sub me {
    my ($class, $c) = @_;

    my $token = $c->session->get('csrf_token');
    my $account = $c->account;
    if ($c->req->param('minimum')) {
        return
            $c->render_json({
                success      => 1,
                sign         => $c->sign,
                token        => $token,
                account      => $account->data,
                is_owner     => $account->is_owner,
                modified_on  => $account->modified_on
            });
    }

    # サブアカウント取得
    my @sub_accounts;
    my $tw_accounts = $c->db->search('tw_account', {
        account_id => $account->account_id
    });
    my $fb_accounts = $c->db->search('fb_account', {
        account_id => $account->account_id
    });
    my $google_accounts = $c->db->search('google_account', {
        account_id => $account->account_id
    });
    for ($tw_accounts->all) {
        my $sub_account = $_->get_columns;
        $sub_account->{data} = decode_json($sub_account->{data}) if $sub_account->{data};
        $sub_account->{data}->{icon}=~s|http://a|https://si| if $sub_account->{data}->{icon};
        push @sub_accounts, $sub_account;
    }
    for ($fb_accounts->all) {
        my $sub_account = $_->get_columns;
        $sub_account->{data} = decode_json($sub_account->{data}) if $sub_account->{data};
        my ($user_id) = $sub_account->{code}=~/^fb-(\d+)/;
        $sub_account->{data}->{icon} = sprintf 'https://graph.facebook.com/%s/picture', $user_id;
        push @sub_accounts, $sub_account;
    }
    for ($google_accounts->all) {
        my $sub_account = $_->get_columns;
        $sub_account->{data} = decode_json($sub_account->{data}) if $sub_account->{data};
        $sub_account->{data}->{icon} = 'https://secure.gravatar.com/avatar/' . md5_hex($sub_account->{code});
        push @sub_accounts, $sub_account;
    }

    unless (@sub_accounts) {
        # sub account nothing...
        critf('missing sub accounts aid:%s', $account->account_id);
        $c->session->expire;
        return $c->res_401();
    }

    # リスト取得
    my $my_lists = $c->db->search('list', {
        account_id => $account->account_id
    });
    my $list_members = $c->db->search('list_account', {
        account_id => $account->account_id
    });
    my %ids;
    for ($my_lists->all, $list_members->all) {
        $ids{$_->list_id}++;
    }
    my $list_ids = join(',', sort keys %ids);
    my @lists;
    if (my $if_modified_since = $c->req->param('if_modified_since')) {
        my $if_modified_lists = $c->req->param('if_modified_lists') || '';
        unless (%ids) {
            return $c->res_404();
        }
        my $count = $c->db->count('list', '*', {
            list_id => [keys %ids],
            actioned_on => { '>' => $if_modified_since } });
        if (!$count and
            ($account->modified_on <= $if_modified_since) and
            ($list_ids eq $if_modified_lists)) {
            return $c->res_304();
        }
    }
    if (%ids) {
        @lists = map { $_->as_hashref }
            $c->db->search('list', { list_id => [keys %ids] })->all;
    }
    my $users = {};
    for my $list (@lists) {
        my @members = map {
            $_->account_id
        } $c->db->search('list_account', { list_id => $list->{id} })->all;
        for my $account_id (@members, $list->{owner}) {
            next if exists $users->{ $account_id };
            my $account = $c->db->single('account', { account_id => $account_id });
            if ($account) {
                $account->data->{icon}=~s|http://a|https://si| if $account->data->{icon}=~m|^http://a\d+\.twimg\.com/|;
                $users->{ $account_id } = {
                    name => $account->data->{name},
                    icon => $account->data->{icon}
                };
            }
        }
    }

    $c->sign->{icon}=~s|http://a|https://si|;

    my $notice = $c->session->remove('notice');
    my $invite = $c->session->remove('invite');
    if ($invite) {
        if (exists $ids{ $invite->{list_id} }) {
            undef $invite;
            # $c->session->remove('invite');
        } else {
            my $list = $c->db->single('list', {
                list_id     => $invite->{list_id},
                invite_code => $invite->{invite_code}
            });
            if ($list) {
                $invite->{list_name} = $list->data->{name};
            } else {
                undef $invite;
                # $c->session->remove('invite');
            }
        }
    }

    my $holidays = {};
    my $time = time - (60 * 60 * 24 * 180);
    for my $i (1..12) {
        my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) =
            localtime($time);
        $year += 1900;
        $mon++;
        my $days = getHolidays($year, $mon, 1);
        for my $day (keys %$days) {
            my $date = sprintf('%04d-%02d-%02d', $year, $mon, $day);
            $holidays->{ $date } = $days->{ $day };
        }
        $time += (60 * 60 * 24 * Calendar::Japanese::Holiday::days_in_month($year, $mon));
    }

    $c->render_json({
        success      => 1,
        sign         => $c->sign,
        token        => $token,
        notice       => $notice,
        invite       => $invite,
        account      => $account->data,
        modified_on  => $account->modified_on,
        sub_accounts => \@sub_accounts,
        lists        => \@lists,
        list_ids     => $list_ids,
        users        => $users,
        holidays     => $holidays,
    });
}

sub salvage {
    my ($class, $c) = @_;

    my $account = $c->account;

    my $routes = {
        'account.update' => 'DoubleSpark::API::Account#update',
        'task.create'    => 'DoubleSpark::API::Task#create',
        'task.update'    => 'DoubleSpark::API::Task#update',
        'comment.create' => 'DoubleSpark::API::Comment#create',
        'comment.delete' => 'DoubleSpark::API::Comment#delete'
    };

    my $cache = {};
    my $lists = {};
    my $tasks = {};
    my $queues = decode_json(encode_utf8($c->req->param('queues')));
    for my $queue (@{ $queues }) {
        next if ref $queue ne 'HASH';
        my $match = $routes->{ $queue->{api} };
        unless ($match) {
            critf('[%s] uknown api %s', $c->sign_name, $queue->{api});
            next;
        }
        my ($api, $method) = split '#', $match;
        my $req = DoubleSpark::Validator::Query->new($queue->{req});
        if ($queue->{api} eq 'task.create') {
            # duplication cut.
            my $key = $req->{list_id} . '-' . $req->{name};
            next if $cache->{ $key };
            $cache->{ $key }++;
            $cache->{ $req->{list_id} . '#' . $req->{task_id} }++;
        } elsif ($queue->{api} eq 'task.update') {
            # old cut.
            unless ($lists->{ $req->{list_id} }) {
                $lists->{ $req->{list_id} } =
                    $c->db->single('list', { list_id => $req->{list_id} });
            }
            my $list = $lists->{ $req->{list_id} } or next;
            unless ($tasks->{ $req->{task_id} }) {
                ($tasks->{ $req->{task_id} }) =
                    grep { $_->{id} eq $req->{task_id} } @{ $list->data->{tasks} };
            }
            unless ($cache->{ $req->{list_id} . '#' . $req->{task_id} }) {
                my $task = $tasks->{ $req->{task_id} };
                if ($queue->{updated_on} < $task->{updated_on}) {
                    warnf('[%s] update task fail old request', $c->sign_name);
                    next;
                }
            }
        } elsif ($queue->{api} eq 'comment.create') {
            # duplication cut.
            my $key = $req->{task_id} . '-' . $req->{message};
            next if $cache->{ $key };
            $cache->{ $key }++;
        }
        if ($api->$method($c, $req)) {
            infof('[%s] salvage success %s', $c->sign_name, $match);
        } else {
            warnf('[%s] salvage skip %s', $c->sign_name, $match);
        }
    }

    $c->render_json({
        success => 1
    });
}

sub update_profile {
    my ($class, $c) = @_;

    my $res = DoubleSpark::Validator->validate($c, $c->req,
        name => ['NOT_NULL', [qw/LENGTH 1 20/]],
        icon => ['NOT_NULL']
    );
    return $c->res_403() unless $res;

    my $account = $c->account;
    return $c->res_403() unless $account;

    $account->data->{name} = $c->req->param('name');
    $account->data->{icon} = $c->req->param('icon');
    $account->update({
        data => $account->data,
        modified_on => int(Time::HiRes::time * 1000),
        updated_on => \'now()'
    });

    $c->session->set('sign', {
        account_id => $account->account_id,
        code       => $c->sign_code,
        name       => $account->data->{name},
        icon       => $account->data->{icon}
    });

    $c->render_json({
        success => 1
    });
}

sub update {
    my ($class, $c) = @_;

    my $res = DoubleSpark::API::Account->update($c, $c->req);

    return $c->res_403() unless $res;

    $c->render_json($res);
}

sub delete {
    my ($class, $c) = @_;

    my $res = DoubleSpark::API::Account->delete($c, $c->req);

    return $c->res_403() unless $res;

    if ($c->req->param('code') eq $c->sign_code) {
        $c->session->remove('sign');
        $res->{signout}++;
    }

    $c->render_json($res);
}

1;
