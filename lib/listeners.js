'use strict';

var search_string = '';
var selectorOffset = 0;
var aws_list_form = false;
var do_list_form = false;
var screenFocus = 'base';
var currentForm = null;
var blessed = require('blessed');
var Promise = require('bluebird');
var digitalocean = require('./digitalocean');
var gcloud = require('./gcloud');

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
 * Sets DO List form
 * @param Object doListForm
 */
exports.setDOForm = function(doListForm) {
	do_list_form = doListForm;
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

	// Refresh DigitalOcean cache
	screen.key(['C-d'], function(ch, key) {
		if (screenFocus !== 'base') return;

		var box = blessed.box({
			top: 'center',
			left: 'center',
			width: '30%',
			height: '10%',
			content: 'Please wait. ssg will close when refreshing finishes.',
			tags: true,
			border: {
				type: 'line'
			},
			style: {
				fg: 'white',
				bg: 'blue',
			}
		});

		screen.append(box);
		screen.render();

		setTimeout(function () {
			digitalocean.refreshCache(function () {
				screen.leave();
				setTimeout(function () {
					console.log('Refreshing finished.');
					return process.exit(0);
				}, 500);
			});
		}, 500);
	});

	// Refresh DigitalOcean cache
	screen.key(['C-g'], function(ch, key) {
		if (screenFocus !== 'base') return;

		var gcpBox = blessed.box({
			top: 'center',
			left: 'center',
			width: '30%',
			height: '10%',
			content: 'Please wait. ssg will close when refreshing finishes.',
			tags: true,
			border: {
				type: 'line'
			},
			style: {
				fg: 'white',
				bg: 'blue',
			}
		});

		screen.append(gcpBox);
		screen.render();

		setTimeout(function () {
			gcloud.refreshCache(function () {
				setTimeout(function () {
					screen.leave();
					console.log('Refreshing finished.');
					return process.exit(0);
				}, 500);
			});
		}, 500);
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
					var child = screen.spawn('/usr/bin/ssh', childArgs);
					child.on('close',function(){
						return process.exit(0);
					});
				});
				screen.append(currentForm);
				screen.render();
			}
		} else if (hostname[0].indexOf('DO:') === 0 && do_list_form) { // DigitalOcean form for username
			screenFocus = 'form';
			currentForm = do_list_form.getForm(hostname[0], function(result){
				screen.leave();
				var child = screen.spawn('/usr/bin/ssh',[result.username + '@' + hostname[3],'-p',hostname[4]]);
				child.on('close',function(){
					return process.exit(0);
				});
			});
			screen.append(currentForm);
			screen.render();
		} else {
			// Escaping from Main Screen
			screen.leave();
			var child = screen.spawn('/usr/bin/ssh',[hostname[1] + '@' + hostname[3],'-p',hostname[4]]);
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
