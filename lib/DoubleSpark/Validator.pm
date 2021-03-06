package DoubleSpark::Validator;
use strict;
use warnings;
use FormValidator::Lite;
use Log::Minimal;

sub check {
    my ($class, $c, $query, @rule) = @_;
    my $validator = FormValidator::Lite->new($query);
    $validator->load_constraints(qw/Email URL/);
    $validator->load_constraints('+DoubleSpark::Validator::Constraint');
    $validator->check(@rule);
    $validator;
}

sub validate {
    my ($class, $c, $query, @rule) = @_;
    my $validator = $class->check($c, $query, @rule);
    if ($validator->has_error) {
        # ATTACK
        warnf('[%s] validate error...', $c->sign_name);
        for my $key (keys %{ $validator->errors }) {
            my $rules = join ' and ', keys %{ $validator->errors->{ $key } };
            warnf('[%s] validate error %s incorrect %s', $c->sign_name, $key, $rules);
        }
        return;
    }
    return 1;
}

1;
