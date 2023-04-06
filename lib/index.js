'use strict';

/**
 * @module ssg-js
 */

/**
 * Run program
 */
exports.run = function() {
	// let gcloud = require('./gcloud');
	//
	// // Populate data from GCP if possible
	// gcloud.getServerList().then(function(res){
	// 	if (typeof(res) !== 'object'){
	// 		return;
	// 	}
	// 	config.add_entries(res.map(function(entry){
	// 		return [
	// 			'GCP: ' + entry.hostname,
	// 			entry.user,
	// 			entry.description,
	// 			entry.network,
	// 			entry.port
	// 		];
	// 	}));
	//
	// 	// Update the Search List
	// 	ui.searchList.setData(config.get_data( listeners.getSearchString() ));
	// 	ui.searchList.select(listeners.getSelectorOffset()); // So our currently selected item doesn't get reset
	// 	ui.screen.render();
	// });

	let config = require('./configdata')();
	let ui = require('./uielements');
	let listeners = require('./listeners');
	let configData = config.get_data;

	listeners.listen(
		ui.screen,
		ui.searchField,
		ui.searchList,
		configData
	);
	ui.screen.render();
};
