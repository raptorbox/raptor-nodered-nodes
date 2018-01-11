var apis = require("../../lib/apis")
var util = require("../../lib/util")

var Promise = require("bluebird")
var dbg = require("debug")("raptor:nodes:action")

module.exports = function (RED) {

    function ActionInvoke(config) {

        RED.nodes.createNode(this, config)

        var node = this

        node.name = config.name
        node.api = RED.nodes.getNode(config.api)

        node.objectId = config.objectId
        if(!node.objectId) {
            node.objectId = node.api.objectId
        }

        this.on("input", function (msg) {

            dbg("msg " + JSON.stringify(msg))

            apis.getDevice(node.api, node.objectId)
                .then(function (dev) {

                    var api = this

                    var actionName = node.name
                    var action = dev.getAction(actionName)

                    if(!action) {
                        return api.lib.Promise.reject(new Error("Action '" + actionName + "' not found in " + dev.name))
                    }

                    dbg("Executing " + actionName + ": " + msg.payload.toString())
                    return action.invoke(msg.payload).then(function () {
                        dbg("Action invoked")
                    })

                })
                .catch(function (err) {
                    node.error(err)
                    dbg(err)
                })

        })

        // this.on("close", function () {
        //     dbg("Closing node")
        // })

    }

    RED.nodes.registerType("invoke-action", ActionInvoke)
}
