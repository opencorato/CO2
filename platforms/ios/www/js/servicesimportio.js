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
// airQ App - Service ImportIO Library
//
//

var service = angular.module('airq.servicesimportio', []);

service.factory('Import', function (IMPORT, _, $moment, $http, async, S, AirQuality, Stations, pdb, Geolocation, GeoJSON, UTILITY, DB) {

	var data_response = [];
	var db;

	var data_json = {
    	_id: '',
    	_rev: '',
    	source: {
      		url: 'http://www.arpa.puglia.it/web/guest/qariainq',
      		id: 'ARPA Puglia',
      		date: ''
    	},
    	dataset: []
	};

	var importio_json = {

        // carico gli utlimi dati per calcolar la variazione ai dati attuali
		last: function (days, callback_service) {
			var nDays;	// controllo solo i dati negli ultimi sette giorni
			var data_response = null;

			if (days > 7) {
				nDays = 7;
			} else {
				nDays = days;
			};

			pdb.open(DB.name, function (db_istance) {
				
				db = db_istance;

				var array_last = [];
				var i = 1;

				for (i = 1; i <= nDays; i++) {
					var id_last = moment().subtract(i, 'days').format("YYYYMMDD");
					array_last.push(id_last);
				};

				async.each(array_last, function (item, callback) {
					console.log('check: ' + item);
					pdb.get(db, item, function (err, data_last) {
						// console.log('data readed: ' + JSON.stringify(data_last));
						if (!err && data_response == null) {
							data_response = data_last;
							// console.log('data founded: ' + JSON.stringify(data_response));
						};
						callback();
					});
				}, function (err) {
					if (data_response == null) {
						console.log('archivio vuoto');
						importio_json.start(callback_service);	
					} else {
						console.log('sono stati trovati dati precedenti');
						if (typeof callback_service === 'function') {
							callback_service(err, data_response);
						};
					};
				});
			});
		},

		sort: function (data, callback_service) {
			var location = Geolocation.location();

			if (location.latitude == 0 && location.longitude == 0) {
				var data_sorted = data;
			} else {
				var data_sorted = _.sortBy(data, function (item) {
	      			// console.log('item sorted: ' + JSON.stringify(item));
	      			return GeoJSON.distance(location.latitude, location.longitude, item.location.latitude, item.location.longitude);
	    		});
			};

    		if (typeof callback_service === 'function') {
    			callback_service(data_sorted);
    		};

		},

		// crea legge i dati
		start: function (callback_service, callback_message) {

			var date_now = $moment().format("YYYYMMDD");
  			tag = date_now;

  			// se i dati non esistono allora bisogna crearli

  			async.series([

  				/////////////////////////////////////////
			    // 
			    // apro il database
  				
			    function (callback_root) {

			    	if (!UTILITY.force) {
				    	console.log('apro il database');
				    	
				    	if (typeof callback_message === 'function') {
							callback_message('connect to data ...', 0);
						};

				    	// controllo il database dei dati
	  					pdb.open(DB.name, function (db_istance) {
	  						db = db_istance;
	  						callback_root(false, 'next');
	  					});
	  				} else {
	  					callback_root(false, 'next');	
	  				}
			    },

			    /////////////////////////////////////////
			    // 
			    // leggo il documento
  				
			    function (callback_root) {

			    	if (!UTILITY.force) {
				    	console.log('controllo il documento by ID: ' + tag);
				    	
				    	if (typeof callback_message === 'function') {
							callback_message('reading data ...', 0);
						};

				    	pdb.get(db, tag, function(err, data) {
				    		if (!err) {
				    			data_json = data;
				    			callback_root(false, 'next');
				    		} else {
				    			console.log('non ho trovato il documento.');
				    			callback_root(false, 'next');
				    		};
				    	});
				    } else {
				    	callback_root(false, 'next');	
				    }
			    },

			    /////////////////////////////////////////
			    // 
			    // scraping dei dati
  				
  				function (callback_root) {

  					if (data_json._rev === '' || UTILITY.force) {

  						console.log('importio start by id: ' + tag);

  						if (typeof callback_message === 'function') {
							callback_message('importing data ...', 0);
						};
	  				
	  					data_json._id = tag;

						// carico i dati da importio
						async.each(IMPORT.curls, function (item, callback) {
							$http(item)
                            .success(function (data, status, headers, config) {
				            //handle success
				            	data_response = _.union(data_response, data.results);
                                     console.log('data loaded.');
				            	callback();    	
				            }).error(function (data, status, headers, config) {
                                //handle error.
                                     console.log('error to load data.');
							    callback(true);
							});
						}, function (err) {
							callback_root(err, 'next');
						});
					} else {
						callback_root(false, 'next');	
					}
  				}, 

  				/////////////////////////////////////////
			    // 
			    // armonizzazione dei dati
  				
  				function (callback_root) {

  					var isSync = false;
					var i = 0;
					var poll = '';
					var provincia = '';

					if (data_json._rev === '' || UTILITY.force) {

						if (typeof callback_message === 'function') {
							callback_message('optiomizing data ...', _.size(data_response));
						};

						async.each(data_response, function (item, callback) {

					    // console.log('Reading data: ' + JSON.stringify(item));

						    var data_item = {
						      station: '',
						      city: '',
						      state: '',
						      value: '',
						      day: '',
						      aiq: {},
						      polluting: '',
						      location: {
						        latitude: 0,
						        longitude: 0
						      }
						    };

						    // console.log('Item: ' + JSON.stringify(item));

						    if (typeof item.data !== 'undefined') {
						      data_json.source.date = item.data;
						    };    

						    if (typeof item.inquinante !== 'undefined') {
						      if (S(item.inquinante).contains('Inquinante:')) {
						        poll = S(S(item.inquinante).strip('Inquinante:').s).trim().s;
						        // console.log('Inquinante: ' + poll);
						      } else {
						        poll = S(item.inquinante).trim().s;
						      }
						    };

						    if (typeof item.provincia !== 'undefined') {
						      if (S(item.provincia).contains('Provincia:')) {
						        provincia = S(S(item.provincia).strip('Provincia:').s).trim().s;
						        // console.log('Provincia: ' + provincia);
						      } else {
						        provincia = S(item.provincia).trim().s;
						      }
						    };
					    	
			    			i++;
			    			isSync = i >= 2; 

			    			if (isSync) {
			      
						      var centralina = '';

						      var filter_text = '..';

						      if (typeof item.centralina !== 'undefined') {
						        if (S(item.centralina).contains(filter_text)) {
						          centralina =  S(S(item.centralina).strip(filter_text).s).trim().s;
						        } else {
						          centralina = S(item.centralina).trim().s;
						        };
						      };

						      data_item.value = parseFloat(item['valore/_source']);
						      
						      data_item.day = parseInt(item.giorni);
						      
						      data_item.station = centralina;
						      data_item.city = item.comune;
						      data_item.state = provincia;

						      // inquinante
						      data_item.polluting = poll;

						      if (typeof callback_message === 'function') {
						      	var message = poll + ': ' + data_item.city;
								callback_message(message, i++);
							  };

						      data_json.dataset.push(data_item);

						    };

						    callback();

			  			}, function (err) {
			  				callback_root(err, 'next');
			  			});
					} else {
						callback_root(false, 'next');
					}
  				},

  				/////////////////////////////////////////
			    // 
			    // filtro i dati
  				
  				function (callback_root) {

  					if (data_json._rev === '' || UTILITY.force) {

  						if (typeof callback_message === 'function') {
			    			callback_message('filtering data ...', 0);
						};

				        console.log('Filtering data ... ');
			        	var n = _.size(data_json.dataset);
			          
			          	var data_filtered = _.filter(data_json.dataset, function(item){ 
			            	return !S(item.station).isEmpty(); 
			          	});

			          	var data_filtered_2 = _.filter(data_filtered, function(item){ 
			            	return !(isNaN(parseFloat(item.value))); 
			          	});

			          	data_json.dataset = data_filtered_2;
			          	var nF = _.size(data_filtered_2);
			          	console.log('-- data filtered n. ' + nF + '/' + n);
				        
				    };

				    callback_root(false, 'next');

			    },

			    /////////////////////////////////////////
			    // 
			    // calcolo la qualità dell'aria
			      
			    function (callback_root) {

			    	if (data_json._rev === '' || UTILITY.force) {

			    		if (typeof callback_message === 'function') {
			    			callback_message('calculating air quality', 0);
						};

				    	console.log('start calculating air quality ...');
					  	async.each(data_json.dataset, function (item, callback) {
					    	AirQuality.get(item.polluting, item.value, function (aiq_data) {
					      		item.aiq = aiq_data;
					      		callback(false, 'next'); 
					    	});
					  	}, function (err) {
					    	callback_root(err, 'next');
					  	});
					} else {
						callback_root(false, 'next'); 
					}
			    },

			    /////////////////////////////////////////
			    // 
			    // leggo le coordinate delle stazioni ARPA
			      
			    function (callback_root) {

			    	if (data_json._rev === '' || UTILITY.force) {
	        			console.log('init setting locations airq ...');

	        			if (typeof callback_message === 'function') {
			    			callback_message('reading stations ...', 0);
						};
	        
				        Stations.get(data_json.dataset, function (err, data) {
				          	data_json.dataset = data;
				          	console.log('founded n.' + _.size(data) + ' stations.');
				        	callback_root(err, 'done');
				        });
				    } else {
				    	callback_root(false, 'done');	
				    }  

			    }], 

			    /////////////////////////////////////////
			    // ---- END
			    // fine dell'import dei dati
			    
			    function (err, results) {

			    	// salvo i dati nel database
			    	if (data_json._rev === '' || UTILITY.force) {

			    		if (typeof callback_message === 'function') {
			    			callback_message('saving data ...', 0);
						};

			    		if (typeof db === 'undefined') {
			    			pdb.open(DB.name, function (db_istance) {
			    				
			    				db = db_istance;
			    				
			    				_save(pdb, db, data_json, callback_service);
			    			});
			    		} else {

			    			_save(pdb, db, data_json, callback_service);
			    		};

			    	} else {
			    		
			    		//console.log('Data Document Saved: ' + JSON.stringify(data_json));
			    		if (typeof callback_service === 'function') {
  							callback_service(err, data_json);
  						};
			    	}
  				});
		}
	};

	return importio_json;

});

function _save(pdb, db, data, callback) {
	pdb.put(db, data, function (err, response) {
		//console.log('Response: ' + JSON.stringify(response));
		if (typeof callback_service === 'function') {
			callback_service(err, data);
		};
	});
};
