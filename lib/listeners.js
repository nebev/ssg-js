'use strict';

/**
 * @module listeners
 */

/**
 * Begin listening to UI elements
 * @param {module:blessed~screen} screen
 * @param {module:blessed~box} searchField
 * @param {module:blessed~listtable} searchList
 * @param {module:configdata~getDataCallback} get_data
 */
exports.listen = function( screen, searchField, searchList, get_data) {
	
	searchList.setData( get_data( "" ) );
	
	// Text Keys (Search)
	var key_array = ['space', 'backspace', "'", "#", 1,2,3,4,5,6,7,8,9,0];
	for(var i=65; i<127; i++) {
		key_array.push( String.fromCharCode(i) );
		key_array.push( "S-" + String.fromCharCode(i) );
	}
	screen.key(key_array, function(ch, key){
	
		// Update the search string
		var search_string =  searchField.getContent();
		if( key.name === 'backspace' ) {
			search_string = search_string.slice(0, -1)
		}else{
			search_string += ch;
		}
		searchField.setContent(search_string);
	
		// Now update the list
		searchList.setData( get_data( search_string ) );
		screen.render();
	});

	// Exit Keys
	screen.key(['escape', 'C-c'], function(ch, key) {
		return process.exit(0);
	});

	// Enter (Run SSH)
	screen.key(['enter'], function(ch, key){
		var item_index = searchList.selected;
		var hostname = searchList.rows[item_index];
		screen.leave();
		console.log("Running: /usr/bin/ssh " + hostname[0]);
		var child = screen.spawn('/usr/bin/ssh',[hostname[0]]);
		child.on('close',function(){
			return process.exit(0);
		});
	});

	// Navigation keys
	screen.key(['right', 'left', 'up', 'down'], function(ch, key){
		if( key.name === 'up' ) {
			searchList.up(1);
		}else if( key.name === 'down' ) {
			searchList.down(1);
		}
		screen.render();
	});
};