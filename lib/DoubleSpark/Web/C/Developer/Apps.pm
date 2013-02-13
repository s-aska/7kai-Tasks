package DoubleSpark::Web::C::Developer::Apps;
use strict;
use warnings;
use DoubleSpark::Validator;
use JSON::XS;
use Log::Minimal;
use OAuth::Lite::Consumer;
use OAuth::Lite::Token;
use String::Random qw(random_regex);

sub index {
    my ($class, $c) = @_;

    my $apps = $c->db->search('app', {
        account_id => $c->sign_id,
    }, {
        order_by => 'app_id DESC'
    })->all;

    $c->render('developer/apps/index.tt', { apps => $apps });
}

sub register {
    my ($class, $c) = @_;

    $c->render('developer/apps/register.tt');
}

sub show {
    my ($class, $c) = @_;

    my $db = $c->db;
    my $app = $db->single('app', {
        app_id     => $c->{args}->{id},
        account_id => $c->sign_id,
    }) or return $c->res_404();

    my $access_token;
    if ($c->req->method eq 'POST') {
        $db->delete('access_token', {
            app_id     => $app->app_id,
            account_id => $c->sign_id,
        });
        $access_token = $db->insert('access_token', {
            app_id              => $app->app_id,
            account_id          => $c->sign_id,
            access_token        => random_regex('[a-zA-Z0-9]{24}'),
            access_token_secret => random_regex('[a-zA-Z0-9]{32}'),
            access_level        => $app->access_level,
            authenticated_on    => \'now()',
            created_on          => \'now()',
        });
        $app->update_tokens();
    } else {
        $access_token = $db->single('access_token', {
            account_id => $c->sign_id,
            app_id => $app->app_id,
        }, {
            order_by => 'access_token_id desc',
        });
    }

    $c->render('developer/apps/show.tt', { app => $app, access_token => $access_token });
}

sub edit {
    my ($class, $c) = @_;

    my $app = $c->db->single('app', {
        app_id     => $c->{args}->{id},
        account_id => $c->sign_id,
    }) or return $c->res_404();

    $c->fillin_form($app);
    $c->render('developer/apps/register.tt', { app => $app });
}

sub create {
    my ($class, $c) = @_;

    my $db = $c->db;
    my $validator = DoubleSpark::Validator->check($c, $c->req,
        name                 => [qw/NOT_NULL/, [qw/LENGTH 1 32/]],
        description          => [qw/NOT_NULL/, [qw/LENGTH 1 200/]],
        website              => [qw/NOT_NULL HTTP_URL/],
        callback_url         => [qw/HTTP_URL/],
        access_level         => [qw/NOT_NULL/],
        organization         => [[qw/LENGTH 1 32/]],
        organization_website => [qw/HTTP_URL/],
        agree                => [qw/NOT_NULL/],
    );
    $db->count('app', '*', {
        name => $c->req->param('name')
    }) and $validator->set_error('name' => 'UNIQUE');
    if ($validator->has_error) {
        $c->fillin_form($c->req);
        return $c->render('developer/apps/register.tt', { errors => $validator->errors });
    }

    $db->insert('app', {
        account_id           => $c->sign_id,
        name                 => $c->req->param('name') // '',
        description          => $c->req->param('description') // '',
        website              => $c->req->param('website') // '',
        callback_url         => $c->req->param('callback_url') // '',
        access_level         => $c->req->param('access_level') eq 'rw' ? 'rw' : 'r',
        organization         => $c->req->param('organization') // '',
        organization_website => $c->req->param('organization_website') // '',
        consumer_key         => random_regex('[a-zA-Z0-9]{16}'),
        consumer_secret      => random_regex('[a-zA-Z0-9]{32}'),
        created_on           => \'now()',
    });

    $c->redirect('/developer/apps/', { create => 1 });
}

