"use strict";
(function(ns, w, d, $) {

var app = ns.app;

app.data.gantt = {
    start: null,
    max_days: 33
};

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
            } else if (date.getDay() > 4) {
                day.addClass('holiday');
            }
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
        }
        ele.append($(blank));
    });
    
    app.fireEvent('initGanttchart',
        new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}
app.setup.ganttchartTasks = function(ul){
    
    var template = ul.html();
    var taskli_map = {};
    var current_sort = {};
    ul.empty();
    
    app.addListener('registerTask', function(task){
        var li = $(template);
        li.data('id', task.id);
        if (task.parent_id && (task.parent_id in app.data.task_map)) {
            li.addClass('child');
        }
        app.dom.setup(li, task);
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
            if (app.data.current_filter &&
                app.util.taskFilter(task, app.data.current_filter)) {
                li.data('visible', true);
                li.show();
                app.util.findChildTasks(task, function(child){
                    if (child.id && taskli_map[child.id]) {
                        if (!app.util.taskFilter(child, app.data.current_filter)) {
                            return ;
                        }
                        if (!taskli_map[child.id].data('visible')) {
                            taskli_map[child.id].data('visible', true);
                            taskli_map[child.id].show();
                        }
                    }
                });
            } else {
                li.data('visible', false);
                li.hide();
                app.util.findChildTasks(task, function(child){
                    if (child.id && taskli_map[child.id]) {
                        if (taskli_map[child.id].data('visible')) {
                            taskli_map[child.id].data('visible', false);
                            taskli_map[child.id].hide();
                        }
                    }
                });
            }
            if (taskli_map[task.id].hasClass('selected')) {
                li.addClass('selected');
            }
            taskli_map[task.id].after(li);
            taskli_map[task.id].remove();
            taskli_map[task.id] = li;
        } else {
            if (app.data.current_filter &&
                app.util.taskFilter(task, app.data.current_filter)) {
                li.data('visible', true);
            } else {
                li.hide();
            }
            taskli_map[task.id] = li;
            li.appendTo(ul);
        }
    });
    
    app.addListener('openTask', function(task){
        ul.children().removeClass('selected');
        if (task.id in taskli_map) {
            taskli_map[task.id].addClass('selected');
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
            ul.append(taskli_map[tasks[i].id]);
        }
        current_sort.column = column;
        current_sort.reverse = reverse;
    });
    
    app.addListener('filterTask', function(condition){
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = taskli_map[task_id];
            if (app.util.taskFilter(task, condition)) {
                if (!li.data('visible')) {
                    li.data('visible', true);
                    li.show();
                } else {
                    li.show();
                }
            } else {
                if (li.data('visible')) {
                    li.data('visible', false);
                    li.hide();
                }
            }
        }
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
    
    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (!ul.is(':visible')) {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (e.shiftKey) {
            if (e.keyCode === 37) { // left
                e.preventDefault();
                app.fireEvent('initGanttchart',
                    new Date(
                        app.data.gantt.start.getFullYear(),
                        app.data.gantt.start.getMonth(),
                        app.data.gantt.start.getDate() - 7));
            }
            if (e.keyCode === 39) { // right
                e.preventDefault();
                app.fireEvent('initGanttchart',
                    new Date(
                        app.data.gantt.start.getFullYear(),
                        app.data.gantt.start.getMonth(),
                        app.data.gantt.start.getDate() + 7));
            }
            return;
        }
        if (e.keyCode === 38) { // Up
            var next;
            if (app.data.current_task) {
                next = taskli_map[app.data.current_task.id].prevAll(':visible:first');
            }
            if (!next) {
                next = ul.find('> li:visible:first');
            }
            if (next && next.length) {
                var next_id = next.data('id');
                if (!(next_id in app.data.task_map)) {
                    return;
                }
                app.fireEvent('openTask', app.data.task_map[next_id]);
            } else {
                app.fireEvent('openPrevList');
            }
        } else if (e.keyCode === 40) { // Down
            var next;
            if (app.data.current_task) {
                next = taskli_map[app.data.current_task.id].nextAll(':visible:first');
            }
            if (!next) {
                next = ul.find('> li:visible:first');
            }
            if (next && next.length) {
                var next_id = next.data('id');
                if (!(next_id in app.data.task_map)) {
                    return;
                }
                app.fireEvent('openTask', app.data.task_map[next_id]);
            } else {
                app.fireEvent('openNextList');
            }
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