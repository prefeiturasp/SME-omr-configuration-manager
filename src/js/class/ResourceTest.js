'use strict';
const net = require('net');
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const Cron = require('cron-parser');
const MongoDB = require('mongodb');
const MSSQL = require('mssql');
const Client = require('../../lib/omr-base/connector/_BaseClient');

/**
 *
 * @param emitter {EventEmitter}
 * @param event {String}
 * @param data {Object=}
 */
function emit (emitter, event, data) {
    emitter.total -= 1;
    if (event == 'pass') emitter.pass += 1;
    else emitter.fail += 1;
    emitter.emit(event, data);

    if (emitter.total <= 0) emitter.emit('finish', {pass: emitter.pass, fail: emitter.fail});
}

/**
 *
 * @param object {Object}
 * @param object.port {Number}
 * @param emitter {EventEmitter}
 */
function port (object, emitter) {
    emitter.total += 1;

    if (!object.hasOwnProperty('port') || (object.hasOwnProperty('port') && !object.port)) {
        emit(emitter, 'fail', {from: 'port', error: new Error('Missing property "port"')});
        return;
    }

    net.createServer()
    .once('error', (err) => {
        emit(emitter, 'fail', {from: 'port', error: err});
    })
    .once('listening', function() {
        this.once('close', () => {
            emit(emitter, 'pass');
        })
        .close()
    })
    .listen(object.port)
}

/**
 *
 * @param object {Object}
 * @param object.connectionString {String}
 * @param emitter {EventEmitter}
 */
function mongodb (object, emitter) {
    var mongo = MongoDB.MongoClient;
    emitter.total += 1;

    if (!object.hasOwnProperty('connectionString') || (object.hasOwnProperty('connectionString') && !object.connectionString)) {
        emit(emitter, 'fail', {from: 'mongodb', error: Error('Missing property "connectionString"')});
        return;
    }

    mongo.connect(object.connectionString)
    .then((db) => {
        db.command({connectionStatus: 1})
        .then((status) => {
            db.close();
            emit(emitter, 'pass', {from: 'mongodb', data: status});
        })
        .catch((err) => {
            emit(emitter, 'fail', {from: 'mongodb', error: err});
        })
    })
    .catch((err) => {
        emit(emitter, 'fail', {from: 'mongodb', error: err});
    });
}

/**
 *
 * @param object {Object}
 * @param object.server {String}
 * @param object.database {String}
 * @param object.user {String}
 * @param object.password {String}
 * @param object.groupId {String}
 * @param emitter {EventEmitter}
 */
function mssql (object, emitter) {
    var errorCount = 0;
    emitter.total += 1;

    if (!object.hasOwnProperty('server') || (object.hasOwnProperty('server') && !object.server)) {
        emit(emitter, 'fail', {from: 'mssql', error: Error('Missing property "server"')});
        errorCount += 1;
    }
    if (!object.hasOwnProperty('database') || (object.hasOwnProperty('database') && !object.database)) {
        emit(emitter, 'fail', {from: 'mssql', error: Error('Missing property "database"')});
        errorCount += 1;
    }
    if (!object.hasOwnProperty('user') || (object.hasOwnProperty('user') && !object.user)) {
        emit(emitter, 'fail', {from: 'mssql', error: Error('Missing property "user"')});
        errorCount += 1;
    }
    if (!object.hasOwnProperty('password') || (object.hasOwnProperty('password') && !object.password)) {
        emit(emitter, 'fail', {from: 'mssql', error: Error('Missing property "password"')});
        errorCount += 1;
    }

    if (errorCount) return;

    MSSQL.connect(object)
    .then((db) => {
        var sql = `SELECT TOP 1` +
            `   gru_nome ` +
            `FROM SYS_Grupo WITH(NOLOCK) ` +
            `WHERE ` +
            `   gru_id = '${object.groupId}' AND ` +
            `   sis_id = 217`;
        new MSSQL.Request().query(sql)
        .then((rs) => {
            if (!rs.length)  {
                emit(emitter, 'fail', {from: 'mssql', error: new Error('Group not found!')});
                return;
            }

            db.close();
            emit(emitter, 'pass', {from: 'mssql'});
        })
        .catch((err) => {
            emit(emitter, 'fail', {from: 'mssql', error: err});
        });
    })
    .catch((err) => {
        emit(emitter, 'fail', {from: 'mssql', error: err});
    });
}

/**
 *
 * @param object {Object}
 * @param object.path {String}
 * @param emitter {EventEmitter}
 */
function fileSystem (object, emitter) {
    var file;
    emitter.total += 1;

    if (!object.hasOwnProperty('path') || (object.hasOwnProperty('path') && !object.path)) {
        emit(emitter, 'fail', {from: 'fileSystem', error: Error('Missing property "path"')});
        return;
    }

    file = `${path.normalize(object.path)}/${Date.now()}`;

    fs.writeFile(file, 'test', null, (err) => {
        if (err) {
            emit(emitter, 'fail', {from: 'fileSystem', error: err});
            return;
        }

        fs.unlink(file, (err) => {
            if (err) {
                emit(emitter, 'fail', {from: 'fileSystem', error: err});
                return;
            }

            emit(emitter, 'pass', {from: 'mongodb', data: status});
        })
    })
}

/**
 *
 * @param object {Object}
 * @param object.host {String}
 * @param object.port {Number=}
 * @param object.path {String=}
 * @param object.header {Object=}
 * @param object.method {String=}
 * @param object.body {Object=}
 * @param emitter {EventEmitter}
 */
function request (object, emitter) {
    emitter.total += 1;

    if (!object.hasOwnProperty('host') || (object.hasOwnProperty('host') && !object.host)) {
        emit(emitter, 'fail', {from: 'request', error: Error('Missing property "host"')});
        return;
    }

    dns.resolve4(object.host, (err) => {
        var client;
        var req;
        if (err) {
            emit(emitter, 'fail', {from: 'request', error: err});
            return;
        }

        client = new Client(
            object.host,
            object.port || 80,
            object.path || ''
        );

        if (object.hasOwnProperty('header')) {
            client.SetHeaders(object.header);
        }

        if (!object.hasOwnProperty('method') || (object.hasOwnProperty('method') && object.method.match(/get/))) {
            req = client.Get();
        } else {
            client.METHOD = object.method;
            req = client.Sender(object.body);
        }

        req
        .then(() => {
            emit(emitter, 'pass', {from: 'request'});
        })
        .catch((err) => {
            emit(emitter, 'fail', {from: 'request', error: err});
        });
    });
}

/**
 *
 * @param object {Object}
 * @param emitter {EventEmitter}
 */
function cron (object, emitter) {
    emitter.total += 1;

    try {
        Cron.parseExpression(object.expression);
        emit(emitter, 'pass', {from: 'cron'});
    } catch (err) {
        emit(emitter, 'fail', {from: 'cron', error: err, label: object.label});
    }
}

module.exports.run = (object) => {
    var emitter = new EventEmitter();
    emitter.total = 0;
    emitter.pass = 0;
    emitter.fail = 0;

    process.nextTick(() => {
        if (object.port) port(object.port, emitter);
        if (object.mongodb) mongodb(object.mongodb, emitter);
        if (object.mssql) mssql(object.mssql, emitter);
        if (object.fileSystem) fileSystem(object.fileSystem, emitter);
        if (object.request) request(object.request, emitter);
        if (object.cron && Array.isArray(object.cron)) {
            object.cron.forEach((item) => {
                cron(item, emitter);
            })
        } else if (object.cron) {
            cron(object.cron, emitter);
        }
    });

    return emitter;
};