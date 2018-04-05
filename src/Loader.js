const extend = require('util')._extend;
const fs = require('fs');
const Electron = require('electron');
const Crypto = require('mstech-node-cryptography');
const DataManager = require('../js/class/DataManager');
const Config = require('../js/class/Config');
const ResourceTest = require('../js/class/ResourceTest');
const Remote = Electron.remote;
const {dialog} = Remote;
Config.init(Remote.getGlobal('sharedObject').argv);

window.jQuery = require('../static/vendor/jquery/dist/jquery.min');

document.title = `OMR Configuration Manager ${Remote.getGlobal('sharedObject').mode === 0? '(Administrator)': '' }`;