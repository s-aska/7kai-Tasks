(function(ns, w, d) {

ns.Tasks = initialize;
ns.Tasks.prototype = {
    run: run
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

function log(msg){
    if (typeof window.console == 'object') {
        console.log(msg);
    }
}

function run(){
    var self = this;

    this.log('run');
}

})(this, this, document);