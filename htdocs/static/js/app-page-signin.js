(function(ns, w, d) {

var c = ns.c;
var app = ns.app;

c.addEvents('registerAccount');
c.addEvents('signin');
c.addEvents('signup');

app.setup.signin = function(form){
    app.dom.show(form);
}
app.setup.signup = function(form){

    c.addListener('signup', function(){
        app.ajax({
            url: '/signin/email/signup',
            type: 'post',
            data: form.serialize(),
            dataType: 'json'
        })
        .done(function(data){
            if (data.success) {
                c.fireEvent('registerAccount', data.account);
            } else {
                // FIXME: 
                alert('Sign Up failure, please check E-mail and password.');
            }
        })
        .fail(function(){
            alert('Sign Up failure, please check E-mail and password.');
        });
    });

    c.addListener('signin', function(){
        app.ajax({
            url: '/signin/email/signin',
            type: 'post',
            data: form.serialize(),
            dataType: 'json'
        })
        .done(function(data){
            if (data.success) {
                location.href = '/';
            } else {
                // FIXME: 
                alert('Sign In failure, please check E-mail and password.');
            }
        })
        .fail(function(){
            alert('Sign In failure, please check E-mail and password.');
        });
    });
}
app.click.signin = function(ele){
    c.fireEvent('signin');
}
app.click.signup = function(ele){
    c.fireEvent('signup');
}
app.setup.verify = function(form){
    c.addListener('registerAccount', function(){
        app.dom.show(form);
    });
}
app.submit.verify = function(form){
    app.ajax({
        url: '/signin/email/verify',
        type: 'post',
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            location.href = '/';
        } else {
            // FIXME: 
            alert('Verify failure, please check code.');
        }
    })
    .fail(function(){
        alert('Verify failure, please check code.');
    });
}

})(this, this, document);