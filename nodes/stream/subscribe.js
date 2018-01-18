var apis = require("../../lib/apis")
var util = require("../../lib/util")

var Promise = require("bluebird")

var dbg = require("debug")("raptor:nodes:stream:subscribe")

module.exports = function (RED) {

    // track subscriptions and unsubscribe on exit
    var unsubscriptions = []

    function StreamSubscribe(config) {
        config = config || {}
        RED.nodes.createNode(this, config)

        var node = this

        node.api = node.api || {}
        node.name = config.name
        node.deviceId = config.deviceId || node.api.deviceId
        node.stream = config.stream ? config.stream : null

        node.api = RED.nodes.getNode(config.api) || {}

        if(!node.deviceId) {
            node.error("deviceId must be specified")
            return
        }

        if(!node.stream) {
            node.error("stream name must be specified")
            return
        }

        apis.getDevice(node.api, node.deviceId).then(function (so) {
            return apis.get(node.api).then((api) =>  {

                var streamName = node.stream
                var stream = so.getStream(streamName)

                if(!stream) {
                    return Promise.reject(new Error("Stream '" + streamName + "' not found in " + so.name))
                }

                dbg("Subscribing to " + streamName)

                var fn = function (data) {
                    node.send({
                        payload: data
                    })
                }

                unsubscriptions.push(function() {
                    return stream.unsubscribe(fn)
                })

                return api.Stream().subscribe(stream, fn)
            })
        })
            .catch(function (err) {
                node.error(err)
            })

        this.on("close", function () {

            // tidy up any state
            dbg("Closing node")

            Promise.join(unsubscriptions.map(function(fn) {
                return fn()
            }))
                .then(function() {
                    dbg("All unsubscribed")
                })

        })

    }

    RED.nodes.registerType("subscribe-data", StreamSubscribe)
}
