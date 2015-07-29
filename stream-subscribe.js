
var apis = require('./apis');
var util = require('./util');

var dbg = function(m) {
    util.isDebug('sub') && node.log( m );
};

var print = function() {
    util.log.apply(util.log, arguments);
};


module.exports = function(RED) {

    function StreamSubscribe(config) {

        RED.nodes.createNode(this, config);

        var node = this;

        node.name = config.name;
        node.soid = config.soid;
        node.stream = config.stream && config.stream.length ? config.stream : null;

        node.api = RED.nodes.getNode(config.api);

        if(!node.soid) {
            node.soid = node.api.soid;
        }

        node.api.transport = !node.api.transport || node.api.transport === "http" ? 'mqtt' : node.api.transport;

        apis.getServiceObject(node.api, node.soid)
        .then(function(so) {

            var api = this;

            var streamName = node.stream;
            var stream = so.getStream(streamName);

            if(!stream) {
                return api.lib.Promise.reject(new Error("Stream '"+ streamName +"' not found in " + so.name));
            }

            dbg("Subscribing to " + streamName);

            return stream.subscribe(function(data) {

                dbg("Stream "+ streamName +" updated!");

                node.send({
                    payload: data
                });

            });
        })
        .catch(function(err) {
            node.error(err);
            print(err);
        });

        this.on('close', function() {
            // tidy up any state
            dbg("Closing node");

        });

    };

    RED.nodes.registerType("stream-subscribe", StreamSubscribe);
};