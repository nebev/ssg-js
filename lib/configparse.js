'use strict';

var fs  = require("fs");

/**
 * @module configparse
 */

/**
 * This file will read an ssh config file into memory and attempt to parse it
 * It takes note of specific comments beginning with @description or @tags
 * It exposes a 'config' when done
 */
exports.getConfig = function(filename) {

	// Setup the information we're going to display
	var server_data_obs = [];	//
	var tmp_host = {}, tmp_parts = null, tmp_line = null;

	// Read the file into memory
	var config_file_lines = fs.readFileSync(filename).toString().split('\n');
	for(var i = 0; i < config_file_lines.length; i++) {
		tmp_line = config_file_lines[i].trim();

		if( tmp_line.length > 1 ) {
		
			// Is this a comment we're supposed to take notice of (@description or @tags)
			// Convention is that these must come BEFORE the host
			if( tmp_line.substring(0,1) === '#' ) {
				tmp_line = tmp_line.substring(1).trim();
				if( tmp_line.indexOf("@description") === 0 || tmp_line.indexOf("@tags") === 0 ) {
					if( "host" in tmp_host ) {
						server_data_obs.push(tmp_host);
						tmp_host = {};
					}
					if( tmp_line.indexOf("@description") === 0 ) {
						tmp_host.description = tmp_line.substring(12).trim();
					}
					if( tmp_line.indexOf("@tags") === 0 ) {
						tmp_host.tags = tmp_line.substring(5).trim();
					}
				}
			}else{
			
				// This is an instruction
				tmp_line = tmp_line.replace("=", " ").replace("\t", " ");
				tmp_parts = tmp_line.split(" ");
				if( tmp_parts[0].toLowerCase() == "host" ) {
					if("host" in tmp_host) {
						server_data_obs.push(tmp_host);
						tmp_host = {};
					}
				}
				tmp_host[ tmp_parts[0].toLowerCase() ] = tmp_line.substring( tmp_parts[0].length ).trim();
			}
		}
	}
	return server_data_obs;
};