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
// airQ App - Controller Main
//
//

angular.module('airq.controllers', [])

/////////////////////////////
// Air Quality Controller
//
.controller('AirQCtrl', function ($scope, Geolocation, $ionicLoading, $localstorage, $timeout, _, UTILITY, $ionicModal, GaugeMeter, Level, Import, GeoJSON, $ionicActionSheet, $cordovaSocialSharing, SHARE, Polluting) {

	// Geolocation.watch();

  var data_airq;
  var item_nearest;
  var city_nearest;
  var location;
  var watch;
  var gauges = [];
  var p_sel;

  showSpinner(true, 'initializing ...');
    
  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.refresh();
  });

  function _callback_message(open, message, counter) {
    showSpinner(open, message);
  };

  //////////////////////////////////
  //
  // Share
  //

  function _share (type) {

    var message = '';
    var image = '';
    var link = '';

    var l = _.find(Level.items, function (item) {
      return item.level === p_sel.aiq.level;
    });

    if (typeof l !== 'undefined') {
      message = 'Rilevato inquinante ' + p_sel.polluting + ' a ' + Math.round(p_sel.aiq.realvalue) + ' ' + p_sel.aiq.um + ' (aqi: ' + Math.round(p_sel.aiq.value) + ') ' +
                'a ' + p_sel.city + ',inquinamento ' + p_sel.aiq.type + ',' + l.name;

      image = SHARE.github + l.image;
      link = SHARE.www;
    };

    console.log(message + '\n' + image + '\n' + link);

    if (type === 'facebook') {
      $cordovaSocialSharing
        .shareViaFacebook(message, image, link)
        .then(_success_share, _error_share);
    } else if (type === 'twitter') {
      $cordovaSocialSharing
        .shareViaTwitter(message, image, link)
        .then(_success_share, _error_share);
    } else if (type === 'whatsapp') {
      $cordovaSocialSharing
      .shareViaWhatsApp(message, image, link)
      .then(_success_share, _error_share);
    }
  };

  function _success_share(result) {
    console.log('condivisione avvenuta con successo.');
  };

  function _error_share(err) {
    console.log('errore nella condivisione.');
  };

  $scope.share = function() {

   // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: '<i class="icon ion-social-facebook"></i> Facebook' },
        { text: '<i class="icon ion-social-twitter"></i> Twitter' },
        { text: '<i class="icon ion-social-whatsapp"></i> WhatApp'}
      ],
      titleText: 'Share',
      cancelText: 'Cancel',
      cancel: function() {
          // add cancel code..
        },
      buttonClicked: function(index) {
        if (index == 0) {
          // facebook
          console.log('share with facebook');
          _share('facebook');
        } else if (index == 1) {
          // twitter
          console.log('share with twitter');
          _share('twitter');
        } else if (index == 2) {
          console.log('share with whatsapp');
          _share('whatsapp');
        }

        return true;
      }
   });

   // For example's sake, hide the sheet after two seconds
   $timeout(function() {
     hideSheet();
   }, 2000);

  };

  //////////////////////////////////
  //
  // Modal Info
  //
  
  $ionicModal.fromTemplateUrl('templates/info.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
  
  $scope.openModal = function() {
    $scope.modal.show();
  };
  
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  
    //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
      $scope.modal.remove();
  });
  
    // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
      // Execute action
  });
  
    // Execute action on remove modal
  $scope.$on('modal.removed', function() {
      // Execute action
  });
	
  $scope.view_error = false;
  $scope.view_data = false;
  
  function showSpinner (view, message) {

    var msg = '<ion-spinner icon="spiral"></ion-spinner>';

    if (typeof message !== 'undefined') {
      msg += '<br />' + message;
    };

    if (view) {  
      $ionicLoading.show({
          template: msg
      });
    } else {
      $ionicLoading.hide();
    }
  };

  function _load(polluting) {

    var data_filtered;

    Import.start(function (err, data) {
      
      data_airq = data.dataset;
      
      // console.log('Dataset: ' + JSON.stringify(data.dataset));
      $scope.source = data.source.id;
      $scope.source_link = data.source.url;
      $scope.data_airq = data.source.date;

      if (typeof polluting === 'undefined') {
        data_filtered = data_airq;
      } else {
        data_filtered = _.filter(data_airq, function (item) {
          return item.polluting == polluting;
        });
      };

      Import.sort(data_filtered, function (data_s) {
        
        item_nearest = data_s[0];      
        city_nearest = item_nearest.city;

        console.log('item nearest: ' + JSON.stringify(item_nearest));

        if (typeof polluting === 'undefined') {
          // seleziono il primo inquinante della stazine più vicina
          var p = _.find(Polluting, function (item) {
            return item.name == item_nearest.polluting;
          });

          $scope.poll_sel = {
            item : p
          };
        };

        console.log('change gauge...');

        gauge(item_nearest);
        last(item_nearest);

        showSpinner(false);

      });

    }, _callback_message);

  };

  $scope.changePoll = function () {
    _reset_gauge();
    console.log('change polluting to ' + JSON.stringify($scope.poll_sel.item));
    _load($scope.poll_sel.item.name);
  };

  //////////////////////////////////
  //
  // Gauge Meters
  //

  function _reset_gauge() {
    $scope.view_data = false;
    // $scope.title = '';
    $scope.titleFontColor = 'blue';
    $scope.value = 0;
    $scope.valueFontColor = 'red';
    $scope.min = 10;
    $scope.max = 1000;
    $scope.valueMinFontSize = undefined;
    $scope.titleMinFontSize = undefined;
    $scope.labelMinFontSize = undefined;
    $scope.minLabelMinFontSize = undefined;
    $scope.maxLabelMinFontSize = undefined;
    $scope.hideValue = false;
    $scope.hideMinMax = true;
    $scope.hideInnerShadow = false;
    $scope.width = undefined;
    $scope.height = undefined;
    $scope.relativeGaugeSize = undefined;
    $scope.gaugeWidthScale = 0.5;
    $scope.gaugeColor = 'grey';
    $scope.showInnerShadow = true;
    $scope.shadowOpacity = 0.5;
    $scope.shadowSize = 3;
    $scope.shadowVerticalOffset = 10;
    $scope.levelColors = Level.getColors();

    $scope.noGradient = false;
    // $scope.label = '';
    // $scope.labelFontColor = '';
    $scope.startAnimationTime = 1000;
    $scope.startAnimationType = 'linear';
    $scope.refreshAnimationTime = 1000;
    $scope.refreshAnimationType = 'linear';
    $scope.donut = undefined;
    $scope.donutAngle = 90;
    $scope.counter = true;
    $scope.decimals = 2;
    $scope.symbol = '';
    $scope.formatNumber = true;
    $scope.humanFriendly = true;
    $scope.humanFriendlyDecimal = true;
    // $scope.city = '';
    // $scope.location = '';
  };

  function gauge (item_gauge) {
    
    showSpinner(true, 'visualizzo i dati ...');

    location = Geolocation.location();

    /*
    {
      "station":"Altamura",
      "city":"Altamura",
      "state":"Bari",
      "value":11,
      "day":3,
      "distance":31317,
      "aiq":{
        "value":10.185185185185185,
        "realvalue":11,
        "type":"urbano",
        "warning":0,
        "color":"#37e400",
        "text":"good",
        "level":1,
        "um":"µg/m³",
        "limit":0
        },
      "polluting":"PM10",
      "location":{
        "latitude":40.82786543446942,
        "longitude":16.56019549806092
      }
    }
    */

    console.log('item gauge: ' + JSON.stringify(item_gauge));

    var descr = 'Inquinamento di tipo ' + item_gauge.aiq.type;
    console.log(descr);
    console.log('level: ' + item_gauge.aiq.level);
    
    $scope.level_type = descr;

    $scope.title = Math.round(item_gauge.aiq.realvalue) + ' ' + item_gauge.aiq.um;
    $scope.value = Math.round(item_gauge.aiq.value);
    $scope.label = item_gauge.city;
    $scope.labelFontColor = item_gauge.aiq.color;

    $scope.level_poll = item_gauge.aiq.level;
    $scope.city = item_gauge.city;
    $scope.location = item_gauge.location;

    $scope.view_data = true;

    showSpinner(false);
    
  };

  $scope.textRenderer = function (value) {
    return value;
  };

  ///////////////////////
  //
  // Geolocation
  //

  var _callback_geolocation_success = function (position) {
    // showSpinner(true, 'coordinate rilevate...');
    $scope.view_error = false;
    console.log('getting position: ' +  JSON.stringify(position));
    Geolocation.save(position);
    // $scope.refresh();

  };

  var _callback_geolocation_error = function (error) {
    $scope.view_error = true;
    console.error('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
    $scope.error = 'No GPS';
  };

  Geolocation.watch(_callback_geolocation_success, _callback_geolocation_error);

  $scope.refresh = function () {

    showSpinner(true, 'leggo i valori dalle centraline...');
    _reset_gauge();

    $scope.polls = Polluting;

    location = Geolocation.location();
    
    Geolocation.address(function (err, address) {
      $scope.location = address;
    });

    if (location.latitude == 0 && location.longitude) {
      $scope.view_error = true;
      $scope.error = 'No GPS'
    } else {
      console.log('location: ' + location.latitude + ',' + location.longitude);
      $scope.view_error = false;
    };

    _load();

  };

  // calcolo la variazione di valori rispetto ai valori precedenti
  function last (item) {

    showSpinner(true, 'confronto i valori ...');

    Import.last(1, function (err, data_last) {

      // console.log('last_data n.:' + _.size(data_last.dataset));
      // console.log('check last value by ' + JSON.stringify(item));
      
      var item_poll_near = _.find(data_last.dataset, function (item_data) {
          //console.log('item last: ' + JSON.stringify(item));
          //console.log('newValue: ' + JSON.stringify(newValue));
          return (item.polluting == item_data.polluting && 
                  item.city == item_data.city && 
                  item.station == item_data.station);
        });

        if (typeof item_poll_near !== 'undefined') {

          // console.log('item founded: ' + JSON.stringify(item_poll));
          
          var value_r = item.aiq.realvalue;
          var value_l = item_poll_near.aiq.realvalue;

          $scope.last_value = (value_l / value_r);

          if (value_l > value_r) {
            $scope.icon_value = 'icon ion-ios-arrow-thin-down';
          } else if (value_l < value_r) {
            $scope.icon_value = 'icon ion-ios-arrow-thin-up';
          } else {
            $scope.icon_value = 'icon ion-ios-minus-empty';
          };
        };
        showSpinner(false);
    });
  };
})

