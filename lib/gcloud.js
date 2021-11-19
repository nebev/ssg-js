'use strict';
var Promise = require('bluebird');
var commandExists = require('command-exists');
var exec = require('promised-exec');
var flatMap = require('flatmap');
var fs = require('fs');
var child_process = require('child_process');
var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var cacheFile = home_dir + '/.ssh/.ssg-cache-gcloud';

/**
 * Run <gcloud auth login> to authenticate yourself on the command line
 */

/**
 * Process the gcloud JSON to return objects for ssg
 */
var processData = function(computeInstances) {
    var mappedComputeInstances = computeInstances.map(function(computeInstance){
        fs.writeFile('computeInstance.json', JSON.stringify(computeInstance), function (err) {
            if (err) return console.log(err);
        });
        return {
            hostname: computeInstance.hostname ?? 'Unknown - no hostname metadata set',
            user: 'app',
            description: computeInstance.projectName + ' / ' + computeInstance.creationTimestamp,
            network: computeInstance.hostname ?? '',
            port: computeInstance.type === 'cluster' ? "22" : "2222"
        };
    });

    return flatMap(mappedComputeInstances, function(el){
        return el;
    });
};

/**
 * Get the compute instance JSON from Google Cloud through gcloud
 */
var gcloudComputeInstanceList = function(projectId, projectName) {
    let jsonString = '[]';
    try {
        jsonString = child_process.execSync('gcloud compute instances list --project=' + projectId + ' --format=json').toString();
    } catch (error) {
	    jsonString = '[]';
    }
    // Fetch hostname from metadata
    return JSON.parse(jsonString).map(function (computeInstance) {
        let metadata = computeInstance?.metadata?.items;
        if (Array.isArray(metadata)) {
            metadata.forEach(function (metadata) {
                if (metadata.key === 'hostname') {
                    computeInstance.hostname = metadata.value;
                    computeInstance.type = 'compute-instance';
                }
                if (metadata.key === 'cluster-name') {
                    computeInstance.hostname = metadata.value + '.elgentos.io';
                    computeInstance.type = 'cluster';
                }
            });
        }
        computeInstance.projectName = projectName;
        computeInstance.projectId = projectId;
        return computeInstance;
    });
};

var gcloudProjectsList = function() {
    var gcloudProjectsOut = child_process.execSync('gcloud projects list --format=json').toString();

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
};

var refreshCache = function (callback) {
    var computeInstances = [];
    var projects = gcloudProjectsList();
    projects.forEach(function(project) {
        let computeInstanceList = gcloudComputeInstanceList(project.projectId, project.name);
        computeInstances = computeInstances.concat(computeInstanceList);
    });

    var json = JSON.stringify(processData(computeInstances));

    // Write to cache file
    fs.writeFile(cacheFile, json, function (err) {
        if (err) return console.log(err);
    });

    if (callback) {
        callback();
    } else {
        return json;
    }
}

exports.refreshCache = refreshCache;

/**
 * This function uses the gcloud CLI command to get a list of servers in order to further populate the SSG list
 */
exports.getServerList = function() {
    var cmdExistsPromise = Promise.promisify(commandExists);

    return cmdExistsPromise('gcloud').then(function(gcloudExists){
        if (fs.existsSync(cacheFile)) {
            var stats = fs.statSync(cacheFile);
            var mtime = new Date(stats.mtime);
            var yesterday = (function(d){ d.setDate(d.getDate()-7); return d})(new Date)

            // If cache file is newer than yesterday
            if (mtime > yesterday) {
                return JSON.parse(fs.readFileSync(cacheFile));
            }
        }

        if(gcloudExists === true) {
            return refreshCache();
        }
        return gcloudExists;
    });
};
