package DoubleSpark::DB;
use parent 'Teng';

__PACKAGE__->load_plugin('Count');

package DoubleSpark::DB::Row::Account;
use parent 'Teng::Row';

sub sub_accounts {
    my $row = shift;

    unless ($row->{__sub_accounts}) {
        my $tw_accounts = $row->handle->search('tw_account', {
            account_id => $row->account_id
        });
        my $fb_accounts = $row->handle->search('fb_account', {
            account_id => $row->account_id
        });
        my $email_accounts = $row->handle->search('email_account', {
            account_id => $row->account_id
        });
        my $google_accounts = $row->handle->search('google_account', {
            account_id => $row->account_id
        });
        $row->{__sub_accounts} = [
            $tw_accounts->all,
            $fb_accounts->all,
            $email_accounts->all,
            $google_accounts->all
        ];
    }

    $row->{__sub_accounts};
}

sub codes {
    my $row = shift;
    
    unless ($row->{__codes}) {
        $row->{__codes} = [ map { $_->code } @{ $row->sub_accounts } ];
    }

    $row->{__codes};
}

package DoubleSpark::DB::Row::List;
use parent 'Teng::Row';

sub is_owner {
    my ($row, $account) = @_;
    
    for my $code (@{ $account->codes }) {
        return 1 if $code eq $row->code;
    }
    return;
}

sub is_member {
    my ($row, $account) = @_;
    
    for my $code (@{ $account->codes }) {
        for my $member (@{ $row->data->{members} }) {
            return 1 if $code eq $member;
        }
    }
    return;
}

sub as_hashref {
    my $row = shift;
    my $data = $row->data;
    $data->{id} = $row->list_id;
    $data->{public_code} = $row->public_code;
    $data->{invite_code} = $row->invite_code;
    $data->{actioned_on} = int($row->actioned_on);
    $data->{members} = [
        map { $_->code }
            $row->handle->search('list_member', { list_id => $row->list_id })->all
    ];
    
    $data;
}

1;
