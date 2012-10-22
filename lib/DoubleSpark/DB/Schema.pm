package DoubleSpark::DB::Schema;
use Teng::Schema::Declare;
use JSON::XS;

table {
    name 'account';
    pk 'account_id';
    columns (
        {name => 'account_id', type => 4},
        {name => 'data', type => 12},
        {name => 'is_owner', type => 4},
        {name => 'modified_on', type => 4},
        {name => 'authenticated_on', type => 11},
        {name => 'created_on', type => 11},
        {name => 'updated_on', type => 11},
    );
    inflate 'data' => sub {
        return $_[0] ? decode_json(shift) : {};
    };
    deflate 'data' => sub {
        return encode_json(shift);
    };
};

table {
    name 'email_account';
    pk 'email_account_id';
    columns (
        {name => 'email_account_id', type => 4},
        {name => 'account_id', type => 4},
        {name => 'code', type => 12},
        {name => 'name', type => 12},
        {name => 'password_saltedhash', type => 12},
        {name => 'authenticated_on', type => 11},
        {name => 'created_on', type => 11},
        {name => 'updated_on', type => 11},
    );
    inflate 'password_saltedhash' => sub { '********' };
};

table {
    name 'fb_account';
    pk 'fb_account_id';
    columns (
        {name => 'fb_account_id', type => 4},
        {name => 'account_id', type => 4},
        {name => 'code', type => 12},
        {name => 'name', type => 12},
        {name => 'data', type => 12},
        {name => 'authenticated_on', type => 11},
        {name => 'created_on', type => 11},
        {name => 'updated_on', type => 11},
    );
    inflate 'data' => sub {
        return $_[0] ? decode_json(shift) : {};
    };
    deflate 'data' => sub {
        return encode_json(shift);
    };
};

table {
    name 'google_account';
    pk 'google_account_id';
    columns (
        {name => 'google_account_id', type => 4},
        {name => 'account_id', type => 4},
        {name => 'code', type => 12},
        {name => 'name', type => 12},
        {name => 'data', type => 12},
        {name => 'authenticated_on', type => 11},
        {name => 'created_on', type => 11},
        {name => 'updated_on', type => 11},
    );
    inflate 'data' => sub {
        return $_[0] ? decode_json(shift) : {};
    };
    deflate 'data' => sub {
        return encode_json(shift);
    };
};

table {
    name 'list';
    pk 'list_id';
    columns (
        {name => 'list_id', type => 4},
        {name => 'account_id', type => 4},
        {name => 'data', type => 12},
        {name => 'public_code', type => 12},
        {name => 'invite_code', type => 12},
        {name => 'actioned_on', type => 4},
        {name => 'created_on', type => 11},
        {name => 'updated_on', type => 11},
    );
    inflate 'data' => sub {
        return $_[0] ? decode_json(shift) : {};
    };
    deflate 'data' => sub {
        return encode_json(shift);
    };
};

table {
    name 'list_account';
    pk 'list_account_id';
    columns (
        {name => 'list_account_id', type => 4},
        {name => 'list_id', type => 4},
        {name => 'account_id', type => 4},
        {name => 'created_on', type => 11},
    );
};

table {
    name 'question';
    pk 'question_id';
    columns (
        {name => 'question_id', type => 4},
        {name => 'account_id', type => 4},
        {name => 'lang', type => 12},
        {name => 'question', type => 12},
        {name => 'answer', type => 12},
        {name => 'is_public', type => 4},
        {name => 'data', type => 12},
        {name => 'created_on', type => 11},
        {name => 'updated_on', type => 11},
    );
    inflate 'data' => sub {
        return $_[0] ? decode_json(shift) : {};
    };
    deflate 'data' => sub {
        return encode_json(shift);
    };
};

table {
    name 'request';
    pk 'request_id';
    columns (
        {name => 'request_id', type => 4},
        {name => 'account_id', type => 4},
        {name => 'name', type => 12},
        {name => 'lang', type => 12},
        {name => 'request', type => 12},
        {name => 'response', type => 12},
        {name => 'is_public', type => 4},
        {name => 'label_class', type => 12},
        {name => 'label_name', type => 12},
        {name => 'data', type => 12},
        {name => 'created_on', type => 11},
        {name => 'updated_on', type => 11},
    );
    inflate 'data' => sub {
        return $_[0] ? decode_json(shift) : {};
    };
    deflate 'data' => sub {
        return encode_json(shift);
    };
};

table {
    name 'tw_account';
    pk 'tw_account_id';
    columns (
        {name => 'tw_account_id', type => 4},
        {name => 'account_id', type => 4},
        {name => 'code', type => 12},
        {name => 'name', type => 12},
        {name => 'data', type => 12},
        {name => 'authenticated_on', type => 11},
        {name => 'created_on', type => 11},
        {name => 'updated_on', type => 11},
    );
    inflate 'data' => sub {
        return $_[0] ? decode_json(shift) : {};
    };
    deflate 'data' => sub {
        return encode_json(shift);
    };
};

1;
