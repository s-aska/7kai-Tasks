(function(ns, w, d) {

var app = ns.app;

app.addEvents('emailSignup');        // click signup button 
app.addEvents('emailSignupSuccess'); // 
app.addEvents('emailSignin');        // click signin button

app.setup.emailSignup = function(form){
    app.addListener('emailSignup', function(){
        app.ajax({
            url: '/signin/email/signup',
            type: 'post',
            data: form.serialize(),
            dataType: 'json'
        })
        .done(function(data){
            if (data.success) {
                app.fireEvent('emailSignupSuccess', data.account);
            } else {
                // FIXME:
                alert('Sign Up failure, please check E-mail and password.');
            }
        })
        .fail(function(){
            alert('Sign Up failure, please check E-mail and password.');
        });
    });
    app.addListener('emailSignin', function(){
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
app.click.emailSignin = function(ele){
    app.fireEvent('emailSignin');
}
app.click.emailSignup = function(ele){
    app.fireEvent('emailSignup');
}
app.setup.emailVerify = function(form){
    app.addListener('emailSignupSuccess', function(){
        app.dom.show(form);
    });
}
app.submit.emailVerify = function(form){
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
