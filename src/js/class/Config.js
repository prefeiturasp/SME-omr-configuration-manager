"use strict";
var ConfigBase = require('../..//lib/omr-base/config/Config');

class Config extends ConfigBase {

    /**
     * Get directories
     * @return {Object} Directories
     * @static
     */
    static get Directories() {
        return {
            OMR_CONFIG: Config.resource.OMR_CONFIG_DIR || ''
        }
    }

    /**
     * Get NSSM binary path
     * @return {String} Path
     * @static
     */
    static get NSSM() {
        return Config.resource.NSSM_BIN_PATH || ''
    }

    /**
     * Get general config flag
     * @return {Boolean}
     * @static
     */
    static get GeneralConfig() {
        return Config.resource.GENERAL_CONFIG_ENABLED || true;
    }
}

module.exports = Config;