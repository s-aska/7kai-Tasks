(function(ns, w, d, $) {

var app = ns.app;

app.addEvents('registerRequests');
app.addEvents('registerQuestions');
app.addEvents('editRequest');
app.addEvents('editQuestion');
app.addEvents('receiveStatistics');

app.addListener('setup', function(){
    app.api.me();
});

app.api.me = function(){
    app.ajax({
        url: '/api/1/account/me',
        data: { minimum: 1 },
        dataType: 'json'
    })
    .done(function(data){
        app.fireEvent('receiveToken', data.token);
        app.data.account  = data.account;
        app.data.sign     = data.sign;
        app.data.is_owner = data.is_owner;
        app.api.loadRequests();
        app.api.loadQuestions();
        app.api.loadStat();
    });
}
app.api.loadRequests = function(){
    app.ajax({
        url: '/api/1/request/list',
        dataType: 'json'
    })
    .done(function(data){
        app.fireEvent('registerRequests', data.requests);
    });
}
app.api.loadQuestions = function(){
    app.ajax({
        url: '/api/1/question/list',
        dataType: 'json'
    })
    .done(function(data){
        app.fireEvent('registerQuestions', data.questions);
    });
}
app.api.loadStat = function(){
    app.ajax({
        url: '/api/1/staff/stat',
        dataType: 'json'
    })
    .done(function(data){
        app.fireEvent('receiveStatistics', data.stat);
    });
}

app.setup.requests = function(ul){
    var template = ul.html();
    app.addListener('registerRequests', function(requests){
        ul.empty();
        for (var i = 0, max_i = requests.length; i < max_i; i++) {
            var request = requests[i];
            if (!Number(request.is_public)) {
                if (!app.data.is_owner) {
                    continue;
                }
            }
            var li = $(template);
            if (!Number(request.is_public)) {
                li.addClass('disabled');
            }
            li.data('request', request);
            li.find('blockquote').html(
                app.util.autolink(request.request).replace(/\r?\n/g, '<br />'));
            li.find('figure span').text(request.name);
            li.find('article > p').html(
                app.util.autolink(request.response).replace(/\r?\n/g, '<br />'));
            li.find('.label').text(request.label_name);
            
            li.find('.stars').empty();
            var stared = false;
            for (var star in request.data.star) {
                if (star === app.data.sign.code) {
                    stared = true;
                } else {
                    li.find('.stars').append($('<span>&#9733;</span>'));
                }
            }
            var star = $(stared ? '<span>&#9733;</span>' : '<span>&#9734;</span>');
            star.data('id', request.request_id);
            star.data('star', stared);
            star.addClass('action');
            star.click(function(){
                var star = $(this);
                var api  = star.data('star') ? 'unstar' : 'star';
                var mark = star.data('star') ? '&#9734;' : '&#9733;';
                app.ajax({
                    url: '/api/1/request/' + api,
                    type: 'POST',
                    data: {
                        request_id: star.data('id')
                    },
                    dataType: 'json'
                })
                .done(function(data){
                    if (data.success) {
                        star.html(mark);
                        star.data('star', Boolean(!star.data('star')));
                    }
                });
            });
            li.find('.stars').append(star);
            if (request.label_class) {
                li.find('.label').addClass(request.label_class);
            }
            if (app.data.is_owner) {
                li.find('blockquote').click((function(request){
                    return function(){
                        app.fireEvent('editRequest', request);
                    };
                })(request));
            }
            li.appendTo(ul);
        }
    });
}
app.setup.questions = function(ul){
    var template = ul.html();
    app.addListener('registerQuestions', function(questions){
        ul.empty();
        for (var i = 0, max_i = questions.length; i < max_i; i++) {
            var question = questions[i];
            if (!Number(question.is_public) && !app.data.is_owner) {
                continue;
            }
            var li = $(template);
            li.data('question', question);
            li.find('blockquote').html(
                app.util.autolink(question.question).replace(/\r?\n/g, '<br />'));
            li.find('article > p').html(
                app.util.autolink(question.answer).replace(/\r?\n/g, '<br />'));
            
            li.find('header').empty();
            var stared = false;
            for (var star in question.data.star) {
                if (star === app.data.sign.code) {
                    stared = true;
                } else {
                    li.find('header').append($('<span>&#9733;</span>'));
                }
            }
            var star = $(stared ? '<span>&#9733;</span>' : '<span>&#9734;</span>');
            star.data('id', question.question_id);
            star.data('star', stared);
            star.addClass('action');
            star.click(function(){
                var star = $(this);
                var api  = star.data('star') ? 'unstar' : 'star';
                var mark = star.data('star') ? '&#9734;' : '&#9733;';
                app.ajax({
                    url: '/api/1/question/' + api,
                    type: 'POST',
                    data: {
                        question_id: star.data('id')
                    },
                    dataType: 'json'
                })
                .done(function(data){
                    if (data.success) {
                        star.html(mark);
                        star.data('star', Boolean(!star.data('star')));
                    }
                });
            });
            li.find('header').append(star);
            if (app.data.is_owner) {
                li.find('blockquote').click((function(question){
                    return function(){
                        app.fireEvent('editQuestion', question);
                    };
                })(question));
            }
            li.appendTo(ul);
        }
    });
}
app.setup.zoom = function(ele){
    ele.focus(function(){
        ele.animate({
            height: '120px'
        })
    });
    ele.bind('initHeight', function(){
        ele.animate({
            height: '36px'
        });
    });
    ele.blur(function(){
        if (!ele.val().length) {
            ele.trigger('initHeight');
        }
    });
}
app.setup.registerRequestWindow = function(form){
    app.addListener('editRequest', function(request){
        form.find('input[name="request_id"]').val(request.request_id);
        form.find('textarea[name="request"]').val(request.request);
        form.find('textarea[name="response"]').val(request.response);
        form.find('input[name="label_name"]').val(request.label_name);
        form.find('select[name="label_class"]').val(request.label_class);
        form.find('input[name="is_public"]').val([request.is_public]);
        app.dom.show(form);
    });
}
app.setup.registerQuestionWindow = function(form){
    app.addListener('editQuestion', function(question){
        form.find('input[name="question_id"]').val(question.question_id);
        form.find('textarea[name="question"]').val(question.question);
        form.find('textarea[name="answer"]').val(question.answer);
        form.find('input[name="is_public"]').val([question.is_public]);
        app.dom.show(form);
    });
}
app.setup.statistics = function(ele){
    var weekly_active_accounts = ele.find('.weekly_active_accounts');
    var monthly_active_accounts = ele.find('.monthly_active_accounts');
    var total_accounts = ele.find('.total_accounts');
    var total_lists = ele.find('.total_lists');
    var tw_vs_fb = ele.find('.tw_vs_fb');
    app.addListener('receiveStatistics', function(stat){
        weekly_active_accounts.text(stat.weekly_active_accounts);
        monthly_active_accounts.text(stat.monthly_active_accounts);
        total_accounts.text(Number(stat.tw_accounts) + Number(stat.fb_accounts));
        total_lists.text(stat.total_lists);
        $.plot(tw_vs_fb, [
            { label: "Twitter",  data: Number(stat.tw_accounts)},
            { label: "Facebook", data: Number(stat.fb_accounts)},
            { label: "Google",   data: Number(stat.google_accounts)}
        ], {
            series: {
    			pie: { 
    				show: true,
    				radius: 1,
    				label: {
    					show: true,
    					radius: 1/2,
    					formatter: function(label, series){
    						return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'+label+'<br/>'+Math.round(series.percent)+'%</div>';
    					},
    					background: { opacity: 0.5 }
    				}
    			}
    		},
    		legend: {
    			show: false
    		}
        });
    });
}
app.submit.request = function(form){
    app.ajax({
        url: '/api/1/request/create',
        type: 'POST',
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.fireEvent('notice', 'request_create');
            form.get(0).reset();
            form.find('textarea').trigger('blur');
        }
    });
}
app.submit.question = function(form){
    app.ajax({
        url: '/api/1/question/create',
        type: 'POST',
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.fireEvent('notice', 'question_create');
            form.get(0).reset();
            form.find('textarea').trigger('blur');
        }
    });
}
app.submit.updateRequest = function(form){
    app.ajax({
        url: '/api/1/request/update',
        type: 'POST',
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.api.loadRequests();
        }
    });
}
app.submit.updateQuestion = function(form){
    app.ajax({
        url: '/api/1/question/update',
        type: 'POST',
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.api.loadQuestions();
        }
    });
}

})(this, window, document, jQuery);