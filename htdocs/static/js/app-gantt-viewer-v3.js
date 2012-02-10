"use strict";
(function(ns, w, d, $) {

var app = ns.app;

app.data.gantt = {
    start: null,
    max_days: 33
};

var app = ns.app;

app.data.gantt_taskli_map = {};

app.addEvents('initGanttchart');

app.addListener('initGanttchart', function(start){
    app.data.gantt.start = new Date(
        start.getFullYear(), start.getMonth(), start.getDate());
});

app.setup.ganttchartSheet = function(ele){
    var blank = '<div class="month"><h1>&nbsp;</h1><div class="days clearfix">'
              + '<div class="day firstday"><h2>&nbsp;</h2></div></div></div>';
    var now   = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var createMonth = function(date, width){
        var label = width > 3
                  ? $('<h1/>').text(app.MONTH_NAMES[date.getMonth()] + ' ' + date.getFullYear())
                  : width > 0
                  ? $('<h1/>').text(app.MONTH_NAMES_SHORT[date.getMonth()])
                  : $('<h1/>').html('&nbsp;')
        return $('<div class="month"></div>').append(label);
    };
    
    app.addListener('initGanttchart', function(start){
        ele.html(blank);
        var date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        var days = $('<div class="days clearfix"></div>');
        var width =
            (new Date(start.getFullYear(), start.getMonth() + 1, 0)).getDate()
            - start.getDate();
        createMonth.call(app, date, width).append(days).appendTo(ele);
        for (var i = 0, max_i = app.data.gantt.max_days; i < max_i; i++) {
            if (i > 0 && date.getDate() === 1) {
                days = $('<div class="days clearfix"></div>');
                createMonth.call(app, date, max_i - i).append(days).appendTo(ele);
            }
            var day = $('<div class="day"><h2>' + date.getDate() + '</h2></div>');
            day.appendTo(days);
            if (i === 0 || date.getDate() === 1) {
                day.addClass('firstday');
            }
            if (today.getTime() === date.getTime()) {
                day.addClass('today');
            } else if (date.getDay() === 0 || date.getDay() === 6) {
                day.addClass('holiday');
            }
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
        }
        ele.append($(blank));
    });
    
    app.fireEvent('initGanttchart',
        new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}
app.setup.ganttchartListsV3 = function(ul){
    var listli_map = {};
    var list_template = ul.html();
    var task_template = ul.find('> li > ul').html();
    ul.empty();

    var current_task;
    var current_filter = {};
    var active_tags = {};

    app.addListener('toggleTag', function(tag, active){
        if (!ul.is(':visible')) {
            return;
        }
        if (active) {
            active_tags[tag] = true;
        } else if (tag in active_tags) {
            delete active_tags[tag];
        }
        ul.children().each(function(i, element){
            var li = $(element);
            var id = li.data('id');
            var list = app.data.list_map[id];
            var method = 'show';
            for (var tag in active_tags) {
                if (tag in app.data.state.tags &&
                    list.id in app.data.state.tags[tag]) {
                    method = 'show';
                    break;
                } else {
                    method = 'hide';
                }
            }
            li[method]();
        });
    });

    app.addListener('checkTag', function(list, tag, active){
        var li = listli_map[list.id];
        li.find('> div .symbol-' + tag).toggleClass('symbol-clear', !active);
        var method = 'show';
        for (var tag in active_tags) {
            if (tag in app.data.state.tags &&
                list.id in app.data.state.tags[tag]) {
                method = 'show';
                break;
            } else {
                method = 'hide';
            }
        }
        li[method]();
    });

    app.addListener('resetTag', function(){
        ul.children().show();
        active_tags = {};
    });

    app.addListener('registerList', function(list){
        var li = $(list_template);
        li.data('id', list.id);
        li.find('> div .name').text(list.name);
        li.find('> ul').empty();
        app.dom.setup(li);
        
        li.find('> div .symbol').addClass('symbol-clear');
        $.each([
            'primary',
            'success',
            'warning',
            'danger'
        ], function(i, tag){
            if (tag in app.data.state.tags &&
                list.id in app.data.state.tags[tag]) {
                li.find('> div .symbol-' + tag).removeClass('symbol-clear');
            }
        });
        
        li.find('.ui-edit').click(function(e){
            app.fireEvent('editTask', current_task);
        });
        li.find('.ui-sub').click(function(e){
            app.fireEvent('createSubTask', current_task);
        });
        
        if (list.id in listli_map) {
            li.find('> ul').append(listli_map[list.id].find('> ul').children());
            listli_map[list.id].after(li);
            listli_map[list.id].remove();
        } else {
            li.prependTo(ul);
        }
        listli_map[list.id] = li;
    });

    app.addListener('clear', function(){
        ul.empty();
        app.data.gantt_listli_map = listli_map = {};
    });

    // ---
    
    var taskli_map = app.data.gantt_taskli_map;
    var current_sort = {};
    
    app.addListener('registerTask', function(task){
        var ul = listli_map[task.list.id].find('> ul:first');
        var li = $(task_template);
        li.data('id', task.id);

        app.dom.setup(li, task);

        if (task.closed) {
            li.addClass('closed');
        }

        if (task.due) {
            var days = app.date.relativeDays(task.due_date, app.data.gantt.start);
            if (days > app.data.gantt.max_days) {
                li.find('.due').css('left', ((app.data.gantt.max_days + 1) * 23) + 'px');
            } else if (days > -1) {
                li.find('.due').css('left', ((days + 1) * 23) + 'px'); 
            }
        }
        li.find('.human').draggable({
            axis: 'x',
            containment: 'parent',
            grid: [23],
            stop: function(e, ui){
                var date = new Date(
                    app.data.gantt.start.getFullYear()
                    , app.data.gantt.start.getMonth()
                    , app.data.gantt.start.getDate() + parseInt(ui.position.left / 23, 10) - 1
                );
                var due = app.date.mdy(date);
                app.api.task.update({
                    list_id: task.list.id,
                    task_id: task.id,
                    registrant: app.util.getRegistrant(task.list),
                    due: due
                });
            }
        });
        li.click(function(e){
            e.stopPropagation();
            app.fireEvent('openTask', task);
        });
        li.dblclick(function(e){
            e.stopPropagation();
            app.fireEvent('editTask', task);
        });
        if (task.id in taskli_map) {
            var li_before = taskli_map[task.id];
            if (!li_before.data('visible')) {
                li.data('visible', false);
                li.hide();
            } else {
                li.data('visible', true);
            }
            if (li_before.hasClass('selected')) {
                li.addClass('selected');
            }

            // 置き換え元との高さ合わせ
            var paddingLeft = parseInt(li_before.css('paddingLeft'), 10);
            if (paddingLeft) {
                li.css('paddingLeft', paddingLeft + 'px');
            }

            // 置き換え
            if (task.before &&
                task.before.list.id !== task.list.id) {
                ul.append(li);
            } else {
                li_before.after(li);
            }
            li_before.remove();
            if (app.util.taskFilter(task, current_filter)) {
                li.data('visible', true);
                app.dom.slideDown(li);
                app.util.findChildTasks(task, function(child){
                    if (child.id && taskli_map[child.id]) {
                        if (!app.util.taskFilter(child, current_filter)) {
                            return;
                        }
                        if (!taskli_map[child.id].data('visible')) {
                            taskli_map[child.id].data('visible', true);
                            app.dom.slideDown(taskli_map[child.id]);
                        }
                    }
                });
            } else {
                li.data('visible', false);
                app.dom.slideUp(li);
                app.util.findChildTasks(task, function(child){
                    if (child.id && taskli_map[child.id]) {
                        if (app.util.taskFilter(child, current_filter)) {
                            return;
                        }
                        if (taskli_map[child.id].data('visible')) {
                            taskli_map[child.id].data('visible', false);
                            app.dom.slideUp(taskli_map[child.id]);
                        }
                    }
                });
                if (li.hasClass('selected')) {
                    var next = li.nextAll(':visible:first');
                    if (!next.length) {
                        next = li.prevAll(':visible:first');
                    }
                    if (next.length) {
                        app.fireEvent('openTask', app.data.task_map[next.data('id')]);
                    } else {
                        app.fireEvent('missingTask');
                    }
                }
            }
            taskli_map[task.id] = li;
        } else {
            li.css('left', '0px');
            li.hide();
            taskli_map[task.id] = li;
            if (task.parent_id in taskli_map) {
                taskli_map[task.parent_id].after(li);
                var paddingLeft = parseInt(taskli_map[task.parent_id].css('paddingLeft'), 10);
                li.css('paddingLeft', (paddingLeft + 18) + 'px');
            } else {
                li.prependTo(ul);
            }
            if (app.util.taskFilter(task, current_filter)) {
                li.data('visible', true);
                app.dom.slideDown(li);
            }
        }
    });
    
    app.addListener('openTask', function(task){
        if (!ul.is(':visible')) { return }
        ul.find('> li > ul > li').removeClass('selected');
        ul.find('.ui-edit, .ui-sub').attr('disabled', true);
        if (task.id in taskli_map) {
            taskli_map[task.id].addClass('selected');
            taskli_map[task.id].parent().parent()
                .find('.ui-edit, .ui-sub').attr('disabled', false);
                app.dom.scrollTopFix(ul.parent(), taskli_map[task.id]);
        }
        current_task = task;
    });

    app.addListener('openNextTask', function(skip){
        var next;
        if (current_task) {
            if (!skip) {
                next = taskli_map[current_task.id].nextAll(':visible:first');
            }
            if (!next || !next.length) {
                listli_map[current_task.list.id]
                    .nextAll(':visible')
                    .each(function(i, li){
                        next = $(li).find('> ul > li:visible:first');
                        if (next.length) {
                            return false;
                        }
                    });
            }
        }
        if (!next || !next.length) {
            next = ul.find('> li > ul > li:visible:first');
        }
        if (next && next.length) {
            var next_id = next.data('id');
            if (!(next_id in app.data.task_map)) {
                return;
            }
            app.fireEvent('openTask', app.data.task_map[next_id]);
        }
    });
    
    app.addListener('openPrevTask', function(skip){
        var next;
        if (current_task) {
            if (!skip) {
                next = taskli_map[current_task.id].prevAll(':visible:first');
            }
            if (!next || !next.length) {
                listli_map[current_task.list.id]
                    .prevAll(':visible')
                    .each(function(i, li){
                        next = skip
                             ? $(li).find('> ul > li:visible:first')
                             : $(li).find('> ul > li:visible:last');
                        if (next.length) {
                            return false;
                        }
                    });
            }
        }
        if (!next || !next.length) {
            next = ul.find('> li > ul > li:visible:last');
        }
        if (next && next.length) {
            var next_id = next.data('id');
            if (!(next_id in app.data.task_map)) {
                return;
            }
            app.fireEvent('openTask', app.data.task_map[next_id]);
        }
    });

    app.addListener('sortTask', function(column, reverse){
        var tasks = [],
            resort = false;
        for (var task_id in app.data.task_map) {
            tasks.push(app.data.task_map[task_id]);
        }
        if (!column) {
            column = current_sort.column;
            reverse = current_sort.reverse;
            resort = true;
        }
        if (!resort
            && current_sort.column === column
            && current_sort.reverse === reverse) {
            reverse = reverse ? false : true;
        }
        app.util.sortTask(tasks, column, reverse);
        for (var i = 0, max_i = tasks.length; i < max_i; i++) {
            var ul = listli_map[tasks[i].list.id].find('> ul:first');
            ul.append(taskli_map[tasks[i].id]);
            var parents = app.util.findParentTasks(tasks[i]);
            if (parents.length) {
                taskli_map[tasks[i].id].css('paddingLeft', ((parents.length * 18) + 0) + 'px');
            } else {
                taskli_map[tasks[i].id].css('paddingLeft', '0px');
            }
        }
        current_sort.column = column;
        current_sort.reverse = reverse;
    });

    app.addListener('filterTask', function(condition){
        if (!ul.is(':visible')) {
            return;
        }
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = taskli_map[task_id];
            if (app.util.taskFilter(task, condition)) {
                if (!li.data('visible')) {
                    li.data('visible', true);
                    li.slideDown('fast');
                } else {
                    li.slideDown('fast');
                }
            } else {
                if (li.data('visible')) {
                    li.data('visible', false);
                    li.slideUp('fast');
                }
            }
        }
        current_filter = condition;
    });
    
    app.addListener('initGanttchart', function(start){
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = taskli_map[task_id];
            if (task.due) {
                var days = app.date.relativeDays(task.due_date, start);
                if (days > app.data.gantt.max_days) {
                    li.find('.due').css('left', ((app.data.gantt.max_days + 1) * 23) + 'px');
                } else if (days > -1) {
                    li.find('.due').css('left', ((days + 1) * 23) + 'px'); 
                } else {
                    li.find('.due').css('left', '0px'); 
                }
            }
        }
    });

    app.addListener('openNextList', function(){
        if (!ul.is(':visible')) {
            return;
        }
        app.fireEvent('openNextTask', true);
    });

    app.addListener('openPrevList', function(){
        if (!ul.is(':visible')) {
            return;
        }
        app.fireEvent('openPrevTask', true);
    });

    app.addListener('clearList', function(list){
        var is_remove = function(task){
            if (list.id !== task.list.id) {
                return false;
            }
            if (task.closed) {
                return true;
            }
            if (task.parent_id) {
                var parent = app.data.task_map[task.parent_id];
                if (!parent || parent.closed) {
                    return true;
                }
            }
            return false;
        };
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var parentTask = app.util.findParentTask(task);
            if (is_remove(task)) {
                if (task_id in taskli_map) {
                    taskli_map[task_id].remove();
                    delete taskli_map[task_id];
                }
                delete taskli_map[task_id];
            }
        }
    });

    app.addListener('missingTask', function(){
        if (!ul.is(':visible')) { return }
        current_task = null;
    });
    
    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (app.state.tab.viewer !== 'gantt') {
            return;
        }
        e.preventDefault();
        if (e.shiftKey) {
            if (e.keyCode === 38) { // Up
                app.fireEvent('openPrevList');
            } else if (e.keyCode === 40) { // Down
                app.fireEvent('openNextList');
            }
            return;
        }
        if (e.keyCode === 38 || e.keyCode === 75) { // Up / J
            app.fireEvent('openPrevTask');
        } else if (e.keyCode === 40 || e.keyCode === 74) { // Down / K
            app.fireEvent('openNextTask');
        }
        if (!current_task) {
            return;
        }
        if (e.keyCode === 37 || e.keyCode === 72) { // Left / H
            var task = current_task;
            var today = new Date();
            var due;
            if (task.due_date && task.due_date.getTime() > today.getTime()) {
                due = app.date.mdy(new Date(task.due_date.getTime() - (24 * 60 * 60 * 1000)));
            } else {
                due = '';
            }
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                due: due
            });
        } else if (e.keyCode === 39 || e.keyCode === 76) { // Right / L
            var task = current_task;
            var today = new Date();
            var date;
            if (task.due_date && task.due_date.getTime() > today.getTime()) {
                date = new Date(task.due_date.getTime() + (24 * 60 * 60 * 1000));
            } else {
                date = new Date(today.getTime() + (24 * 60 * 60 * 1000));
            }
            var due = app.date.mdy(date);
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                due: due
            });
        } else if (e.keyCode === 13) { // Enter
            var task = current_task;
            var closed = task.closed ? 0 : 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                closed: closed
            });
        }
    });
}
app.setup.nextWeek = function(ele){
    ele.click(function(e){
        e.preventDefault();
        app.fireEvent('initGanttchart',
            new Date(
                app.data.gantt.start.getFullYear(),
                app.data.gantt.start.getMonth(),
                app.data.gantt.start.getDate() + 7));
    });
    ele.disableSelection();
}
app.setup.prevWeek = function(ele){
    ele.click(function(e){
        e.preventDefault();
        app.fireEvent('initGanttchart',
            new Date(
                app.data.gantt.start.getFullYear(),
                app.data.gantt.start.getMonth(),
                app.data.gantt.start.getDate() - 7));
    });
    ele.disableSelection();
}

})(this, window, document, jQuery);