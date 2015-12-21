var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var config = require('./configparse').getConfig( home_dir + '/.ssh/config' );
var server_data_header = ["Server Name", "Description", "Tags", "Address"];
var server_data = config.map(function(obj){
	return [
		obj.host,
		("description" in obj) ? obj.description : "",
		("tags" in obj) ? obj.tags : "",
		("hostname" in obj) ? obj.hostname : "",
	]
});

exports.get_data = function(search_string) {
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
};