
var apis = require('./apis');
var util = require('./util');

var dbg = function(m) {
    util.isDebug('sub') && node.log( m );
};

var print = function() {
    util.log.apply(util.log, arguments);
};

var Promise = apis.Promise;

module.exports = function (RED) {

    function SoLoad(config) {

        RED.nodes.createNode(this, config);

        var node = this;

        node.singleitem = config.singleitem;

        node.api = RED.nodes.getNode(config.api);

        this.on('input', function (msg) {

            dbg("msg " + JSON.stringify(msg));
            
            apis.fromNode(node.api).then(function(api) {
                
                var isSingleId = (typeof msg.payload === 'string');

                var soids = msg.payload;
                if(isSingleId) {
                    soids = [msg.payload];
                }

                api.lib.Promise.all(soids)
                    .map(function(soid) {
                        return api.load(soid)
                                .then(function(so) {
                            
                                    var json = so.toJson();
                            
                                    if(node.singleitem) {
                                        node.send({
                                            soid: so.id,
                                            payload: json
                                        });                    
                                    }
                                    
                                    return api.lib.Promise.resolve(json);
                                });
                    })
                    .then(function(defs) {
                        
                        if(!node.singleitem) {
                            node.send({
                                payload: defs
                            });
                        }
                        
                        return api.lib.Promise.resolve(defs);
                    })
                    .catch(function(e) {
                        node.error("An error occured loading object");
                        node.error(e);
                    });
            });
        });

        this.on('close', function () {
            // tidy up any state
            dbg("Closing node");
        });
    };

    RED.nodes.registerType("so-load", SoLoad);
};