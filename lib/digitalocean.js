'use strict';
var Promise = require('bluebird');
var commandExists = require('command-exists');
var exec = require('promised-exec');
var flatMap = require('flatmap');

/**
 * This function uses the doctl CLI comman to get a list of servers in order to further populate the SSG list
 */
exports.getServerList = function() {
    var cmdExistsPromise = Promise.promisify(commandExists);

    return cmdExistsPromise('dev doctl').then(function(a){
        if(a === true) {
            return exec('dev doctl compute droplet list --output=json').then(function(doctlOut){
                try {
                    var parsedJSON = JSON.parse(doctlOut);
                    var droplets = parsedJSON.map(function(droplet){
                        return {
                            hostname: droplet.networks.v4[0].ip_address,
                            description: droplet.name,
                            tags: '',
                            type: 'digitalocean',
                            keyName: droplet.name
                        };
                    });

                    return flatMap(droplets, function(el){
                        return el;
                    });
                } catch (e) {
                    return [];
                }
            });
        }
        return a;
    });
};