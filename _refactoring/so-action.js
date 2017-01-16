
var apis = require('./apis');
var util = require('./util');

var print = function(m) {
    util.log('act', m);
};


module.exports = function(RED) {

    function SoAction(config) {

        RED.nodes.createNode(this, config);

        var node = this;

        var dbg = function(m) {
            util.isDebug('act') && node.log( m );
        };
        
        node.name = config.name;
//        node.body = config.body;

        node.api = RED.nodes.getNode(config.api);
        
        node.soid = config.soid;
        if(!node.soid) {
            node.soid = node.api.soid;
        }
        
        this.on('input', function (msg) {

            dbg("msg " + JSON.stringify(msg));

            apis.getServiceObject(node.api, node.soid)
            .then(function(so) {

                var api = this;

                var actionName = node.name;
                var action = so.getAction(actionName);

                if(!action) {
                    return api.lib.Promise.reject(new Error("Action '"+ actionName +"' not found in " + so.name));
                }

                dbg("Executing " + actionName + ": " + msg.payload.toString());
                return action.invoke(msg.payload).then(function() {

                    dbg("Action invoked");
                });
            })
            .catch(function(err) {
                node.error(err);
                print(err);
            });
            
            
        });

        this.on('close', function() {
            // tidy up any state
            dbg("Closing node");

        });

    };

    RED.nodes.registerType("so-action", SoAction);
};