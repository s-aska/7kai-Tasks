package DoubleSpark::Web::C::API::Feedback;
use utf8;
use strict;
use warnings;
use DoubleSpark::Validator;
use Log::Minimal;
use Email::Sender::Simple qw(sendmail);
use Email::Sender::Transport::SMTP;
use Email::Simple;
use Email::Simple::Creator;

my $pattern = <<'__MESSAGE__';
%s
------------------------------
Account: %s ( %s / %s )
IP: %s
UA: %s
------------------------------
__MESSAGE__

sub send {
    my ($class, $c) = @_;

    my $email = Email::Simple->create(
        header => [
            To      => 'Shinichiro Aska <s.aska.org@gmail.com>',
            From    => 'Shinichiro Aska <s.aska.org@gmail.com>',
            Subject => 'Feedback for 7kai Tasks',
        ],
        body => sprintf(
            $pattern,
            $c->req->param('message') // '- no message -',
            $c->sign_name,
            $c->sign_code,
            $c->sign_id,
            $c->req->address,
            $c->req->user_agent,
        )
    );
    my $transport = Email::Sender::Transport::SMTP->new({
        host => 'gmail-smtp-in.l.google.com',
    });
    sendmail($email, { transport => $transport });

    $c->render_json({ success => 1 });
}

1;
