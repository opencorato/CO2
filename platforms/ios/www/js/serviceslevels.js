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
// airQ App - Services Level Air Quality
//
//

var service = angular.module('airq.levels', []);

service.factory('Level', function () {

  var level = {
    getColors: function (str) {
      var i = 0;
      var colors = [];
      while (level.items[i]) {
        colors.push(level.items[i].color);
        i++;
      }; 
      return colors;
    },
    items: [{
      image: 'img/airq/level-1.jpg',
      name: 'qualità dell\'aria buona',
      color: '#37e400',
      level: 1
    },
    {
      image: 'img/airq/level-2.jpg',
      name: 'aria inquinata moderatamente',
      color: '#ffff01',
      level: 2
    },
    {
      image: 'img/airq/level-3.jpg',
      name: 'aria malsana solo per gruppi di persone',
      color: '#fb7e01',
      level: 3
    },
    {
      image: 'img/airq/level-4.jpg',
      name: 'aria malsana',
      color: '#fa1100',
      level: 4
    },
    {
      image: 'img/airq/level-5.jpg',
      name: 'aria molto malsana, rischio per la salute.',
      color: '#99024c',
      level: 5
    },
    {
      image: 'img/airq/level-6.jpg',
      name: 'livello di inquinamento pericolo per la salute',
      color: '#7e0322',
      level: 6
    },
    {
      image: 'img/airq/level-7.jpg',
      name: 'livello di inquinamento molto pericoloso per la salute',
      color: '#660000',
      level: 7
    },
    {
      image: 'img/airq/level-8.jpg',
      name: 'livello di inquinamento molto alto! Rischi elevati per la salute!',
      color: '#000000',
      level: 8
    }]
  };

  return level;

});