var apis = require("../../lib/apis")
var util = require("../../lib/util")
var Promise = require("bluebird")

var dbg = require("debug")("raptor:nodes:stream:push")

module.exports = function (RED) {

    function StreamPush(config) {

        RED.nodes.createNode(this, config)

        var node = this

        node.name = config.name
        node.deviceId = config.deviceId || node.api.deviceId
        node.stream = config.stream && config.stream.length ? config.stream : null
        node.api = RED.nodes.getNode(config.api)

        if(!node.api) {
            node.error("Missing node configurations")
            return
        }

        this.on("input", function (msg) {

            var info = util.parsePayload(msg, node)

            var channelsData

            node.deviceId = msg.deviceId || node.deviceId

            var pcs = msg.topic.split(".")
            if (pcs.length > 1) {
                node.deviceId = pcs[0]
                node.stream = pcs[1]
            }

            if (!node.deviceId) {
                node.error(new Error("Device ID not found"))
                return
            }

            // will be used as value for lastUpdate if not specified
            var timestamp = new Date()
            var rawdata = msg.payload

            dbg("msg " + JSON.stringify(msg))

            if(info.data) {
                channelsData = info.data
            } else if(typeof rawdata === "string") {

                dbg("Parse payload json: " + rawdata)

                try {
                    channelsData = JSON.parse(rawdata)
                } catch(e) {

                    node.error("Cannot parse payload: ")
                    node.error(e)

                    dbg(rawdata)

                    channelsData = null
                }
            }

            if(channelsData && Object.keys(channelsData).length > 0) {
                apis.get(node.api).then(function(api) {
                    return apis.getDevice(node.api, node.deviceId).then(function (dev) {
                        
                        var streamName = node.stream
                        var stream = null
                        if(msg.topic) {
                            stream = dev.getStream(msg.topic)
                            if(stream) {
                                streamName = msg.topic
                            }
                        }

                        if(!stream) {
                            stream = dev.getStream(streamName)
                        }

                        if(!stream) {
                            return Promise.reject(new Error("Stream '" + streamName + "' not found in " + dev.name))
                        }

                        dbg("Push data to " + dev.id + "." + streamName)
                        dbg(JSON.stringify(channelsData))

                        timestamp = (channelsData.timestamp && channelsData.channels) ? channelsData.timestamp : timestamp
                        var data = channelsData.channels ? channelsData.channels : channelsData

                        var Record = require("raptor-sdk").models.Record
                        var r = new Record({ channels: data, timestamp }, stream)

                        return api.Stream().push(r)
                    }).then(function (res) {
                        dbg("Data sent to " + node.deviceId)
                        dbg(JSON.stringify(res))
                    }).catch(function (err) {
                        node.error(err)
                    })
                })

            } else {
                node.warn("Payload data cannot be read, push skipped")
            }

        })

        this.on("close", function () {
            // tidy up any state
            dbg("Closing node")
        })

    }

    RED.nodes.registerType("send-data", StreamPush)
}
