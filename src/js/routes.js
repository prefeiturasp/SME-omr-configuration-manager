'use strict';
angular.module('confManagerApp').config(['$routeProvider',
    function($routeProvider) {

        $routeProvider.
        when('/', {
            templateUrl: '../js/module/dashboard/dashboard.html',
            controller: 'Dashboard'
        }).
        when('/configuration/', {
            templateUrl: '../js/module/dashboard/configuration.html',
            controller: 'Dashboard'
        }).
        when('/configuration/general', {
            templateUrl: '../js/module/general/general.html',
            controller: 'General'
        }).
        when('/configuration/admin-ui', {
            templateUrl: '../js/module/admin-ui/admin-ui.html',
            controller: 'AdminUI'
        }).
        when('/configuration/api', {
            templateUrl: '../js/module/api/api.html',
            controller: 'API'
        }).
        when('/configuration/file-organizer', {
            templateUrl: '../js/module/file-organizer/file-organizer.html',
            controller: 'FileOrganizer'
        }).
        when('/configuration/pre-processor', {
            templateUrl: '../js/module/pre-processor/pre-processor.html',
            controller: 'PreProcessor'
        }).
        when('/configuration/processor', {
            templateUrl: '../js/module/processor/processor.html',
            controller: 'Processor'
        }).
        when('/configuration/result-sync', {
            templateUrl: '../js/module/result-sync/result-sync.html',
            controller: 'ResultSync'
        }).
        when('/configuration/task-scheduler', {
            templateUrl: '../js/module/task-scheduler/task-scheduler.html',
            controller: 'TaskScheduler'
        }).
        when('/update/', {
            templateUrl: '../js/module/dashboard/update.html',
            controller: 'Dashboard'
        }).
        when('/util/', {
            templateUrl: '../js/module/dashboard/util.html',
            controller: 'Dashboard'
        }).
        when('/util/cryptography', {
            templateUrl: '../js/module/cryptography/cryptography.html',
            controller: 'Cryptography'
        }).
        when('/util/service', {
            templateUrl: '../js/module/service/service.html',
            controller: 'Service'
        }).
        when('/util/backup', {
            templateUrl: '../js/module/backup/backup.html',
            controller: 'Backup'
        }).
        otherwise({
            redirectTo: '/'
        });
    }
]);