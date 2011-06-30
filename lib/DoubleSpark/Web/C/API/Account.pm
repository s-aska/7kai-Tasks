package DoubleSpark::Web::C::API::Account;
use strict;
use warnings;
use JSON;

sub get {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    $account->set_social_accounts($c);
    $account->set_lists($c);
    
    $c->render_json({success => 1, account => $account->to_hashref});
}

sub update {
    my ($class, $c) = @_;
    
    my $doc = DoubleSpark::Account->new($c)->to_hashref;
    my $doc_id = 'account-' . $doc->{account_id};
    my $method = $c->req->param('method') || 'set';
    my $type   = $c->req->param('type') || 'string';
    my $ns     = $c->req->param('ns');
    my $key    = $c->req->param('key');
    my $val    = $c->req->param('val');
    
    if ($type eq 'json') {
        $val = decode_json($val);
    }
    
    my $data = $doc;
    for (split /\./, $ns) {
        unless (exists $data->{$_}) {
            $data->{$_} = {};
        }
        $data = $data->{$_};
    }
    if ($method eq 'set') {
        $data->{$key} = $val=~/^\d+$/ ? int($val) : $val;
    } elsif ($method eq '+') {
        $data->{$key}->{$val}++;
    } elsif ($method eq '-') {
        delete $data->{$key}->{$val};
    }
    $c->save_doc($doc);
    
    $c->render_json({success => 1});
}

1;

__END__