sub update {
    my ($class, $c) = @_;

    my $db = $c->db;
    my $validator = DoubleSpark::Validator->check($c, $c->req,
        name                 => [qw/NOT_NULL/, [qw/LENGTH 1 32/]],
        description          => [qw/NOT_NULL/, [qw/LENGTH 1 200/]],
        website              => [qw/NOT_NULL HTTP_URL/],
        callback_url         => [qw/HTTP_URL/],
        access_level         => [qw/NOT_NULL/],
        organization         => [[qw/LENGTH 1 32/]],
        organization_website => [qw/HTTP_URL/],
    );
    my $app = $db->single('app', {
        app_id     => $c->req->param('app_id'),
        account_id => $c->sign_id,
    }) or return $c->res_404();
    $db->count('app', '*', {
        name => $c->req->param('name') // '',
        app_id => { '!=' => $c->req->param('app_id') },
    }) and $validator->set_error('name' => 'UNIQUE');
    if ($validator->has_error) {
        $c->fillin_form($c->req);
        return $c->render('developer/apps/register.tt', { errors => $validator->errors, app => $app });
    }

    $app->update({
        name                 => $c->req->param('name') // '',
        description          => $c->req->param('description') // '',
        website              => $c->req->param('website') // '',
        callback_url         => $c->req->param('callback_url') // '',
        access_level         => $c->req->param('access_level') eq 'rw' ? 'rw' : 'r',
        organization         => $c->req->param('organization') // '',
        organization_website => $c->req->param('organization_website') // '',
        updated_on           => \'now()',
    });

    $c->redirect('/developer/apps/', { update => 1 });
}

sub oauth {
    my ($class, $c) = @_;

    my $req = $c->req;
    my $app = $c->db->single('app', {
        app_id     => $c->{args}->{id},
        account_id => $c->sign_id,
    }) or return $c->res_404();

    if ($c->req->method eq 'POST') {
        my $consumer = OAuth::Lite::Consumer->new(
            consumer_key       => $req->param('consumer_key'),
            consumer_secret    => $req->param('consumer_secret'),
        );
        my $res = $consumer->request(
            method => $req->param('method'),
            url    => $req->param('url'),
            token  => OAuth::Lite::Token->new(
                token  => $req->param('access_token'),
                secret => $req->param('access_token_secret'),
            ),
        );
        my $body = $res->decoded_content || $res->content;
        if ($res->code == 200) {
            my $json = JSON::XS->new->utf8->pretty->allow_nonref;
            $body = $json->encode($json->decode($body));
        }
        $c->fillin_form($req);
        return $c->render('developer/apps/oauth.tt', {
            app  => $app,
            code => $res->code,
            body => $body,
        });
    }

    my $url = $req->uri->clone;
    $url->path('/api/1/account/me');
    my $form = {
        consumer_key => $app->app_id . '-' . $app->consumer_key,
        consumer_secret => $app->consumer_secret,
        method => 'GET',
        url    => $url->as_string,
    };
    my $access_token = $c->db->single('access_token', {
        account_id => $c->sign_id,
        app_id => $app->app_id,
    }, {
        order_by => 'access_token_id desc',
    });
    if ($access_token) {
        $form->{access_token} = $access_token->access_token_id . '-' . $access_token->access_token;
        $form->{access_token_secret} = $access_token->access_token_secret;
    }

    $c->fillin_form($form);
    $c->render('developer/apps/oauth.tt', { app => $app });
}

sub reset {
    my ($class, $c) = @_;

    my $app = $c->db->single('app', {
        app_id     => $c->{args}->{id},
        account_id => $c->sign_id,
    }) or return $c->res_404();

    if ($c->req->method eq 'POST') {
        $app->update({
            consumer_key    => random_regex('[a-zA-Z0-9]{16}'),
            consumer_secret => random_regex('[a-zA-Z0-9]{32}'),
            updated_on      => \'now()',
        });
    }

    $c->render('developer/apps/reset.tt', { app => $app });
}

sub delete {
    my ($class, $c) = @_;

    my $app = $c->db->single('app', {
        app_id     => $c->{args}->{id},
        account_id => $c->sign_id,
    }) or return $c->res_404();

    if ($c->req->method eq 'POST') {
        $app->delete();
        return $c->redirect('/developer/apps/');
    }

    $c->render('developer/apps/delete.tt', { app => $app });
}

1;
