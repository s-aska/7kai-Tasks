package DoubleSpark::Web::C::API::Request;
use strict;
use warnings;
use DoubleSpark::Validator;
use Log::Minimal;
use Time::HiRes;

sub list {
    my ($class, $c) = @_;

    my @requests;
    for my $row ($c->db->search('request', {}, { order_by => 'updated_on desc' })->all) {
        my $req = $row->get_columns;
        $req->{data} = $row->data;
        push @requests, $req;
    }

    $c->render_json({
        success => 1,
        requests => \@requests
    });
}

sub create {
    my ($class, $c) = @_;

    my $res = DoubleSpark::Validator->validate($c, $c->req,
        request => [qw/NOT_NULL/, [qw/LENGTH 1 10000/]],
        name    => [[qw/LENGTH 1 10/]]
    );
    return $c->res_403() unless $res;

    my $name    = $c->req->param('name') || 'anonymous';
    my $request = $c->req->param('request');

    $c->db->insert('request', {
        account_id => $c->sign_id,
        name       => $name,
        request    => $request,
        label_name => 'request',
        lang       => 'ja',
        is_public  => 1,
        data        => {
            star => {}
        },
        created_on => \'now()',
        updated_on => \'now()'
    });

    infof('[%s] create request', $c->sign_name);

    $c->render_json({ success => 1 });
}

sub update {
    my ($class, $c) = @_;

    return $c->res_403() unless $c->is_owner;

    my $request_id  = $c->req->param('request_id');
    my $request     = $c->req->param('request')     || '';
    my $response    = $c->req->param('response')    || '';
    my $is_public   = $c->req->param('is_public')   || 0;
    my $label_class = $c->req->param('label_class') || '';
    my $label_name  = $c->req->param('label_name')  || '';

    $c->db->update('request', {
        request     => $request,
        response    => $response,
        is_public   => $is_public,
        label_class => $label_class,
        label_name  => $label_name,
        updated_on  => \'now()'
    }, {
        request_id => $request_id
    });

    $c->render_json({ success => 1 });
}

sub star {
    my ($class, $c) = @_;

    my $request_id = $c->req->param('request_id');
    my $request = $c->db->single('request', {
        request_id => $request_id
    });

    $request->data->{star}->{ $c->sign_id }++;
    $request->update({ data => $request->data });

    $c->render_json({ success => 1 });
}

sub unstar {
    my ($class, $c) = @_;

    my $request_id = $c->req->param('request_id');
    my $request = $c->db->single('request', {
        request_id => $request_id
    });

    delete $request->data->{star}->{ $c->sign_id };
    $request->update({ data => $request->data });

    $c->render_json({ success => 1 });
}

sub delete {
    my ($class, $c) = @_;

    # self or developer



}

1;
