'use strict';

var fs  = require("fs");

/**
 * Sets path to SSH config file and returns corresponding callback to retrieve data with
 * @module configdata
 * @param {String} [config_path=~/.ssh/config] - Path to ssh config file
 * @returns {module:configdata~configDataResult}
 */
module.exports = function (config_path) {
	var home_dir;
	if (typeof config_path === 'undefined') {
		home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
	}

	var server_data_header = ["Server Name", "Description", "Tags", "Address"];
	var servers = [];

	var files = fs.readdirSync(home_dir + '/.ssh/');
	files.forEach(function (filename) {
		if (filename.indexOf('config') !== 0) {
			return;
		}

		var config_path = home_dir + '/.ssh/' + filename;
		var config = require('./configparse').getConfig(config_path);
		config.map(function(obj){
			if (obj.host.trim().indexOf(' ') !== -1) {
				var hosts = obj.host.split(' ');
				hosts.map(function (host) {
					var newObj = Object.assign(obj, {host: host});
					servers.push(JSON.parse(JSON.stringify(newObj)));
				});
			} else {
				servers.push(obj);
			}
		});
	});

	var server_data = servers.map(function(obj){
		return [
			obj.host,
			("description" in obj) ? obj.description : "",
			("tags" in obj) ? obj.tags : "",
			("hostname" in obj) ? obj.hostname : "",
		]
	});

	return {
		add_entries: function(entries) {
			server_data = server_data.concat(entries);
		},
		get_data: function(search_string) {
			var filtered_server_data = server_data.slice();
			filtered_server_data = filtered_server_data.filter(function(value){
				var return_val = false;
				for( var i = 0; i < 3; i++ ) {
					return_val = return_val || ( value[i].toLowerCase().indexOf(search_string.toLowerCase()) > -1 )
				}
				return return_val;
			});
			filtered_server_data.unshift(server_data_header);
			return filtered_server_data;
		}
	};

};

/**
 * @typedef {Object} module:configdata~configDataResult
 * @property {module:configdata~getDataCallback} get_data - Callback to retrieve filtered data
 */

/**
 * @callback module:configdata~getDataCallback
 * @param {String} [search_string=''] - Search term to filter data with
 * @returns {Array.<Array.<String>>}
 */
