package DoubleSpark::Web::C::Signin::Email;
use strict;
use warnings;
use Crypt::SaltedHash;
use Digest::SHA1;
use DoubleSpark::API::Account;
use DoubleSpark::Validator;
use Email::Sender::Simple qw(sendmail);
use Email::Simple;
use Email::Simple::Creator;
use Log::Minimal;
use Time::HiRes;

sub signup {
    my ($class, $c) = @_;

    my $res = DoubleSpark::Validator->validate($c, $c->req,
        email    => [qw/NOT_NULL EMAIL_LOOSE/],
        password => [qw/NOT_NULL/, [qw/LENGTH 8 128/]]
    );
    return $c->res_403() unless $res;

    my $email = $c->req->param('email');
    my $code = substr( Digest::SHA1::sha1_hex( Time::HiRes::gettimeofday() . [] . rand() ), 0, 64 );
    my $body = <<"EOF";
Welcome to 7kai Tasks

Register CODE: $code
EOF
    sendmail(
        Email::Simple->create(
            header => [
                To      => "<$email>",
                From    => '"7kai Tasks" <noreply@7kai.org>',
                Subject => 'Welcome to 7kai Tasks',
            ],
            body => $body
        )
    );

    infof('signup email_account email:%s code:%s', $email, $code);

    my $csh = Crypt::SaltedHash->new(algorithm => 'SHA-1');
    $csh->add($c->req->param('password'));
    my $password_saltedhash = $csh->generate;

    $c->session->set('email_request', {
        email    => $email,
        password => $password_saltedhash,
        code     => $code
    });
    
    $c->render_json({ success => 1 });
}

sub verify {
    my ($class, $c) = @_;

    my $email_request = $c->session->get('email_request');
    unless ($email_request) {
        warnf('missing request.');
        return $c->res_404();
    }

    my $code = $c->req->param('code');
    unless ($code eq $email_request->{code}) {
        warnf('miss match code.');
        return $c->res_404();
    }

    my $email = $email_request->{email};
    my $password = $email_request->{password};
    my ($local_part, $domain_part) = split '@', $email;

    my $email_account = $c->db->single('email_account', {
        code => $email
    });

    if ($email_account) {
        infof('reset password email_account email:%s', $email);
        $c->db->update('email_account', {
            password_saltedhash => $password,
            authenticated_on    => \'now()',
            updated_on          => \'now()'
        }, {
            email_account_id    => $email_account->email_account_id
        });
        $c->session->set('sign', {
            account_id => $email_account->account_id,
            code       => $email,
            name       => $local_part,
            icon       => '/static/img/email_off24.png'
        });
    } else {
        my $account = DoubleSpark::API::Account->create($c, $email, $local_part);
        infof('new email_account aid:%s email:%s', $account->account_id, $email);
        $c->db->insert('email_account', {
            account_id          => $account->account_id,
            name                => $local_part,
            code                => $email_request->{email},
            password_saltedhash => $password,
            authenticated_on    => \'now()',
            created_on          => \'now()',
            updated_on          => \'now()'
        });
        $c->session->set('sign', {
            account_id => $account->account_id,
            code       => $email,
            name       => $local_part,
            icon       => '/static/img/email_off24.png'
        });
    }

    $c->session->regenerate_session_id(1);
    $c->render_json({ success => 1 });
}

sub signin {
    my ($class, $c) = @_;

    my $email = $c->req->param('email');
    my $email_account = $c->db->single('email_account', {
        code => $email
    });

    unless ($email_account) {
        warnf('missing email:%s', $email);
        return $c->res_403();
    }

    unless (Crypt::SaltedHash->validate(
        $email_account->get_column('password_saltedhash'), $c->req->param('password'))) {
        warnf('invalid password email:%s', $email);
        return $c->res_403();
    }

    $email_account->update({ authenticated_on => \'now()' });

    my ($local_part, $domain_part) = split '@', $email;

    infof('signin email_account aid:%s email:%s', $email_account->account_id, $email);

    $c->session->set('sign', {
        account_id => $email_account->account_id,
        code       => $email,
        name       => $local_part,
        icon       => '/static/img/email_off24.png'
    });
    $c->session->regenerate_session_id(1);
    $c->render_json({ success => 1 });
}

1;
