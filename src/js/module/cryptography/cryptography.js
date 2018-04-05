'use strict';
angular.module('appControllers').controller('Cryptography', ['$scope',
    function ($scope) {
        $scope.original = '';
        $scope.encrypted = '';

        $scope.encrypt = () => {
            $scope.encrypted = Crypto.encrypt($scope.original);
        };

        $scope.decrypt = () => {
            $scope.original = Crypto.decrypt($scope.encrypted);
        };
    }
]);