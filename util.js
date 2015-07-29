
var lib = module.exports;

lib.log = function(key, m) {
    lib.isDebug(arguments[0]) && console.log.apply(console.log, arguments);
};

var _dbg;
lib.isDebug = function(key) {
    if(!_dbg) {
        _dbg = process.env.DEBUG || [];
        if(_dbg) {
            _dbg = _dbg.split(",");
        }
    }
    return _dbg.indexOf(key) < -1;
};

lib.parsePayload = function(msg, node) {
    
    var obj = {
        soid: null,
        so: null,
        data: null,
        stream: null
    };
    
    if(msg.soid) {
        obj.soid = msg.soid;
    }
    
    if(msg.stream) {
        obj.stream = msg.stream;
    }
    
    if(msg.so && msg.so.id) {
        obj.so = msg.so;
        obj.soid = msg.so.id;
    }
    

    if(!msg.payload) {
        return obj;
    }
    
    if(!obj.soid) {
        
        if(typeof msg.payload === 'string') {
            obj.soid = msg.payload;
        }

        var _d = msg.payload;
        if(_d instanceof Array && _d.length === 1) {
            _d = _d.shift();
        }

        if(_d.id !== undefined) {
            obj.soid = _d.id;
            obj.so = _d;
        }

    }
    
    if(typeof msg.payload === 'object') {
        obj.data = msg.payload;
    }
    
    if(node) {
        node.soid = node.soid || obj.soid;
        node.stream = node.stream || obj.stream;
    }
    
    return obj;
};