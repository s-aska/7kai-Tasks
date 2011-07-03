use AnyEvent::HTTP;
use AnyEvent::CouchDB::Stream;
my $cv = AE::cv;

my $listener = AnyEvent::CouchDB::Stream->new(
    url       => 'http://localhost:5984',
    database  => 'doublespark',
    on_change => sub {
        my $change = shift;
        warn "document $change->{_id} updated";
        $cv->send;
        # $self->send_message("document $change->{_id} updated");
    },
    on_keepalive => sub {
        warn "ping\n";
        
    },
    on_eof => sub {
        $cv->end;
    },
    timeout => 3,
);
$cv->recv;