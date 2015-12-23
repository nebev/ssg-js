# SSG - Secure Shell GUI

## Background
This program shows a pretty GUI for all the SSH server connections found in your SSH config file.
Simply type to filter and use the arrow keys to select. Press enter to open the SSH connection.

## Installation
1. Install using `npm install -g ssg`
2. Run ``ssg`` 
3. Enjoy all your visualised server connections.

## Javascript Usage
```
	var ssg = require('ssg-js');

	// Use the default ~/.ssh/config file
	ssg.run();

	// Or specify a custom config file path
	ssg.run('/path/to/my/ssh/config');
```

## Adding Descriptions and Tags
As SSH config doesn't come with an ability to add a description or tags, you must put in lines similar to the following in order to get the description and tag fields populated.

```
	# @description My awesome description
	# @tags tags separated by some spaces
	Host uniquehostname
		Hostname awesomehost.local
		User ubuntu
```

## Generating Docs

```
	npm run docs
```

# Changelog
### Version 0.1.0 (2015-15-21)
* Initial release
