var encryptLib = require("cryptlib");
var constants = {
    encryptionKey: encryptLib.getHashSha256("xza548sa3vcr641b5ng5nhy9mlo64r6k", 32),
    encryptionIV: "5ng5nhy9mlo64r6k"
}

module.exports = constants;