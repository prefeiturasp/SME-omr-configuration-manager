'use strict';
angular.module('appControllers').controller('Backup', ['$scope',

    function ($scope) {
        var origin = Config.Directories.OMR_CONFIG;
        $scope.init = () => {
            $scope.data = {};
            $scope.generalErrors = [];
        };

        $scope.selectFileDir = () => {
            var selected = dialog.showOpenDialog({properties: ['openDirectory']});
            if (Array.isArray(selected)) {
                $scope.data.FILE_BASEPATH = selected[0];
            }
        };

        $scope.save = () => {
            $scope.generalErrors = [];

            if (!$scope.data.FILE_BASEPATH) {
                $scope.generalErrors.push('O campo "Destino" é obrigatório.');
                return;
            }

            bootbox.dialog({
                title: 'Deseja fazer o backup das configurações?',
                message: `<b>Pasta destino: </b>${$scope.data.FILE_BASEPATH}`,
                buttons: {
                    danger: {
                        label: 'Fazer Backup',
                        className: 'btn-primary',
                        callback: function() {
                            DataManager.zipFolder(origin, $scope.data.FILE_BASEPATH)
                                .then(() => {bootbox.alert('Backup realizado com sucesso!')})
                                .catch((err) => { bootbox.alert(`Erro ao realizar backup <br />${err.message}`); })
                        }
                    },
                    main: {
                        label: 'Cancelar',
                        className: 'btn'
                    }
                }
            });
        }
    }
]);