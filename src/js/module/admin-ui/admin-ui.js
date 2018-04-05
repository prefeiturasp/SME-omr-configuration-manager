'use strict';
angular.module('appControllers').controller('AdminUI', ['$scope',

    function ($scope) {
        var resource = DataManager.dataResource.init(`${Config.Directories.OMR_CONFIG}\\admin.json`);
        $scope.init = () => {
            $scope.generalConfig = Config.GeneralConfig;
            $scope.generalErrors = [];
            $scope.dbErrors = [];
            $scope.authErrors = [];
            $scope.data = {};

            resource.loadFile()
                .then((content) => {
                    $scope.config = JSON.parse(content);
                    $scope.data = extend({}, $scope.config);

                    $scope.LogLevels = [{val: 'error', description: 'Somente Erros'}, {val: 'warn', description: 'Erros e Alertas'}, {val: 'info', description: 'Tudo'}];
                    $scope._KEEP_LOG_LEVEL = {val: $scope.config['KEEP_LOG_LEVEL'] || $scope.LogLevels[1].val};

                    $scope.DataEncryption = [{val: false, description: 'Habilitada'}, {val: true, description: 'Desabilitada'}];
                    $scope._ENCRYPTION_DISABLED = {val: Boolean($scope.config['ENCRYPTION_DISABLED'])};

                    if (!Boolean($scope.config['ENCRYPTION_DISABLED'])) {
                        if ($scope.config.DB_MONGODB) $scope.data.DB_MONGODB = Crypto.decrypt($scope.config.DB_MONGODB);
                        if ($scope.config.MSSQL_CORE_PASSWORD) $scope.data.MSSQL_CORE_PASSWORD = Crypto.decrypt($scope.config.MSSQL_CORE_PASSWORD);
                    } else {
                        if ($scope.config.DB_MONGODB) $scope.data.DB_MONGODB = $scope.config['DB_MONGODB'] || '';
                        if ($scope.config.MSSQL_CORE_PASSWORD) $scope.data.MSSQL_CORE_PASSWORD = $scope.config['MSSQL_CORE_PASSWORD'] || '';
                    }

                    $scope.safeApply();
                })
                .catch((err) => {
                    console.error(err);
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
            if (data.from === 'port') $scope.generalErrors.push(data.error.message);
            if (data.from === 'fileSystem') $scope.generalErrors.push(data.error.message);
            if (data.from === 'mssql') $scope.authErrors.push(data.error.message);
            if (data.from === 'request') $scope.authErrors.push(data.error.message);

            $scope.safeApply();
        };

        $scope.save = () => {
            var test;
            $scope.testPass = 0;
            $scope.testFail = 0;

            $scope.generalErrors = [];
            $scope.dbErrors = [];
            $scope.authErrors = [];

            $scope.config = extend({}, $scope.data);
            $scope.config.ENCRYPTION_DISABLED = $scope._ENCRYPTION_DISABLED.val;
            $scope.config.KEEP_LOG_LEVEL = $scope._KEEP_LOG_LEVEL.val;

            if (!$scope.config.ENCRYPTION_DISABLED && $scope.data.DB_MONGODB && $scope.data.MSSQL_CORE_PASSWORD) {
                if ($scope.data.DB_MONGODB) $scope.config.DB_MONGODB = Crypto.encrypt($scope.data.DB_MONGODB);
                if ($scope.data.MSSQL_CORE_PASSWORD) $scope.config.MSSQL_CORE_PASSWORD = Crypto.encrypt($scope.data.MSSQL_CORE_PASSWORD);
            }

            test = ResourceTest.run({
                port: {port: $scope.data.APP_PORT},
                mongodb: {connectionString: $scope.data.DB_MONGODB},
                fileSystem: {path: $scope.data.FILE_BASEPATH},
                mssql: {
                    server: $scope.data.MSSQL_SERVER,
                    database: $scope.data.MSSQL_CORE_DATABASE,
                    user: $scope.data.MSSQL_CORE_USERNAME,
                    password: $scope.data.MSSQL_CORE_PASSWORD,
                    groupId: $scope.data.CORESSO_ADMIN_GROUP_ID
                },
                request: {
                    host: $scope.data.SAML_IDP_DOMAIN
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
                var message = 'Esta operação irá sobrescrever a configuração atual da aplicação <br/>';

                if (data.fail == 1) {
                    message += `Foi encontrado <b>${data.fail} erro</b>.<br />`;
                } else if (data.fail > 0) {
                    message += `Foram encontrados <b>${data.fail} erros</b>.<br />`;
                }

                message += 'Deseja continuar assim mesmo?';

                bootbox.dialog({
                    title: 'Deseja salvar a configuração da <b>Área Administrativa</b>?',
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