package DoubleSpark::Validator::Constraint;
use Amon2;
use Email::Valid::Loose;
use FormValidator::Lite::Constraint;
use FormValidator::Lite::Constraint::Date;
use Log::Minimal;

rule OWNER => sub {
    my $c = Amon2->context();
    my $owner = $_;
    if (my $account = $c->account) {
        my $codes = $account->codes;
        my @match = grep /^\Q$owner\E$/, @$codes;
        if (scalar(@match)) {
            debugf('[%s] valid owner %s', $c->sign_name, $owner);
            return 1;
        } else {
            warnf('[%s] invalid owner %s', $c->sign_name, $owner);
        }
    } else {
        warnf('[-] missign sign');
    }
    return;
};

rule MEMBERS => sub {
    my $c = Amon2->context();
    if (my $account = $c->account) {
        my $list = $c->stash->{list};
        unless ($list) {
            warnf('[-] missign list');
            return;
        }
        for my $account_id (@{ $_ }) {
            next if $list->account_id eq $account_id;
            unless ($c->db->count('list_account', '*', { account_id => $account_id })) {
                warnf('[%s] invalid members %s', $c->sign_name, $account_id);
                return;
            }
        }
    } else {
        warnf('[-] missign sign');
        return;
    }
    return 1;
};

rule MEMBER => sub {
    my $c = Amon2->context();
    my $list = $c->stash->{list};
    unless ($list) {
        warnf('[-] missign list');
        return;
    }
    return 1 if $list->account_id eq $_;
    unless ($c->db->count('list_account', '*', { account_id => $_ })) {
        warnf('[%s] invalid members %s', $c->sign_name, $_);
        return;
    }
    return 1;
};

rule LIST_ROLE_OWNER => sub {
    my $c = Amon2->context();
    if (my $account = $c->account) {
        my $list = $c->db->single('list', { list_id => $_ });
        unless ($list) {
            warnf('[%s] missing list %s', $c->sign_name, $_);
            return;
        }
        if ($list->is_owner($account)) {
            debugf('[%s] list owner %s', $c->sign_name, $list->data->{name});
            $c->stash->{list} = $list;
            return 1;
        }
        warnf('[%s] list not assign %s', $c->sign_name, $list->data->{name});
        return;
    } else {
        warnf('[-] missign sign');
        return;
    }
};

rule LIST_ROLE_MEMBER => sub {
    my $c = Amon2->context();
    if (my $account = $c->account) {
        my $list = $c->db->single('list', {
            list_id => $_
        });
        unless ($list) {
            warnf('[%s] missing list %s', $c->sign_name, $_);
            return;
        }
        if ($list->is_owner($account)) {
            debugf('[%s] list owner %s', $c->sign_name, $list->data->{name});
            $c->stash->{list} = $list;
            return 1;
        }
        if ($list->is_member($account)) {
            debugf('[%s] list member %s', $c->sign_name, $list->data->{name});
            $c->stash->{list} = $list;
            return 1;
        }
        warnf('[%s] list not assign %s', $c->sign_name, $list->data->{name});
        return;
    } else {
        warnf('[-] missign sign');
        return;
    }
};

rule 'DATE_LOOSE' => sub {
    my $c = Amon2->context();
    my ($d1, $d2, $d3) = $_=~/(\d+)/g;
    if (length $d1 == 4) {
        $c->stash->{date_loose} = join('/', $d2, $d3, $d1);
        FormValidator::Lite::Constraint::Date::_v($d1, $d2, $d3);
    } elsif (length $d3 == 4) {
        $c->stash->{date_loose} = join('/', $d1, $d2, $d3);
        FormValidator::Lite::Constraint::Date::_v($d3, $d1, $d2);
    }
};

1;