.controller('AirQCtrlList', function ($scope, Geolocation, $ionicLoading, $timeout, _, UTILITY, $ionicModal, GaugeMeter, Import, Level, GeoJSON, $cordovaSocialSharing, SHARE) {

  var data_sorted;
  var data_airq;
  var location;

  $scope.view_error = false;

  function showSpinner (view, message) {

    $scope.view_loader = view;
    $scope.view_descr = !view;

    var msg = '<ion-spinner icon="spiral"></ion-spinner>';

    if (typeof message !== 'undefined') {
      msg += '<br />' + message;
    };

    if (view) {  
      $ionicLoading.show({
          template: msg
      });
    } else {
      $ionicLoading.hide();
    }
  };

  var _callback_geolocation_success = function (position) {
    showSpinner(true, 'leggo la posizione');
    $scope.view_error = false;

    console.log('getting position: ' +  JSON.stringify(position));
    Geolocation.save(position);
    $scope.refresh();
  };

  var _callback_geolocation_error = function (error) {
    console.error('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
    $scope.view_error = true;
    $scope.error = 'No GPS';
  };

  Geolocation.watch(_callback_geolocation_success, _callback_geolocation_error);

  $scope.share = function (type, item) {

    var message = '';
    var image = '';
    var link = '';

    var l = _.find(Level.items, function (item_find) {
      return item_find.level === item.aiq.level;
    });

    if (typeof l !== 'undefined') {
      message = 'Rilevato inquinante ' + item.polluting + ' a ' + Math.round(item.aiq.realvalue) + ' ' + item.aiq.um + ' (aqi: ' + Math.round(item.aiq.value) + ') ' +
                'a ' + item.city + ',inquinamento ' + item.aiq.type + ',' + l.name;

      image = SHARE.github + l.image;
      link = SHARE.www;
    };

    console.log(message + '\n' + image + '\n' + link);

    if (type === 'facebook') {
      $cordovaSocialSharing
        .shareViaFacebook(message, image, link)
        .then(_success_share, _error_share);
    } else if (type === 'twitter') {
      $cordovaSocialSharing
        .shareViaTwitter(message, image, link)
        .then(_success_share, _error_share);
    } else if (type === 'whatsapp') {
      $cordovaSocialSharing
      .shareViaWhatsApp(message, image, link)
      .then(_success_share, _error_share);
    }
  };

  $scope.back = function () {
    window.location.href = '#/airq'
  };

  $ionicModal.fromTemplateUrl('templates/info.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
  
  $scope.openModal = function() {
    $scope.modal.show();
  };
  
  $scope.closeModal = function() {
      $scope.modal.hide();
  };
  
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
      $scope.modal.remove();
  });
  
    // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
      // Execute action
  });
  
    // Execute action on remove modal
  $scope.$on('modal.removed', function() {
      // Execute action
  });

  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.refresh();
  });
  
  $scope.refresh = function () {

    showSpinner(true, 'Loading data...');

    location = Geolocation.location();
    
    Geolocation.address(function (err, address) {
      $scope.location = address;
    });

    Import.start(function (err, data) {
      if (!err) {
        data_airq = data.dataset;
        // console.log('Dataset: ' + JSON.stringify(data.dataset));
        $scope.source = data.source.id;
        $scope.source_link = data.source.url;
        $scope.data_airq = data.source.date;
        $scope.load(data_airq);
      } else {
        // error
        $scope.view_error = true;
        $scope.error = 'Non riesco a leggere i dati.';
      }

      showSpinner(false);
    }, _callback_message);
  };

  function _callback_message(open, message, counter) {
    showSpinner(open, message);
  };

  // calcolo la variazione di valori rispetto ai valori precedenti
  $scope.last = function () {

    showSpinner(true, 'check data...');

    Import.last(1, function (err, data_last) {

      // console.log('last_data n.:' + _.size(data_last.dataset));

      for (var i = 0; i < $scope.airqlist.length; i++) {
        $scope.$watch('airqlist[' + i + ']', function (newValue, oldValue) {
          
          // console.log('newvalue location: ' + JSON.stringify(newValue.location));
          // console.log('location: ' + JSON.stringify(location));
          
          var item_poll = _.find(data_last.dataset, function (item) {
            //console.log('item last: ' + JSON.stringify(item));
            //console.log('newValue: ' + JSON.stringify(newValue));
            return (newValue.polluting == item.polluting && 
                    newValue.city == item.city && 
                    newValue.station == item.station);
          });

          if (typeof item_poll !== 'undefined') {

            var value_r = newValue.aiq.realvalue;
            var value_l = item_poll.aiq.realvalue;

            $scope.last_value = value_l / value_r;

            // console.log('item founded: ' + JSON.stringify(item_poll) + '\n Last Value: ' + $scope.last_value);

            if (value_l > value_r) {
              $scope.icon_value = 'icon ion-ios-arrow-thin-down';
            } else if (value_l < value_r) {
              $scope.icon_value = 'icon ion-ios-arrow-thin-up';
            } else {
              $scope.icon_value = 'icon ion-ios-minus-empty';
            };
          };
        });
      };
    });

    showSpinner(false);

  };

  $scope.load = function (data) {

    showSpinner(true, 'Loading data...');

    console.log('sorted by location: ' + location.latitude + ',' + location.longitude);

    Import.sort(data, function (data_s) {
      // filtra i dati per livello >=2
      var data_filtered = _.filter(data_s, function(item) {
        return item.aiq.level >= UTILITY.level;
      });

      console.log('Data data_filtered: ' + _.size(data_filtered));
      data_airq = data_filtered;
      $scope.airqlist = data_airq;
      // confronto con gli ultimi dati
      $scope.last();
    });
    
    $scope.$broadcast('scroll.refreshComplete');
    showSpinner(false);

  };

})

