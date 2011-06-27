(function(ns, w, d) {

ns.Tasks = initialize;
ns.Tasks.prototype = {
    
    list_name_max_length: 20,
    
    run: run,
    initEvent: initEvent,
    
    ajax: ajax,
    message: message,
    
    createListAction: createListAction,
    updateListAction: updateListAction,
    deleteListAction: deleteListAction
};

function initialize(options){
    if (typeof window.console == 'object') {
        this.log = function(msg){
            console.log(msg);
        }
    } else {
        this.log = function(){};
    }
}

function run(){
    var self = this;

    this.initEvent();

    this.log('run');
}
function initEvent(){
    var self = this;
    
    $('#new-list-button').click(function(){self.createListAction()});
}
function refresh(){
    
}
function ajax(ajaxOption){
    var self = this;
    this.log('ajax: begin url=' + ajaxOption.url);
    $.ajax(ajaxOption)
    .done(function(data){
        if (data.success) {
            self.refresh();
            self.log('ajax: end');
        } else {
            self.message(data.message);
            self.log('ajax: failure');
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        self.log('ajax: error code=' + jqXHR.status + ' message=' + errorThrown);
        self.message(jqXHR.status + ' ' + errorThrown);
    });
}
function message(message){
    alert(message);
}
function createListAction(){
    var name = prompt('Create a new list named:');
    if (!name) {
        return;
    }
    if (name.length > this.list_name_max_length) {
        alert('[ERROR] list named max 20chars!');
        return;
    }
    this.ajax({
        type: 'post',
        url: '/api/1/list/create',
        data: {
            name: name
        },
        dataType: 'json'
    });
}
function updateListAction(){
    var self = this;

    this.log('run');
}
function deleteListAction(){
    var self = this;

    this.log('run');
}

})(this, this, document);