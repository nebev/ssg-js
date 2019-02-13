'use strict';

/**
 * @module ssg-js
 */

/**
 * Run program
 * @param {String} [config_path=~/.ssh/config] - Path to ssh config file
 */
exports.run = function(config_path) {
	var aws = require('./aws');
	var digitalocean = require('./digitalocean');

	// Populate data from AWS if possible
	aws.getServerList().then(function(res){
		if (typeof(res) !== 'object'){
			return;	
		}
		config.add_entries(res.map(function(entry){
			return [
				'A:' + entry.instanceId,
				entry.hostname,
				entry.network.map(function(nw){
					return nw.address;
				}).join(" ")
			];
		}));

		// Update the Search List
		ui.searchList.setData(config.get_data( listeners.getSearchString() ));
		ui.searchList.select(listeners.getSelectorOffset()); // So our currently selected item doesn't get reset
		ui.screen.render();
		var awsForm = require('./form/awsconnect')(res, ui.screen);
		listeners.setAWSForm(awsForm);
	});

	// Populate data from DO if possible
	digitalocean.getServerList().then(function(res){
		if (typeof(res) !== 'object'){
			return;
		}
		config.add_entries(res.map(function(entry){
			return [
				'DO: ' + entry.description,
				'',
				entry.hostname
			];
		}));

		// Update the Search List
		ui.searchList.setData(config.get_data( listeners.getSearchString() ));
		ui.searchList.select(listeners.getSelectorOffset()); // So our currently selected item doesn't get reset
		ui.screen.render();
		var awsForm = require('./form/awsconnect')(res, ui.screen);
		listeners.setAWSForm(awsForm);
	});

	var config = require('./configdata')(config_path);
	var ui = require('./uielements');
	var listeners = require('./listeners');
	var configData = config.get_data;

	listeners.listen(
		ui.screen,
		ui.searchField,
		ui.searchList,
		configData
	);
	ui.screen.render();
};