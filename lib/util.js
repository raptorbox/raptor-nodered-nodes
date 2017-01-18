
var lib = module.exports;

lib.parsePayload = function(msg, node) {

    var obj = {
        objectId: null,
        so: null,
        data: null,
        stream: null
    };

    if(msg.objectId) {
        obj.objectId = msg.objectId;
    }
    if(msg.objectId) {
        obj.objectId = msg.objectId;
    }

    if(msg.stream) {
        obj.stream = msg.stream;
    }

    if(msg.so && msg.so.id) {
        obj.so = msg.so;
        obj.objectId = msg.so.id;
    }


    if(!msg.payload) {
        return obj;
    }

    if(!obj.objectId) {

        if(typeof msg.payload === 'string') {
            obj.objectId = msg.payload;
        }

        var _d = msg.payload;
        if(_d instanceof Array && _d.length === 1) {
            _d = _d.shift();
        }

        if(_d.id !== undefined) {
            obj.objectId = _d.id;
            obj.so = _d;
        }

    }

    if(typeof msg.payload === 'object') {
        obj.data = msg.payload;
    }

    if(node) {
        node.objectId = node.objectId || obj.objectId;
        node.stream = node.stream || obj.stream;
    }

    return obj;
};
