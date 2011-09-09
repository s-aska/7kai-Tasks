(function(ns, w, d) {

// 定数
ns.app.option = {
    
    condition: {
        list_id: null,
        star: null,
        status: null,
        status_ignore: null,
        closed: 0,
        registrant: null,
        assign: null,
        todo: null,
        notify: null
    },
    
    valid: {
        list_name_max_length: 20,
    },
    
    // フレンド再取得するまでの期間
    friends_reload_threshold: 24 * 60 * 60 * 1000
    
    
};

})(this, this, document);