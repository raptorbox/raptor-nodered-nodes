var apis = require("../../lib/apis")
var dbg = require("debug")("raptor:nodes:action")

module.exports = function (RED) {
    function ActionInvoke(config) {

        config = config || {}
        RED.nodes.createNode(this, config)

        var node = this

        node.name = config.name
        node.api = RED.nodes.getNode(config.api) || {}
        node.deviceId = config.deviceId || node.api.deviceId

        this.on("input", function (msg) {

            dbg("msg " + JSON.stringify(msg))

            return apis.get(node.api).then(function (api) {

                var actionName = node.name

                if (node.topic) {
                    var pcs = node.topic.split(".")
                    if (pcs.length > 1) {
                        node.deviceId = pcs[0]
                        actionName = pcs[1]
                    } else {
                        actionName = pcs[0]
                    }
                }

                if (!node.deviceId) {
                    return Promise.reject(new Error("Missing device ID"))
                }

                return apis.getDevice(node.api, node.deviceId).then(function (dev) {

                    var action = dev.getAction(actionName)
                    if(!action) {
                        return Promise.reject(new Error("Action '" + actionName + "' not found in " + dev.name))
                    }

                    dbg("Executing " + actionName + ": " + msg.payload.toString())
                    return api.Action().invoke(action, msg.payload).then(function () {
                        dbg("Action invoked")
                    })
                })
            }).catch(function (err) {
                node.error(err)
                dbg(err)
            })

        })
    }

    RED.nodes.registerType("invoke-action", ActionInvoke)
}
