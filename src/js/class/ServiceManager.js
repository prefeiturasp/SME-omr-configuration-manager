'use strict';
const spawn = require('child_process').spawn;
const EventEmitter = require('events');

/**
 * Run NSSM commands
 * @param cmd {String} NSSM Command
 * @param name {String} Service name
 * @return {Promise}
 */
function command(cmd, name) {
    return new Promise((resolve, reject) => {
        var stdout = "";
        var stderr = "";
        var nssm = spawn(Config.NSSM, [cmd, name]);

        nssm.stdin.once('error', reject);
        nssm.stdout.on('data', (data) => {
            stdout += data;
        });
        nssm.stderr.on('data', (data) => {
            stderr += data;
        });
        nssm.on('close', (code, signal) => {
            if (code !== 0 || signal !== null) {
                let err = new Error(`Command failed: ${stderr || stdout}`);
                err.code = code;
                err.signal = signal;

                reject(err);
            } else {
                stdout = stdout.replace('\r\n', '');
                resolve(stdout);
            }
        });
        nssm.on('error', reject);
    });
}

/**
 * Run status command
 * @param emitter {EventEmitter}
 * @return {Object}
 */
function status (emitter) {
    return {
        exec: (name) => {
            command('status', name)
                .then((data) => {
                    emitter.emit('data', {from: 'status', name: name, status: data});
                })
                .catch((err) => {
                    emitter.emit('data', {from: 'status', name: name, error: err});
                });
        }
    };
}

/**
 * Run restart command
 * @param emitter {EventEmitter}
 * @return {Object}
 */
function restart (emitter) {
    return {
        exec: (name, index) => {
            command('restart', name)
                .then((data) => {
                    emitter.emit('success', {from: 'restart', name: name, status: data, index: index});
                })
                .catch((err) => {
                    emitter.emit('error', {from: 'restart', name: name, error: err, index: index});
                });
        }
    };
}

/**
 * Get manager instance
 * @return {EventEmitter}
 */
module.exports.getInstance = () => {
    var emitter = new EventEmitter();

    emitter.status = status(emitter).exec;
    emitter.restart = restart(emitter).exec;

    return emitter;
};