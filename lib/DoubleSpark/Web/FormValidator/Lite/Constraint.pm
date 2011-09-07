package DoubleSpark::Web::FormValidator::Lite::Constraint;
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
        for my $member (@{ $_ }) {
            if ($member=~m|^tw-\d+$|) {
                debugf('[%s] valid members %s', $c->sign_name, $member);
            }
            elsif ($member=~m|^fb-\d+$|) {
                debugf('[%s] valid members %s', $c->sign_name, $member);
            }
            elsif (Email::Valid::Loose->address($member)) {
                debugf('[%s] valid members %s', $c->sign_name, $member);
            }
            else {
                warnf('[%s] invalid members %s', $c->sign_name, $member);
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
    if ($_=~m|^tw-\d+$|) {
        debugf('[%s] valid member %s', $c->sign_name, $_);
    }
    elsif ($_=~m|^fb-\d+$|) {
        debugf('[%s] valid member %s', $c->sign_name, $_);
    }
    elsif (Email::Valid::Loose->address($_)) {
        debugf('[%s] valid member %s', $c->sign_name, $_);
    }
    else {
        warnf('[%s] invalid member %s', $c->sign_name, $_);
        return;
    }
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
    my ($d1, $d2, $d3) = split '/', $_;
    if (length $d1 == 4) {
        $c->stash->{date_loose} = join('/', $d2, $d3, $d1);
        FormValidator::Lite::Constraint::Date::_v($d1, $d2, $d3);
    } elsif (length $d3 == 4) {
        $c->stash->{date_loose} = join('/', $d1, $d2, $d3);
        FormValidator::Lite::Constraint::Date::_v($d3, $d1, $d2);
    }
};

1;
