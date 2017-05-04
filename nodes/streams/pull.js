
var apis = require('../../lib/apis');
var util = require('../../lib/util');
var Promise = require('bluebird');

var dbg = require("debug")("raptor:nodes:stream:pull")

module.exports = function (RED) {

    function StreamPull(config) {

        RED.nodes.createNode(this, config);

        var node = this;

        node.name = config.name;
        node.objectId = config.objectId;

        node.stream = config.stream && config.stream.length ? config.stream : null;

        node.fetchType = config.fetchType;
        node.filter = config.filter || '{}';

        node.api = RED.nodes.getNode(config.api);

        if(!node.objectId) {
            node.objectId = node.api.objectId;
        }

        this.on('input', function (msg) {

            dbg("msg " + JSON.stringify(msg));

            var info = util.parsePayload(msg, node);

            dbg("objectId " + node.objectId);
            apis.getServiceObject(node.api, node.objectId)

            .then(function (so) {

                var api = this;

                var stream = null;
                var streamName = node.stream;
                if (msg.topic) {
                    stream = so.stream(msg.topic);
                    if (stream) {
                        streamName = msg.topic;
                    }
                }

                if (!stream) {
                    stream = so.stream(streamName);
                }

                if (!stream) {
                    return Promise.reject(new Error("Stream '" + streamName + "' not found in " + so.name));
                }

                var searchFilter = node.filter;
                if (msg.filter) {
                    searchFilter = msg.filter;
                }

                (function() {

                    if(node.fetchType === '__filter') {
                        if(searchFilter) {
                            if(typeof searchFilter === 'string') {
                                try {
                                    searchFilter = JSON.parse(searchFilter);
                                }
                                catch(e) {

                                    node.error("Cannot parse search filter: " + searchFilter);
                                    return Promise.reject(e);
                                }
                            }
                        }

                        dbg("Searching data in " + so.id + "." + streamName + " with filter " + JSON.stringify(searchFilter));
                        return stream.search(searchFilter);
                    }
                    else {

                        var type = node.fetchType ? node.fetchType : null;
                        dbg("Fetching "+ ( type ? type : "all" ) +" data from " + so.id + "." + streamName);
                        return stream.pull(type);
                    }

                })()

                .then(function (dataset) {

                    dbg("Found " + dataset.size() + " records");

                    if(dataset.size() === 0) {
                        node.log("No data found for " + so.id + "." + streamName +
                            (searchFilter ?
                                " with filter: " +
                                    (typeof searchFilter === 'string' ?
                                        searchFilter : JSON.stringify(searchFilter))
                                : ""));

                        node.send({
                            topic: streamName,
                            lastUpdate: null,
                            payload: null
                        });

                    }
                    else {

                        // iterate results
                        for(var i = 0; i < dataset.size(); i++)  {

                            // current return the data stored at the position of the internal cursor
                            var dataobj = dataset.get(i);
                            var value = dataobj.toJSON();

                            node.send({
                                topic: streamName,
                                timestamp: dataobj.getTimestamp(),
                                payload: value
                            });

                        }
                    }

                    return Promise.resolve();
                });
            })
            .catch(function (err) {
                node.error(err);
            });

        });

        this.on('close', function () {
            // tidy up any state
            dbg("Closing node");
        });

    }
    ;

    RED.nodes.registerType("stream-pull", StreamPull);
};
