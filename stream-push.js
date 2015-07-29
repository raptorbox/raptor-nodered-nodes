
var apis = require('./apis');
var util = require('./util');

var dbg = function(m) {
    util.isDebug('sub') && node.log( m );
};

var print = function() {
    util.log.apply(util.log, arguments);
};


module.exports = function(RED) {

    function StreamPush(config) {

        RED.nodes.createNode(this, config);

        var node = this;

        node.name = config.name;
        node.soid = config.soid;
        node.stream = config.stream && config.stream.length ? config.stream : null;
        node.api = RED.nodes.getNode(config.api);

        if(!node.soid) {
            node.soid = node.api.soid;
        }

        this.on('input', function(msg) {

            var info = util.parsePayload(msg, node);

            var channelsData;

            // will be used as value for lastUpdate if not specified
            var timestamp = new Date;
            var rawdata = msg.payload;

            dbg("msg " + JSON.stringify(msg));
            
            if( info.data ) {
                channelsData = info.data;
            }
            else if(typeof rawdata === 'string') {

                dbg("Parse payload json: " + rawdata);

                try {
                    channelsData = JSON.parse(rawdata);
                }
                catch(e) {

                    node.error("Cannot parse payload: ");
                    node.error(e);

                    dbg(rawdata);

                    channelsData = null;
                }
            }
            
            if(channelsData && Object.keys(channelsData).length > 0) {

                apis.getServiceObject(node.api, node.soid)
                    .then(function(so) {

                        var api = this;

                        var stream = null;
                        var streamName = node.stream;
                        if(msg.topic) {
                            stream = so.getStream(msg.topic);
                            if(stream) {
                                streamName = msg.topic;
                            }
                        }

                        if(!stream) {
                            stream = so.getStream(streamName);
                        }

                        if(!stream) {
                            return api.lib.Promise.reject(new Error("Stream '"+ streamName +"' not found in " + so.name));
                        }

                        dbg("Push data to " + so.id + "."+ streamName);
                        dbg(JSON.stringify(channelsData));

                        if(channelsData.lastUpdate) {
                            timestamp = new Date(channelsData.lastUpdate);
                            channelsData = channelsData.channels;
                        }

                        return stream.push(channelsData, timestamp);
                    })
                    .then(function(res) {
                        dbg(JSON.stringify(res));
                        dbg("Data sent to " + node.soid);
                    })
                    .catch(function(err) {
                        node.error(err);
                        print(err);
                    });

            }
            else {
                node.warn("Payload data cannot be read, push skipped");
            }

        });

        this.on('close', function() {
            // tidy up any state
            dbg("Closing node");
        });

    };

    RED.nodes.registerType("stream-push",StreamPush);
};