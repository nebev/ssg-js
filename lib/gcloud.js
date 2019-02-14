'use strict';
var Promise = require('bluebird');
var commandExists = require('command-exists');
var exec = require('promised-exec');
var flatMap = require('flatmap');
var fs = require('fs');
var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var cacheFile = home_dir + '/.ssh/.ssg-cache-gcloud';

/**
 * Run <gcloud auth login> to authenticate yourself on the command line
 */

/**
 * Process the gcloud JSON to return objects for ssg
 */
var processJson = function(gcloudOut) {
    var parsedJSON = JSON.parse(gcloudOut);
    var clusters = parsedJSON.map(function(cluster){
        return {
            hostname: cluster.name,
            user: '',
            description: cluster.name,
            network: cluster.address
        };
    });

    return flatMap(clusters, function(el){
        return el;
    });
};

/**
 * Get the JSON from Google Cloud through gcloud
 */
var gcloudContainerClustersList = function(projectName, refresh, callback) {
    return exec('gcloud container clusters list --project=' + projectName + ' --format=json').then(function (gcloudOut) {
        try {
            // Write to cache file
            fs.writeFile(cacheFile, gcloudOut, function (err) {
                if (err) return console.log(err);
            });
            if (!refresh) {
                return processJson(gcloudOut);
            }
        } catch (e) {
            return [];
        }
        if (callback) {
            callback();
        }
    });
};

var gcloudProjectsList = function() {
    return exec('gcloud projects list --format=json').then(function (gcloudProjectsOut) {
        try {
            var gcloudProjects = JSON.parse(gcloudProjectsOut);
            var projects = gcloudProjects.map(function (project) {
                if (project.lifecycleState === 'ACTIVE') {
                    return project;
                }
            });
            return flatMap(projects, function(el){
                return el;
            });
        } catch (e) {
            return [];
        }
    });
};

exports.gcloudContainerClustersList = gcloudContainerClustersList;

/**
 * This function uses the gcloud CLI command to get a list of servers in order to further populate the SSG list
 */
exports.getServerList = function() {
    var clusters = [];
    var cmdExistsPromise = Promise.promisify(commandExists);

    return cmdExistsPromise('gcloud').then(function(a){
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
            var projects = gcloudProjectsList();
            projects.forEach(function(project) {
                clusters.concat(gcloudContainerClustersList(project.name, false));
            });
        }
        return a;
    });
};