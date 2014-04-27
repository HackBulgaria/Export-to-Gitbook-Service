exports.fromBase64 = function(base64_str) {
    return new Buffer(base64_str, "base64").toString("utf-8")
};

exports.toBase64 = function(str) {
    return new Buffer(str).toString("base64")
};
