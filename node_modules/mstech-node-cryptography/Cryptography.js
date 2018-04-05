'use strict';
var Crypto = require('crypto');

class Cryptography {
    /**
     * Get Cryptography Configuration
     * @return {Object}
     * @static
     */
    static get config() {
        return {
            TYPE: process.env.ENCRYPTION_TYPE || 'des-ede3-cbc',
            ENCODING: process.env.ENCRYPTION_ENCODING || 'hex',
            SECRET: process.env.ENCRYPTION_KEY || "VHC4WGJNBPZTQ4WRHPDE5I8GDZ0TXFTAJP3MMMG1"
        }
    }

    /**
     * Encrypt
     * @param value {String}
     * @param type {String=}
     * @param secret {String=}
     * @param encoding {String=}
     * @return {String}
     * @static
     */
    static encrypt (value, type, secret, encoding) {
        type = type || Cryptography.config.TYPE;
        secret = secret || Cryptography.config.SECRET;
        encoding = encoding || Cryptography.config.ENCODING;

        var cipher = Crypto.createCipher(type, secret);
        var encrypted = cipher.update(value, 'utf8', encoding);
        encrypted += cipher.final(encoding);

        return encrypted;
    }

    /**
     * Decrypt
     * @param value {String}
     * @param type {String=}
     * @param secret {String=}
     * @param encoding {String=}
     * @return {String}
     * @static
     */
    static decrypt (value, type, secret, encoding) {
        type = type || Cryptography.config.TYPE;
        secret = secret || Cryptography.config.SECRET;
        encoding = encoding || Cryptography.config.ENCODING;

        var decipher = Crypto.createDecipher(type, secret);
        var decrypted = decipher.update(value, encoding, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}

module.exports = Cryptography;