'use strict';
var Promise = require('bluebird');
var commandExists = require('command-exists');
var exec = require('promised-exec');
var flatMap = require('flatmap');
var fs = require('fs');
var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var cacheFile = home_dir + '/.ssh/.ssg-cache-digitalocean';

/**
 * Process the DigitalOcean JSON to return objects for ssg
  */
var processJson = function(doctlOut) {
    var parsedJSON = JSON.parse(doctlOut);
    var droplets = parsedJSON.map(function(droplet){
        return {
            hostname: droplet.networks.v4[0].ip_address,
            user: '',
            description: droplet.name,
            network: droplet.networks.v4[0].ip_address
        };
    });

    return flatMap(droplets, function(el){
        return el;
    });
};

/**
 * Get the JSON from DigitalOcean through doctl
 */
var doctlComputeDropletList = function(callback) {
    return exec('dev doctl compute droplet list --output=json').then(function (doctlOut) {
        try {
            // Write to cache file
            fs.writeFile(cacheFile, doctlOut, function (err) {
                if (err) return console.log(err);
            });
            if (!callback) {
                return processJson(doctlOut);
            }
        } catch (e) {
            return [];
        }
        callback();
    });
};

var refreshCache = function (callback) {
    doctlComputeDropletList(callback);
}

exports.refreshCache = refreshCache;

/**
 * This function uses the doctl CLI command to get a list of servers in order to further populate the SSG list
 */
exports.getServerList = function() {
    var cmdExistsPromise = Promise.promisify(commandExists);

    return cmdExistsPromise('dev doctl').then(function(a){
        if (fs.existsSync(cacheFile)) {
            var stats = fs.statSync(cacheFile);
            var mtime = new Date(stats.mtime);
            var yesterday = (function(d){ d.setDate(d.getDate()-1); return d})(new Date)

            // If cache file is newer than yesterday
            if (mtime > yesterday) {
                return processJson(fs.readFileSync(cacheFile));
            }
        }

        if(a === true) {
            return doctlComputeDropletList();
        }
        return a;
    });
};