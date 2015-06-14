"use strict";

angular.module('GaugeMeter', []).factory('GaugeMeter', function() {
    return function () { return window.GaugeMeter; } 
});