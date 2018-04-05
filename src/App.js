'use strict';
var {app, BrowserWindow} = require('electron');
var exec = require('child_process').exec;
var mainWindow = null;

app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', function () {
    exec('NET SESSION', function(err,so,se) {
        global.sharedObject = {
            argv: process.argv,
            mode: se.length
        };

        mainWindow = new BrowserWindow({width: 980, height: 700});
        mainWindow.loadURL('file://' + __dirname + '/view/index.html');

        mainWindow.on('closed', function () {
            mainWindow = null;
        });
    });
});