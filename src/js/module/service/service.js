'use strict';
angular.module('appControllers').controller('Service', ['$scope',

    function ($scope) {
        const Agenda = require('agenda');
        const ServiceManager = require('../js/class/ServiceManager');
        var resource = DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\scheduler.json`);
        var agenda;
        var services = ServiceManager.getInstance();

        $scope.init = () => {
            $scope.data = {};

            $scope.services = [];

            resource.loadFile()
                .then((content) => {
                    $scope.config = JSON.parse(content);
                    $scope.data = extend({}, $scope.config);

                    if (!Boolean($scope.config['ENCRYPTION_DISABLED']) && $scope.config.DB_MONGODB) {
                        $scope.data.DB_MONGODB = Crypto.decrypt($scope.config.DB_MONGODB);
                    } else {
                        $scope.data.DB_MONGODB = $scope.config['DB_MONGODB'] || '';
                    }

                    agenda = new Agenda({
                        db: {
                            address: $scope.data.DB_MONGODB,
                            collection: 'Scheduler'
                        }
                    });

                    agenda.on('ready', () => {
                        agenda.jobs({}, (err, jobs) => {
                            if (err) bootbox.alert(`Erro ao carregar tarefas agendadas: <br />${err.message}`);
                            else {
                                $scope.jobs = jobs;
                                $scope.jobs.forEach((job) => {
                                    if (job.attrs.lastRunAt != null) {
                                        job.attrs.lastRunAtText = new Date(job.attrs.lastRunAt);
                                        job.attrs.lastRunAtText = job.attrs.lastRunAtText.getDate() + '/' + (job.attrs.lastRunAtText.getMonth()+1) + '/' + job.attrs.lastRunAtText.getFullYear() + ' '
                                            + job.attrs.lastRunAtText.getHours() + ':' + job.attrs.lastRunAtText.getMinutes() + ':' + job.attrs.lastRunAtText.getSeconds();
                                    } else {
                                        job.attrs.lastRunAtText = '-';
                                    }

                                    if (job.attrs.nextRunAt != null) {
                                        job.attrs.nextRunAtText = new Date(job.attrs.nextRunAt);
                                        job.attrs.nextRunAtText = job.attrs.nextRunAtText.getDate() + '/' + (job.attrs.nextRunAtText.getMonth()+1) + '/' + job.attrs.nextRunAtText.getFullYear() + ' '
                                            + job.attrs.nextRunAtText.getHours() + ':' + job.attrs.nextRunAtText.getMinutes() + ':' + job.attrs.nextRunAtText.getSeconds();
                                    } else {
                                        job.attrs.nextRunAtText = '-';
                                    }

                                    if (job.attrs.lockedAt != null) {
                                        job.attrs.lockedAtText = new Date(job.attrs.lockedAt);
                                        job.attrs.lockedAtText = job.attrs.lockedAtText.getDate() + '/' + (job.attrs.lockedAtText.getMonth()+1) + '/' + job.attrs.lockedAtText.getFullYear() + ' '
                                            + job.attrs.lockedAtText.getHours() + ':' + job.attrs.lockedAtText.getMinutes() + ':' + job.attrs.lockedAtText.getSeconds();
                                    } else {
                                        job.attrs.lockedAtText = '-';
                                    }

                                    if (job.attrs.repeatInterval == null) job.attrs.repeatInterval = 0;
                                    if (job.attrs.nextRunAt == null && job.attrs.repeatInterval) job.attrs.nextRunAt = 0;
                                    if (job.attrs.lastRunAt == null) job.attrs.lastRunAt = 0;
                                    if (job.attrs.lastFinishedAt == null) job.attrs.lastFinishedAt = 0;
                                    if (job.attrs.failedAt == null) job.attrs.failedAt = 0;
                                    if (job.attrs.lockedAt == null) job.attrs.lockedAt = 0;

                                    job.status = {};

                                    if (job.attrs.nextRunAt&& job.attrs.nextRunAt >= new Date()) job.status.scheduled = true;
                                    if (job.attrs.nextRunAt && job.attrs.lastFinishedAt && new Date() >= job.attrs.nextRunAt && job.attrs.nextRunAt >= job.attrs.lastFinishedAt) job.status.queued = true;
                                    if (job.attrs.lockedAt && job.attrs.lastRunAt && job.attrs.lastRunAt > job.attrs.lastFinishedAt) job.status.running = true;
                                    if (job.attrs.lastFinishedAt && job.attrs.lastFinishedAt > job.attrs.failedAt) job.status.completed = true;
                                    if (job.attrs.lastFinishedAt && job.attrs.failedAt && job.attrs.lastFinishedAt.getTime() == job.attrs.failedAt.getTime()) job.status.failed = true;
                                });
                            }

                            $scope.safeApply();
                        });
                    });

                    services.on('data', $scope.bindService);
                    services.on('success', $scope.restartCallback);
                    services.on('error', $scope.restartCallback);

                    services.status('OMR_ADMIN');
                    services.status('OMR_API');
                    services.status('OMR_SCHEDULER');
                })
                .catch((err) => {
                    console.error(err);
                    bootbox.alert('Erro ao carregar arquivo de configurações.');
                });
        };

        $scope.bindService = (data) => {
            $scope.services.push(data);
            $scope.safeApply();
        };

        $scope.serviceRestart = (index) => {

            services.restart($scope.services[index].name, index);
        };

        $scope.restartCallback = (data) => {
            if (data.hasOwnProperty('error')) {
                bootbox.alert(`Erro ao restartar servico: <br />${data.error.message}`);
            }

            $scope.services[data.index] = data;
            $scope.safeApply();
        }
    }
]);