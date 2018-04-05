'use strict';
angular.module('confManagerApp', [
    'ngRoute',
    'appControllers'
]);

angular.module('appControllers', []);

angular.module('confManagerApp').run(function($rootScope) {
    $rootScope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };
});