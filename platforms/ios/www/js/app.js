/*!
 * Copyright 2014 Giuseppe Zileni
 * http://giuseppezileni.github.io
 *
 * Ionic, v1.0.0
 * http://ionicframework.com/
 *
 * By @gzileni
 *
 * Licensed under the MIT license. Please see LICENSE for more information.
 *
 */

//////////////////////////////////////////////
// 
// airQ App - START
//
//

angular.module('airq', ['ionic', 'ngCordova', 'ionic.service.core', 'ionic.service.push', 'airq.controllers', 'airq.services', 'airq.filters', 'airq.mapcontrollers', 'airq.servicesimportio', 'airq.servicesairquality', 'airq.servicesstations', 'airq.servicesgeojson', 'airq.db', 'airq.levels', 'airq.polluting', 'airq.geolocation', 'ionic.utils', 'underscore', 'turf', 'angular-momentjs', 'leaflet-directive', 'GaugeMeter', 'frapontillo.gage', 'async', 'S', 'pouchdb'])

.run(function ($ionicPlatform, Geolocation, $localstorage, $cordovaPush, $ionicUser, $ionicPush, $cordovaBackgroundGeolocation) {

  $ionicPlatform.ready(function () {

    //////////////////////////////////////////////
    // 
    // Background Geolocation
    //
    //

    /*
    var options = {
      // https://github.com/christocracy/cordova-plugin-background-geolocation#config
      desiredAccuracy: 100,
      stationaryRadius: 100,
      stopOnTerminate: true
    };

    $cordovaBackgroundGeolocation.configure(options).then(null, Geolocation.error, Geolocation.save);
    */

    Geolocation.watch();

    //////////////////////////////////////////////
    // 
    // Push notification
    //
    //

    $ionicUser.identify({
      user_id: '0',
      name: 'Test User',
      message: 'I come from planet Ion'
    });

    $ionicPush.register({
      canShowAlert: false, //Should new pushes show an alert on your screen?
      canSetBadge: true, //Should new pushes be allowed to update app icon badges?
      canPlaySound: false, //Should notifications be allowed to play a sound?
      canRunActionsOnWake: true, // Whether to run auto actions outside the app,
      onNotification: function(notification) {
        // Called for each notification.
      }
    });

    $rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
      console.log('Got token', data.token, data.platform);
      // Do something with the token
    });

    //////////////////////////////////////////////
    //
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    };

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    };

  });
})

.constant('MAPQUEST', {
  url: 'http://open.mapquestapi.com/geocoding/v1/',
  key: 'Fmjtd%7Cluu82q62n1%2C25%3Do5-94zw06'
})

.constant('UTILITY', {
  test: false,
  timeout: 60000,
  distance: 1000,
  heatmap: false,
  force_reload: false,
  level: 2
})

.constant('SHARE', {
  www: 'http://opendatabari.github.io/CO2/',
  github: 'https://github.com/opendatabari/CO2/tree/master/www/'
})

// nodeJS Server Proxy (-- deprecated --)
.constant('AIRQ', {
  url: {
    prod: 'http://openpuglia-prod.apigee.net/airq-a127/',
    dev: 'http://127.0.0.1:10010/'
  }
})

.constant('DB', {
  name: 'airq'  // nome del database
})

// dati di importIO 
.constant('IMPORT', {
  config: {
    "auth": 
    {
      "userGuid": "df450de0-1945-4212-9284-e84133bf5c7e",
      "apiKey": "df450de0-1945-4212-9284-e84133bf5c7e:kM1OcWAonh0Mtf3v+f4qaoqts+1MogWSGqAtO+EjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T/twDkq9g=="
    },
    "host": "import.io"
  },
  query: [
  {
    "connectorGuids": [
      "8c04e12b-064f-4f45-a2aa-16353f201b85"
    ],
    "input": {
      "webpage/url": "http://www.arpa.puglia.it/web/guest/qariainq"
    }
  },
  {
    "connectorGuids": [
        "9f6ff387-09f1-4707-9420-2408a6385afc"
    ],
    "input": {
        "webpage/url": "http://www.arpa.puglia.it/web/guest/qariainq"
    }
  }],
  curls: [
  {
    url: 'https://api.import.io/store/connector/8c04e12b-064f-4f45-a2aa-16353f201b85/_query?_user=df450de0-1945-4212-9284-e84133bf5c7e&_apikey=df450de0-1945-4212-9284-e84133bf5c7e%3AkM1OcWAonh0Mtf3v%2Bf4qaoqts%2B1MogWSGqAtO%2BEjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T%2FtwDkq9g%3D%3D',
    method: 'POST',
    data: {"input":{"webpage/url":"http://www.arpa.puglia.it/web/guest/qariainq"}},
    headers: {'Content-Type': 'application/json'}
  },
  {
    url: 'https://api.import.io/store/connector/9f6ff387-09f1-4707-9420-2408a6385afc/_query?_user=df450de0-1945-4212-9284-e84133bf5c7e&_apikey=df450de0-1945-4212-9284-e84133bf5c7e%3AkM1OcWAonh0Mtf3v%2Bf4qaoqts%2B1MogWSGqAtO%2BEjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T%2FtwDkq9g%3D%3D',
    method: 'POST',
    data: {"input":{"webpage/url":"http://www.arpa.puglia.it/web/guest/qariainq"}},
    headers: {'Content-Type': 'application/json'}
  }]
})

.config(function($momentProvider){
  $momentProvider
    .asyncLoading(false)
    .scriptUrl('lib/moment/moment.js');
})

.config(['$ionicAppProvider', function($ionicAppProvider) {
  // Identify app
  $ionicAppProvider.identify({
    // The App ID (from apps.ionic.io) for the server
    app_id: '0a6e7be9',
    // The public API key all services will use for this app
    api_key: 'd93aa4cb7b0f4a8d3aa9f0a1970dc29c1764f9598f01195d',
    // The GCM project ID (project number) from your Google Developer Console (un-comment if used)
    gcm_id: '812864579370'
  });
}])

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  $ionicConfigProvider.tabs.position('bottom');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  // Each tab has its own nav history stack:

  .state('tab.airq', {
    url: '/airq',
    views: {
      'tab-airq': {
        templateUrl: 'templates/tab-airq.html',
        controller: 'AirQCtrl'
      }
    }
  })

  .state('tab.airq-list', {
    url: '/airq-list',
    views: {
      'tab-airq-list': {
        templateUrl: 'templates/tab-airq-list.html',
        controller: 'AirQCtrlList'
      }
    }
  })

  .state('tab.weather', {
      url: '/weather',
      views: {
        'tab-weather': {
          templateUrl: 'templates/tab-weather.html',
          controller: 'WeatherCtrl'
        }
      }
  })

  .state('tab.city', {
    url: '/airq/:city',
    views: {
      'tab-airq-list': {
        templateUrl: 'templates/tab-airq-detail.html',
        controller: 'MapCtrl'
      }
    }
  })

  .state('tab.detail', {
    url: '/airq/:poll',
    views: {
      'tab-airq-list': {
        templateUrl: 'templates/tab-airq-detail.html',
        controller: 'MapCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/airq');

});
