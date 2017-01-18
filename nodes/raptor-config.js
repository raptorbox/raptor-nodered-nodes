module.exports = function (RED) {

    var RaptorConfig = function(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.url = n.url;
        this.username = n.username;
        this.password = n.password;
        this.apiKey = n.apiKey;
        this.soid = n.soid;
    };

    RED.nodes.registerType("raptor-config", RaptorConfig);
};
