'use strict';
angular.module('appControllers').controller('TaskScheduler', ['$scope',

    function ($scope) {
        var resource = DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\scheduler.json`)
        $scope.init = () => {
            $scope.generalConfig = Config.GeneralConfig;
            $scope.generalErrors = [];
            $scope.dbErrors = [];
            $scope.connectorErrors = [];
            $scope.data = {};

            resource.loadFile()
                .then((content) => {
                    $scope.config = JSON.parse(content);
                    $scope.data = extend({}, $scope.config);

                    $scope.LogLevels = [{val: 'error', description: 'Somente Erros'}, {val: 'warn', description: 'Erros e Alertas'}, {val: 'info', description: 'Tudo'}];
                    $scope._KEEP_LOG_LEVEL = {val: $scope.config['KEEP_LOG_LEVEL'] || $scope.LogLevels[1].val};

                    $scope.DataEncryption = [{val: false, description: 'Habilitada'}, {val: true, description: 'Desabilitada'}];
                    $scope._ENCRYPTION_DISABLED = {val: Boolean($scope.config['ENCRYPTION_DISABLED'])};

                    if (!Boolean($scope.config['ENCRYPTION_DISABLED']) && $scope.config.DB_MONGODB) {
                        $scope.data.DB_MONGODB = Crypto.decrypt($scope.config.DB_MONGODB);
                    } else {
                        $scope.data.DB_MONGODB = $scope.config['DB_MONGODB'] || '';
                    }

                    $scope.safeApply();
                })
                .catch((err) => {
                    console.error(err);
                    bootbox.alert('Erro ao carregar arquivo de configurações.');
                });
        };

        $scope.dataValidation = (data) => {
            if (data.from === 'mongodb') $scope.dbErrors.push(data.error.message);
            if (data.from === 'cron') $scope.connectorErrors.push({label: data.label, message: data.error.message});

            $scope.safeApply();
        };

        $scope.save = () => {
            var test;
            $scope.testPass = 0;
            $scope.testFail = 0;

            $scope.generalErrors = [];
            $scope.dbErrors = [];
            $scope.connectorErrors = [];

            $scope.config = extend({}, $scope.data);
            $scope.config.ENCRYPTION_DISABLED = $scope._ENCRYPTION_DISABLED.val;

            if (!$scope.config.ENCRYPTION_DISABLED && $scope.data.DB_MONGODB) {
                $scope.config.DB_MONGODB = Crypto.encrypt($scope.data.DB_MONGODB);
            }

            test = ResourceTest.run({
                mongodb: {connectionString: $scope.data.DB_MONGODB, label: 'String de Conexão'},
                cron: [
                    {expression: $scope.data.JOB_FILE_ORGANIZER_TIME, label: 'Organizador de Arquivos'},
                    {expression: $scope.data.JOB_PRE_PROCESSOR_TIME, label: 'Pré Processador'},
                    {expression: $scope.data.JOB_PROCESSOR_TIME, label: 'Processador'},
                    {expression: $scope.data.JOB_RESULT_SYNC_TIME, label: 'Sincronizador de Resultados'},
                ]
            });

            test.on('pass', () => {
                $scope.testPass += 1;
                $scope.safeApply();
            });

            test.on('fail', (data) => {
                $scope.testFail += 1;
                $scope.dataValidation(data);
            });

            test.once('finish', (data) => {
                var message = 'Esta operação irá sobrescrever a configuração atual da aplicação <br/>';

                if (data.fail == 1) {
                    message += `Foi encontrado <b>${data.fail} erro</b>.<br />`;
                } else if (data.fail > 0) {
                    message += `Foram encontrados <b>${data.fail} erros</b>.<br />`;
                }

                message += 'Deseja continuar assim mesmo?';

                bootbox.dialog({
                    title: 'Deseja salvar a configuração do <b>Agendador de Tarefas</b>?',
                    message: message,
                    buttons: {
                        danger: {
                            label: 'Salvar',
                            className: data.fail > 0? 'btn-danger': 'btn-primary',
                            callback: function() {
                                resource.saveFile(JSON.stringify($scope.config))
                                    .then(() => {bootbox.alert('Configuração salva com sucesso!')})
                                    .catch((err) => {bootbox.alert(`Erro ao salvar configuração: <br />${err.message}`)})
                            }
                        },
                        main: {
                            label: 'Cancelar',
                            className: 'btn'
                        }
                    }
                });
            })
        }
    }
]);