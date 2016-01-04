'use strict';

/**
 * @module ssg-js
 */

/**
 * Run program
 * @param {String} [config_path=~/.ssh/config] - Path to ssh config file
 */
exports.run = function(config_path) {
	var config = require('./configdata')(config_path);
	var ui = require('./uielements');
	var listeners = require('./listeners');

	listeners.listen(
		ui.screen,
		ui.searchField,
		ui.searchList,
		config.get_data
	);
	ui.screen.render();
};