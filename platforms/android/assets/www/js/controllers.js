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
.controller('AirQCtrl', function ($scope, Geolocation, $ionicLoading, $timeout, _, UTILITY, $ionicModal, GaugeMeter, Level, Import, GeoJSON, $ionicActionSheet, $cordovaSocialSharing, SHARE) {

	// Geolocation.watch();

  var data_airq;
  var location;
  var watch;
  var gauges = [];
  var p_sel;

  showSpinner(true);
  $scope.view_data = false;

  function _share (type) {

    var message = '';
    var image = '';
    var link = '';

    var l = _.find(Level.items, function (item) {
      return item.level === p_sel.aiq.level;
    });

    if (typeof l !== 'undefined') {
      message = 'Rilevato inquinante ' + p_sel.polluting + ' a ' + Math.round(p_sel.aiq.realvalue) + ' ' + p_sel.aiq.um + ' (aqi: ' + Math.round(p_sel.aiq.value) + ') ' +
                'a ' + p_sel.station + ',inquinamento ' + p_sel.aiq.type + ',' + l.name;

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
	
  function showSpinner (view, message) {

    $scope.view_loader = view;
    $scope.view_descr = !view;

    var msg = '<ion-spinner icon="lines"></ion-spinner>';

    if (typeof message !== 'undefined') {
      msg = message;
    };

    if (view) {  
      $ionicLoading.show({
          template: msg
      });
    } else {
      $ionicLoading.hide();
    }
  };

  $scope.prepare = function (data) {

    showSpinner(true);

    var data_sorted;
    var item_nearest;

    /*
    if (location.latitude != 0 && location.longitude != 0) {
      console.log('sorting data ...')
      data_sorted = _.sortBy(data, function (item) {
        return Geolocation.distance(location.latitude, location.longitude, item.location.latitude, item.location.longitude);
      });
    } else {
      console.log('non sono riuscito a leggere le coordinate geografiche.');
      data_sorted = data;
    };
    */

    GeoJSON.nearest(data, location.latitude, location.longitude, function (err, item) {
      if (!err) {
        console.log('stazione più vicina trovata: ' + JSON.stringify(item));
        item_nearest = item.properties;
        
      } else {
        console.log('errore nel trovare la stazione più vicina');
        item_nearest = data[0];
      };

      p_sel = item_nearest;

      // prendo solo i dati che riguardano la città più vicina
      var data_filtered = _.filter(data, function (item_filtered) {
        return item_filtered.station === item_nearest.station;
      });

      $scope.polls = data_filtered;
    
      $scope.poll_sel = {
        item: p_sel
      };

      gauge(p_sel);
      last(p_sel);

    });

    // showSpinner(false);

  };

  $scope.changePoll = function () {
    p_sel = $scope.poll_sel.item;
    console.log('change polluting to ' + JSON.stringify($scope.poll_sel.item));
    gauge($scope.poll_sel.item);
    last($scope.poll_sel.item);
  };

  function gauge (item) {

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

    console.log('item ' + JSON.stringify(item));

    var descr = 'Inquinamento di tipo ' + item.aiq.type;
    console.log(descr);
    console.log('level: ' + item.aiq.level);
    
    $scope.level_type = descr;

    $scope.title = Math.round(item.aiq.realvalue) + ' ' + item.aiq.um;
    $scope.titleFontColor = 'blue';
    $scope.value = Math.round(item.aiq.value);
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
    $scope.label = item.station;
    $scope.labelFontColor = item.aiq.color;
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

    $scope.level_poll = item.aiq.level;

    $scope.city = item.city;
    $scope.location = item.location;

    $scope.view_data = true;
    showSpinner(false);
    
  };

  $scope.textRenderer = function (value) {
    return value;
  };

  $scope.refresh = function () {

    showSpinner(true);

    location = Geolocation.location();
    
    Geolocation.address(function (err, address) {
      $scope.location = address;
    });

    console.log('location: ' + location.latitude + ',' + location.longitude);

    Import.start(function (err, data) {
      data_airq = data.dataset;
      // console.log('Dataset: ' + JSON.stringify(data.dataset));
      $scope.source = data.source.id;
      $scope.source_link = data.source.url;
      $scope.data_airq = data.source.date;
      $scope.prepare(data_airq);
      $ionicLoading.hide();
      showSpinner(false);  
    });

  };

  // calcolo la variazione di valori rispetto ai valori precedenti
  function last (item) {

    showSpinner(true);
    
    console.log('init last...');

    Import.last(1, function (err, data_last) {

      console.log('last_data n.:' + _.size(data_last.dataset));
      console.log('check last value by ' + JSON.stringify(item));
      
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

    // showSpinner(false);

  };

  $timeout(function() {
    $scope.refresh();
  }, UTILITY.timeout);

})

.controller('AirQCtrlList', function ($scope, Geolocation, $ionicLoading, $timeout, _, UTILITY, $ionicModal, GaugeMeter, Import, Level, GeoJSON) {

  Geolocation.watch();

  var data_sorted;
  var data_airq;
  var location;

  showSpinner(true);
  
  function showSpinner (view, message) {

    var msg = '<ion-spinner icon="lines"></ion-spinner>';

    if (typeof message !== 'undefined') {
      msg = message;
    };

    if (view) {  
      $ionicLoading.show({
          template: msg
      });
    } else {
      $ionicLoading.hide();
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
  
  $scope.refresh = function () {

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
      }

      showSpinner(false);
    });
  };

  // calcolo la variazione di valori rispetto ai valori precedenti
  $scope.last = function () {

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

            console.log('item founded: ' + JSON.stringify(item_poll) + '\n Last Value: ' + $scope.last_value);

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

    showSpinner(true);

    console.log('sorted by location: ' + location.latitude + ',' + location.longitude);

    // ordino i dati in base alla posizione del dispositivo
    data_sorted = _.sortBy(data, function (item) {
      // console.log('item sorted: ' + JSON.stringify(item));
      return GeoJSON.distance(location.latitude, location.longitude, item.location.latitude, item.location.longitude);
    });
    
    console.log('Data sorted: ' + _.size(data_sorted));

    // filtra i dati per livello >=2
    var data_filtered = _.filter(data_sorted, function(item) {
        return item.aiq.level >= UTILITY.level;
    });

    console.log('Data data_filtered: ' + _.size(data_filtered));

    // carico tutti i dati tranne il più vicino
    // data_airq = _.last(data_filtered, _.size(data_filtered)-1);

    data_airq = data_filtered;

    $scope.airqlist = data_airq;

    // calcolo la distanza
    /*
    for (var i = 0; i < $scope.airqlist.length; i++) {
      $scope.$watch('airqlist[' + i + ']', function (newValue, oldValue) {
        $scope.distance = Geolocation.distance(newValue.location.latitude, newValue.location.longitude);
      })
    };
    */

    // confronto con gli utlimi dati
    $scope.last();
      
    $scope.$broadcast('scroll.refreshComplete');
    showSpinner(false);

  };

  $timeout(function() {
    $scope.refresh();
  }, UTILITY.timeout);

})

/////////////////////////////
// Weather Controller
//
.controller('WeatherCtrl', function ($scope, $stateParams, Weather, Geolocation, $timeout, UTILITY, $ionicModal, $ionicLoading) {
  
  var weather;
  var location;

  // Geolocation.watch();

  $scope.showSpinner = function() {
    $ionicLoading.show({
        template: '<ion-spinner icon="lines"></ion-spinner>'
    });
  };

  $scope.hideSpinner = function () {
    $ionicLoading.hide();
  };

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

    $scope.showSpinner();

    // location = Geolocation.get();

    Geolocation.address(function (err, address) {
      $scope.location = address;
    });

    Weather.get(function (err, data) {
      weather = data.list;
      $scope.weathers = weather;
    }); 

    $scope.hideSpinner();
  };

  $timeout(function() {
    $scope.refresh();
  }, UTILITY.timeout);
})

function _isOut(location_start, location, DIST, Geolocation, callback) {

  if (location_start.latitude === 0) {
      
      location_start.latitude = location.latitude;
      location_start.longitude = location.longitude;
      
      if (typeof callback === 'function') {
        callback(location_start, true, 0);
      };

    } else {
      // controllo se la distanza dall'ultima coordinata è maggiore di 500 metri
      var distance = Geolocation.distance(location_start.latitude, location_start.longitude, location.latitude, location.longitude, Geolocation);

      if (typeof callback === 'function') {
        callback(location, distance >= DIST, distance);
      };

    }
};