/////////////////////////////
// Weather Controller
//
.controller('WeatherCtrl', function ($scope, $stateParams, Weather, Geolocation, $timeout, UTILITY, $ionicModal, $ionicLoading) {
  
  var weather;
  var location;

  showSpinner(true);

  function showSpinner (view, message) {

    $scope.view_error = view;

    var msg = '<ion-spinner icon="spiral"></ion-spinner>';

    if (typeof message !== 'undefined') {
      msg += '<br />' + message;
    };

    if (view) {  
      $ionicLoading.show({
          template: msg
      });
    } else {
      $ionicLoading.hide();
    }
  };

  var _callback_geolocation_success = function (position) {
    showSpinner(true, 'Coordinate rilevate');
    console.log('getting position: ' +  JSON.stringify(position));
    $scope.view_error = false;
    Geolocation.save(position);
    $scope.refresh();
  };

  var _callback_geolocation_error = function (error) {
    console.error('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
    $scope.view_error = true;
    $scope.error = 'No GPS';
  };

  Geolocation.watch(_callback_geolocation_success, _callback_geolocation_error);

  $scope.back = function () {
    window.location.href = '#/airq'
  };

  $ionicModal.fromTemplateUrl('templates/info_weather.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
  
  $scope.openModal = function() {
    $scope.modal.show();
  };
  
  $scope.closeModal = function() {
      $scope.modal.hide();
  };
  
    //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
      $scope.modal.remove();
  });
  
    // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
      // Execute action
  });
  
    // Execute action on remove modal
  $scope.$on('modal.removed', function() {
      // Execute action
  });
  
  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.refresh();
  });

  $scope.refresh = function () {

    showSpinner(true, 'loading data ...');

    Geolocation.address(function (err, address) {
      $scope.location = address;
    });

    Weather.get(function (err, data) {
      if (err) {
        $scope.view_error = true;
        $scope.error = 'non riesco a leggere i dati meteo';
      } else {
        $scope.view_error = false;
        weather = data.list;
        $scope.weathers = weather;
      };
      showSpinner(false);
    }); 
  };

});

