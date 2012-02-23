package DoubleSpark::Web::C::API::Public;
use strict;
use warnings;
use Data::ICal;
use Data::ICal::Entry::Event;
use DoubleSpark::API::List;
use Encode qw/encode_utf8 decode_utf8/;
use HTML::Entities;
use JSON qw/encode_json/;
use XML::RSS;

sub html {
    my ($class, $c) = @_;

    $c->render('public.tt');
}

sub json {
    my ($class, $c) = @_;

    my $list = $c->db->single('list', { public_code => $c->{args}->{public_code} });

    return $c->res_404() unless $list;

    $c->render_json($list->as_hashref);
}

sub jsonp {
    my ($class, $c) = @_;

    my $list = $c->db->single('list', { public_code => $c->{args}->{public_code} });

    return $c->res_404() unless $list;

    my $callback = $c->req->param('callback') || '';
    $callback=~s|[^0-9a-zA-Z_]||g;
    $callback = 'callback' unless length $callback;
    my $content = encode_utf8($callback) . '(' . encode_json($list->as_hashref) . ');';
    my $encoding = $c->encoding();
    $encoding = lc($encoding->mime_name) if ref $encoding;
    $c->create_response(
        200,
        [
            'Content-Type' => "text/javascript; charset=$encoding",
            'Content-Length' => length($content),
        ],
        [$content]
    );
}

sub rss {
    my ($class, $c) = @_;

    my $lang = ($c->req->param('lang') || '') eq 'ja' ? 'ja' : 'en';

    my $list = $c->db->single('list', { public_code => $c->{args}->{public_code} });

    return $c->res_404() unless $list;

    my $toDate = sub {
        my $epoch = shift;
        my $dt = DateTime->from_epoch( epoch => int($epoch / 1000) );
        return $dt->strftime('%Y-%m-%dT%H:%M:%S');
    };

    my $rss = XML::RSS->new(version => '1.0');
    $rss->add_module(
        prefix => 'content',
        uri => 'http://purl.org/rss/1.0/modules/content/',
    );
    $rss->channel(
        title       => $list->data->{name} . ' ' . '(7kai Tasks)',
        link        => 'https://tasks.7ka.org/',
        description => '',
        dc => {
            date       => $toDate->($list->actioned_on),
            subject    => '7kai Tasks',
            creator    => '',
            publisher  => '',
            rights     => '',
            language   => $lang
        }
    );

    my $usermap;
    for my $user (@{ $list->data->{users} }) {
        $usermap->{$user->{code}} = $user;
    }

    my $messages = {
        'create-task-ja'    => 'さんがタスクを作成',
        'create-task-en'    => 'create the task of the',
        'update-task-ja'    => 'さんがタスクを更新',
        'update-task-en'    => 'update the task of the',
        'reopen-task-ja'    => 'さんがタスクを更新 (処理済 => 未着手)',
        'reopen-task-en'    => 'update (fix => open) the task of the',
        'start-task-ja'     => 'さんがタスクに着手',
        'start-task-en'     => 'start the task of the',
        'fix-task-ja'       => 'さんがタスクを処理',
        'fix-task-en'       => 'fix the task of the',
        'close-task-ja'     => 'さんがタスクを完了',
        'close-task-en'     => 'close the task of the',
        'rereopen-task-ja'  => 'さんがタスクを更新 (完了 => 未着手)',
        'rereopen-task-en'  => 'update (close => open) the task of the',
        'restart-task-ja'   => 'さんがタスクを更新 (処理済 => 着手)',
        'restart-task-en'   => 'update (close => start) the task of the',
        'refix-task-ja'     => 'さんがタスクを更新 (完了 => 処理済)',
        'refix-task-en'     => 'update (close => fix) the task of the',
        'comment-ja'        => 'さんがコメント',
        'comment-en'        => 'commented on a task in',
    };

    my @actions;
    for my $task (@{ $list->data->{tasks} }) {

        push @actions, {
            task   => $task,
            action => 'create-task',
            code   => $task->{registrant},
            time   => $task->{created_on}
        };

        $_->{task} = $task for @{ $task->{actions} };

        push @actions, @{ $task->{actions} };
    }

    my $count = 0;
    for my $action (@actions) {

        my $user = $usermap->{ $action->{code} };
        my $title = sprintf '%s %s "%s"'
            , ($user->{name} // '')
            , decode_utf8($messages->{ $action->{action} . '-' . $lang })
            , ($action->{task}->{name} // $action->{task}->{id});

        decode_entities($title);
        $title =~ s{&}{&amp;}gso;
        $title =~ s{<}{&lt;}gso;
        $title =~ s{>}{&gt;}gso;
        $title =~ s{"}{&quot;}gso;

        if ($action->{message}) {
            decode_entities($action->{message});
            $action->{message} =~ s{&}{&amp;}gso;
            $action->{message} =~ s{<}{&lt;}gso;
            $action->{message} =~ s{>}{&gt;}gso;
            $action->{message} =~ s{"}{&quot;}gso;
        }

        $rss->add_item(
            link        => 'https://tasks.7kai.org/',
            title       => $title,
            description => $action->{message} || '',
            dc => {
                creator => $user->{name},
                date    => $toDate->($list->actioned_on)
            }
        );

        $count++;
        last if $count >= 100;
    }

    my $content = $rss->as_string;
    $c->create_response(
        200,
        [
            'Content-Type' => 'application/rss+xml; charset=utf-8',
            'Content-Length' => length($content),
        ],
        [$content]
    );
}

sub ical {
    my ($class, $c) = @_;

    my $list = $c->db->single('list', { public_code => $c->{args}->{public_code} });

    return $c->res_404() unless $list;

    my $ical = Data::ICal->new;
    $ical->add_properties(
        'X-WR-CALNAME'  => $list->data->{name},
    );

    for my $task (@{ $list->data->{tasks} }) {
        next if $task->{closed};
        next unless $task->{due};
        my ($m, $d, $y) = split /\//, $task->{due};
        my $dt = DateTime->new(
            year       => $y,
            month      => $m,
            day        => $d,
            hour       => 0,
            minute     => 0,
            second     => 0,
            time_zone  => 'Asia/Tokyo'
        );
        my $event = Data::ICal::Entry::Event->new;
        $event->add_properties(
            summary     => $task->{name},
            description => '',
            dtstart     => [ $dt->ymd(''), { VALUE => 'DATE' } ],
            dtend       => [ $dt->add(days => 1)->ymd(''), { VALUE => 'DATE' } ],
        );
        $ical->add_entry($event);
    }

    my $content = encode_utf8($ical->as_string);
    $c->create_response(
        200,
        [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Length' => length($content),
        ],
        [$content]
    );
}

1;
