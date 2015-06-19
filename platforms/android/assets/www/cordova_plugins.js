cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.ionic.keyboard/www/keyboard.js",
        "id": "com.ionic.keyboard.keyboard",
        "clobbers": [
            "cordova.plugins.Keyboard"
        ]
    },
    {
        "file": "plugins/com.phonegap.plugins.PushPlugin/www/PushNotification.js",
        "id": "com.phonegap.plugins.PushPlugin.PushNotification",
        "clobbers": [
            "PushNotification"
        ]
    },
    {
        "file": "plugins/nl.x-services.plugins.socialsharing/www/SocialSharing.js",
        "id": "nl.x-services.plugins.socialsharing.SocialSharing",
        "clobbers": [
            "window.plugins.socialsharing"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.device/www/device.js",
        "id": "org.apache.cordova.device.device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/org.transistorsoft.cordova.background-geolocation/www/BackgroundGeoLocation.js",
        "id": "org.transistorsoft.cordova.background-geolocation.BackgroundGeoLocation",
        "clobbers": [
            "plugins.backgroundGeoLocation"
        ]
    },
    {
        "file": "plugins/org.pbernasconi.progressindicator/www/progressIndicator.js",
        "id": "org.pbernasconi.progressindicator.ProgressIndicator",
        "clobbers": [
            "ProgressIndicator"
        ]
    },
    {
        "file": "plugins/cordova-plugin-dialogs/www/notification.js",
        "id": "cordova-plugin-dialogs.notification",
        "merges": [
            "navigator.notification"
        ]
    },
    {
        "file": "plugins/cordova-plugin-dialogs/www/android/notification.js",
        "id": "cordova-plugin-dialogs.notification_android",
        "merges": [
            "navigator.notification"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.ionic.keyboard": "1.0.4",
    "com.phonegap.plugins.PushPlugin": "2.4.0",
    "nl.x-services.plugins.socialsharing": "4.3.19-dev",
    "org.apache.cordova.device": "0.3.0",
    "org.apache.cordova.geolocation": "0.3.12",
    "org.transistorsoft.cordova.background-geolocation": "0.3.6",
    "org.pbernasconi.progressindicator": "1.1.0",
    "cordova-plugin-dialogs": "1.1.0"
}
// BOTTOM OF METADATA
});