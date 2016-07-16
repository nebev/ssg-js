'use strict';

var search_string = '';
var selectorOffset = 0;
var aws_list_form = false;
var screenFocus = 'base';
var currentForm = null;

/**
 * @module listeners
 */

/**
 * Gets the current search string
 * @return string
 */
exports.getSearchString = function() {
	return search_string;
};

/**
 * Gets which index in the list is currently selected
 */
exports.getSelectorOffset = function() {
	return selectorOffset;
}

/**
 * Sets AWS List form
 * @param Object awsListForm
 */
exports.setAWSForm = function(awsListForm) {
	aws_list_form = awsListForm;
};


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
		if (screenFocus !== 'base') return;

		// Update the search string
		search_string =  searchField.getContent();
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
		if (screenFocus === 'form') {
			screen.remove(currentForm);
			screen.render();
			screenFocus = 'base';
		}else if (screenFocus === 'base') {
			return process.exit(0);
		}
	});

	// Enter (Run SSH / Display Form)
	screen.key(['enter'], function(ch, key){
		if (screenFocus !== 'base') return;

		var item_index = searchList.selected;
		var hostname = searchList.rows[item_index];
		
		// Bring up an AWS form?
		if (hostname[0].indexOf('A:') === 0) {	// TODO: This is a really shit way of doing this.
			screenFocus = 'form';
			if (aws_list_form) {
				currentForm = aws_list_form.getForm(hostname[0], function(result){

					screen.leave();
					var childArgs = ['-i', result.keyfile, result.connection];
					console.log('');
					console.log('ssh ' + childArgs.join(' '));
					console.log('');
					var child = screen.spawn('/usr/bin/ssh', childArgs);
					child.on('close',function(){
						return process.exit(0);
					});
				});
				screen.append(currentForm);
				screen.render();
			}

		} else {

			// Escaping from Main Screen
			screen.leave();
			console.log("Running: /usr/bin/ssh " + hostname[0]);
			var child = screen.spawn('/usr/bin/ssh',[hostname[0]]);
			child.on('close',function(){
				return process.exit(0);
			});
		}

	});

	// Navigation keys
	screen.key(['right', 'left', 'up', 'down'], function(ch, key){
		if (screenFocus !== 'base') return;

		if( key.name === 'up' ) {
			if (searchList.selected === 1) {
				searchList.select(searchList.items.length);	// Go to the bottom
			}else {
				searchList.up(1);
			}
		}else if( key.name === 'down' ) {
			if (searchList.selected === searchList.items.length-1) {
				searchList.select(1);
			} else {
				searchList.down(1);
			}
		}
		selectorOffset = searchList.selected;
		screen.render();
	});
};