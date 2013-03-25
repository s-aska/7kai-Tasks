package DoubleSpark::Web::C::API::Feedback;
use utf8;
use strict;
use warnings;
use DoubleSpark::Validator;
use Log::Minimal;
use Email::Send qw();

my $pattern = <<'__MESSAGE__';
To: s.aska.org@gmail.com
From: s.aska.org@gmail.com
Subject: Message for 7kai Tasks

%s
------------------------------
Account: %s ( %s / %s )
IP: %s
UA: %s
------------------------------
__MESSAGE__

sub send {
    my ($class, $c) = @_;

    my $message = sprintf $pattern,
        $c->req->param('message') // '- no message -',
        $c->sign_name,
        $c->sign_code,
        $c->sign_id,
        $c->req->address,
        $c->req->user_agent;
    my $sender = Email::Send->new({ mailer => 'SMTP' });
    $sender->mailer_args([Host => 'gmail-smtp-in.l.google.com']);
    $sender->send($message);

    $c->render_json({ success => 1 });
}

1;
