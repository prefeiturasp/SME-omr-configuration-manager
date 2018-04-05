'use strict';
const path = require('path');
const fs = require('fs');
const zipFolder = require('zip-folder');

class DataManager {

    /**
     * Set property
     * @param property {String}
     * @param value {*}
     */
    static setProperty(property, value) {
        if (!DataManager.hasOwnProperty('_sharedData')) DataManager._sharedData = {};

        DataManager._sharedData[property] = value;
    }

    /**
     * Get property
     * @param property {String}
     * @return {*}
     */
    static getProperty(property) {
        if (!DataManager.hasOwnProperty('_sharedData')) DataManager._sharedData = {};

        return DataManager._sharedData[property];
    }

    /**
     * Get resource
     * @return {Object}
     */
    static get dataResource() {
        return {

            /**
             * Initialize resource
             * @param filePath {String}
             * @return {Object}
             */
            init: (filePath) => {
                filePath = path.normalize(filePath);
                return {

                    /**
                     * Load file
                     * @return {Promise}
                     */
                    loadFile: () => {
                        return new Promise((resolve, reject) => {
                            fs.readFile(filePath, null, (err, content) => {
                                if (err) reject(err);
                                else resolve(content);
                            })
                        });
                    },

                    /**
                     * Save file
                     * @param content {String}
                     * @return {Promise}
                     */
                    saveFile: (content) => {
                        return new Promise((resolve, reject) => {
                            fs.writeFile(filePath, content, null, (err, content) => {
                                if (err) reject(err);
                                else resolve(content);
                            })
                        });
                    }
                }
            }
        }
    }

    /**
     * Zip origin folder and save compressed file on destination
     * @param origin {String}
     * @param destination {String}
     * @param fileName {String=}
     * @return {Promise}
     * @static
     */
    static zipFolder(origin, destination, fileName) {
        return new Promise((resolve, reject) => {
            fs.stat(destination, (err) => {
                var date = new Date();
                if (err) {
                    reject(err);
                    return;
                }

                fileName = fileName || 'OMR-Configuration_' + date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear() + '_'
                    + date.getHours() + 'h' + date.getMinutes() + 'm' + date.getSeconds() + 's.zip';

                zipFolder(origin, `${destination}/${fileName}`, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve();
                });
            });
        })
    }
}

module.exports = DataManager;