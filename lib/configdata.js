'use strict';

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
		config_path = home_dir + '/.ssh/config';
	}

	var config = require('./configparse').getConfig(config_path);
	var server_data_header = ["Server Name", "Description", "Tags", "Address"];
	var server_data = config.map(function(obj){
		return [
			obj.host,
			("description" in obj) ? obj.description : "",
			("tags" in obj) ? obj.tags : "",
			("hostname" in obj) ? obj.hostname : "",
		]
	});

	return {
		get_data: function(search_string) {
			var filtered_server_data = server_data.slice();
			filtered_server_data = filtered_server_data.filter(function(value){
				var return_val = false;
				for( var i = 0; i < 4; i++ ) {
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
