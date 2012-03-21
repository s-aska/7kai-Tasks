package DoubleSpark::Web::C::API::ProfileImage;
use strict;
use warnings;
use Log::Minimal;
use Digest::MD5 qw(md5_hex);
use Furl::HTTP;
use File::Spec;
use IO::File;

my $furl = Furl::HTTP->new(
    agent   => '7kai Tasks/2.0',
    timeout => 2,
);

sub twitter {
    my ($class, $c) = @_;

    my $filename = sprintf '%s', $c->{args}->{screen_name};
    my $path = File::Spec->catfile('/tmp/twitter_profile_image', $filename);
    if (-f $path) {
        warnf('found %s', $filename);
        return $c->create_response(
            200,
            [
                'Content-Type' => 'image/jpeg',
                'Content-Length' => (-s $path),
            ],
            IO::File->new($path)
        );
    }
    my $url = sprintf
        'http://api.twitter.com/1/users/profile_image?screen_name=%s&size=',
        $c->{args}->{screen_name};
    my ($minor_version, $code, $msg, $headers, $body) = $furl->get($url);
    my $fh = IO::File->new($path, '>');
    print $fh $body;
    close $fh;
    return $c->create_response(
        200,
        [
            'Content-Type' => 'image/jpeg',
            'Content-Length' => (-s $path),
        ],
        IO::File->new($path)
    );
}

sub gravatar {
    my ($class, $c) = @_;

    my $filename = md5_hex($c->{args}->{code});
    my $url = 'https://secure.gravatar.com/avatar/' . $filename;
    return $c->redirect($url);

    my $path = File::Spec->catfile('/tmp/', 'gravatar-' . $filename);
    if (-f $path) {
        return $c->create_response(
            200,
            [
                'Content-Type' => 'image/jpeg',
                'Content-Length' => (-s $path),
            ],
            IO::File->new($path)
        );
    }
    my ($minor_version, $code, $msg, $headers, $body) = $furl->get($url);
    my $fh = IO::File->new($path, '>');
    print $fh $body;
    close $fh;
    return $c->create_response(
        200,
        [
            'Content-Type' => 'image/jpeg',
            'Content-Length' => (-s $path),
        ],
        IO::File->new($path)
    );
}

1;
