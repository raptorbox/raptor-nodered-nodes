var apis = require("../../lib/apis")
var Promise = require("bluebird")

module.exports = function (RED) {
    function InventoryRead(config) {

        RED.nodes.createNode(this, config)
        var node = this

        node.name = config.name
        node.api = RED.nodes.getNode(config.api) || {}
        node.deviceId = config.deviceId || node.api.deviceId

        this.on("input", function (msg) {
            if(msg && msg.topic) {
                node.deviceId = msg.deviceId || msg.topic
            }
            apis.get(node.api).then(function (api) {
                return api.Inventory().read(node.deviceId).then(function (dev) {
                    node.send({
                        deviceId: dev.id,
                        payload: dev.toJSON()
                    })
                    return Promise.resolve()
                })
            }).catch(function (e) {
                node.error("An error occured loading device: " + e.message)
            })
        })
    }
    RED.nodes.registerType("read-device", InventoryRead)
}
