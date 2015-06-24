

/////////////////////////////
// Charts Controller
//

var loginctrl = angular.module('airq.logincontrollers', ['leaflet-directive']);

loginctrl.controller('LogInCtrl', function ($scope, $rootScope, $stateParams, $ionicUser, $ionicPush, $cordovaDevice, $localstorage) {

	var user = $localstorage.getObject('user');
	var uuid = $cordovaDevice.getUUID();

	var options = {
	  user_id: user.user_id,
	  name: user.name,
	  bio: user.bio
	};

	angular.extend(user, {
      name: user.name,
      bio: user.bio
    });

	$ionicUser.identify(options).then(function(){
	  $scope.identified = true;
	  console.log('user identified -> ' + JSON.stringify(user));
	}, function(err) {
		// error
		$scope.identified = false;
		console.log('error to identify user -> ' + JSON.stringify(user));
	});

	$scope.register = function () {

		console.log('Ionic User: Identifying with Ionic User service');

	    var options = {
		  user_id: uuid,
		  name: $scope.user.name,
		  bio: $scope.user.bio
		};

	    $ionicUser.identify(options).then(function(){
	      $scope.identified = true;
	      console.log('user identified -> ' + JSON.stringify(options));
	    }, function(err) {
 			// error
 			console.log('error to identify user -> ' + JSON.stringify(options));
		});

		$localstorage.setObject('user', options);

		$ionicPush.register({
	      canShowAlert: true, //Can pushes show an alert on your screen?
	      canSetBadge: true, //Can pushes update app icon badges?
	      canPlaySound: true, //Can notifications play a sound?
	      canRunActionsOnWake: true, //Can run actions outside the app,
	      onNotification: function(notification) {
	        // Handle new push notifications here
	        // console.log(notification);
	        return true;
	      }
	    });

	    console.log('done user registration');
	};

	$rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
    	alert("Successfully registered token " + data.token);
    	console.log('Ionic Push: Got token ', data.token, data.platform);
    	$scope.token = data.token;
  	});

});