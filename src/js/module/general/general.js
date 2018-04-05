'use strict';
angular.module('appControllers').controller('General', ['$scope',

    function ($scope) {
        var resource = [
            DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\api.json`),
            DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\admin.json`),
            DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\scheduler.json`),
            DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\fileorganizer.json`),
            DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\preprocessor.json`),
            DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\processor.json`),
            DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\resultsync.json`)
        ];
        var confData = [];

        $scope.init = () => {
            $scope.generalErrors = [];
            $scope.dbErrors = [];
            $scope.connectorErrors = [];
            $scope.data = {};

            Promise.all(resource.map((res) => res.loadFile()))
                .then((data) => {
                    confData = data.map((content) => JSON.parse(content));

                    $scope.config = confData[4];
                    $scope.data = extend({}, confData[4]);

                    $scope.DataEncryption = [{val: false, description: 'Habilitada'}, {val: true, description: 'Desabilitada'}];
                    $scope._ENCRYPTION_DISABLED = {val: Boolean($scope.data['ENCRYPTION_DISABLED'])};

                    if (!Boolean($scope.data['ENCRYPTION_DISABLED']) && $scope.data.DB_MONGODB) {
                        $scope.data.DB_MONGODB = Crypto.decrypt($scope.data.DB_MONGODB);
                    } else {
                        $scope.data.DB_MONGODB = $scope.data['DB_MONGODB'] || '';
                    }

                    $scope.safeApply();
                })
                .catch((error) => {
                    console.error(error);
                    bootbox.alert('Erro ao carregar arquivo de configurações.');
                });
        };

        $scope.selectFileDir = () => {
            var selected = dialog.showOpenDialog({properties: ['openDirectory']});
            if (Array.isArray(selected)) {
                $scope.data.FILE_BASEPATH = selected[0];
            }
        };

        $scope.dataValidation = (data) => {
            if (data.from === 'mongodb') $scope.dbErrors.push(data.error.message);
            if (data.from === 'fileSystem') $scope.generalErrors.push(data.error.message);
            if (data.from === 'request') $scope.connectorErrors.push(data.error.message);

            $scope.safeApply();
        };

        $scope.save = () => {
            var test;
            $scope.testPass = 0;
            $scope.testFail = 0;

            $scope.generalErrors = [];
            $scope.dbErrors = [];
            $scope.connectorErrors = [];

            test = ResourceTest.run({
                mongodb: {connectionString: $scope.data.DB_MONGODB},
                fileSystem: {path: $scope.data.FILE_BASEPATH},
                request: {
                    host: $scope.data.CONNECTOR_SIA_HOST,
                    path: '/api/user/signin',
                    method: 'POST',
                    header: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        login: $scope.data.CONNECTOR_SIA_USERNAME,
                        password: $scope.data.CONNECTOR_SIA_PASSWORD
                    }
                }
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
                var message = 'Esta operação irá sobrescrever as configurações das seguintes aplicações: <br/>';
                message += '<ul class="application-list">';
                message += '<li>Área Administrativa</li>';
                message += '<li>API</li>';
                message += '<li>Agendador de Tarefas</li>';
                message += '<li>Organizador de Arquivos</li>';
                message += '<li>Pré Processador</li>';
                message += '<li>Processador</li>';
                message += '<li>Sincronizador de Resultados</li>';
                message += '</ul>';

                if (data.fail == 1) {
                    message += `Foi encontrado <b>${data.fail} erro</b>.<br />`;
                } else if (data.fail > 0) {
                    message += `Foram encontrados <b>${data.fail} erros</b>.<br />`;
                }

                message += 'Deseja continuar assim mesmo?';

                bootbox.dialog({
                    title: 'Deseja salvar a configuração da <b>API</b>?',
                    message: message,
                    buttons: {
                        danger: {
                            label: 'Salvar',
                            className: data.fail > 0? 'btn-danger': 'btn-primary',
                            callback: function() {
                                confData = updateConfigData();
                                console.log(confData);
                                saveConfig()
                                    .then(() => {bootbox.alert('Configuração salva com sucesso!')})
                                    .catch((err) => {bootbox.alert(`Erro ao salvar configuração: <br />${err.message}`)});
                            }
                        },
                        main: {
                            label: 'Cancelar',
                            className: 'btn'
                        }
                    }
                });
            })
        };

        function updateConfigData() {
            return confData.map((content) => {
                content.ENCRYPTION_DISABLED = $scope._ENCRYPTION_DISABLED.val;

                if (!content.ENCRYPTION_DISABLED && $scope.data.DB_MONGODB) {
                    content.DB_MONGODB = Crypto.encrypt($scope.data.DB_MONGODB);
                } else {
                    content.DB_MONGODB = $scope.data.DB_MONGODB;
                }

                if (content.hasOwnProperty('FILE_BASEPATH')) content.FILE_BASEPATH = $scope.data.FILE_BASEPATH;
                if (content.hasOwnProperty('CONNECTOR_SIA_HOST') && content.hasOwnProperty('CONNECTOR_SIA_USERNAME') && content.hasOwnProperty('CONNECTOR_SIA_PASSWORD')) {
                    content.CONNECTOR_SIA_HOST = $scope.data.CONNECTOR_SIA_HOST;
                    content.CONNECTOR_SIA_USERNAME = $scope.data.CONNECTOR_SIA_USERNAME;
                    content.CONNECTOR_SIA_PASSWORD = $scope.data.CONNECTOR_SIA_PASSWORD;
                }

                return content;
            });
        }

        function saveConfig() {
            return Promise.all(confData.map((content, i) => resource[i].saveFile(JSON.stringify(content))));
        }
    }
]);