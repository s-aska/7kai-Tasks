package DoubleSpark::Web::C::API::Question;
use strict;
use warnings;
use DoubleSpark::Validator;
use Log::Minimal;
use Time::HiRes;

sub list {
    my ($class, $c) = @_;
    
    my @questions;
    for my $row ($c->db->search('question')->all) {
        my $question = $row->get_columns;
        $question->{data} = $row->data;
        delete $question->{code};
        push @questions, $question;
    }
    
    $c->render_json({
        success => 1,
        questions => \@questions
    });
}

sub create {
    my ($class, $c) = @_;

    my $res = DoubleSpark::Validator->validate($c, $c->req,
        question   => [qw/NOT_NULL/, [qw/LENGTH 1 10000/]]
    );
    return $c->res_403() unless $res;

    my $question  = $c->req->param('question');
    my $anonymous = $c->req->param('anonymous');

    $c->db->insert('question', {
        code       => $c->sign_code,
        question    => $question,
        lang       => 'ja',
        is_public  => 0,
        data        => {
            star => {}
        },
        created_on => \'now()',
        updated_on => \'now()'
    });

    infof('[%s] create question', $c->sign_name);

    $c->render_json({ success => 1 });
}

sub update {
    my ($class, $c) = @_;
    
    return $c->res_403() unless $c->is_owner;

    my $question_id = $c->req->param('question_id');
    my $question    = $c->req->param('question')  || '';
    my $answer      = $c->req->param('answer')    || '';
    my $is_public   = $c->req->param('is_public') || 0;
    
    $c->db->update('question', {
        question    => $question,
        answer      => $answer,
        is_public   => $is_public,
        updated_on  => \'now()'
    }, {
        question_id => $question_id
    });
    
    $c->render_json({ success => 1 });
}

sub star {
    my ($class, $c) = @_;
    
    my $question_id = $c->req->param('question_id');
    my $question = $c->db->single('question', {
        question_id => $question_id
    });
    return $c->res_404() unless $question;
    
    $question->data->{star}->{ $c->sign_code }++;
    $question->update({ data => $question->data });
    
    $c->render_json({ success => 1 });
}

sub unstar {
    my ($class, $c) = @_;
    
    my $question_id = $c->req->param('question_id');
    my $question = $c->db->single('question', {
        question_id => $question_id
    });
    return $c->res_404() unless $question;
    
    delete $question->data->{star}->{ $c->sign_code };
    $question->update({ data => $question->data });
    
    $c->render_json({ success => 1 });
}

sub delete {
    my ($class, $c) = @_;
    
    # self or developer
    
    
    
}

1;
