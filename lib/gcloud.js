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
var processData = function(clusters, computeEngines) {
    var mappedClusters = clusters.map(function(cluster){
        return {
            hostname: cluster.name + '.elgentos.io',
            user: 'app', // all GCP clusters use Hypernode container, which has app as default user
            description: cluster.projectName + ' / ' + cluster.createTime + ' / ' + cluster.currentNodeVersion,
            network: cluster.endpoint
        };
    });

    var mappedComputeEngines = computeEngines.map(function(computeEngine){
        return {
            hostname: computeEngine.name + 'magento2.elgentos.io',
            user: 'app', // all compute engines use Hypernode container, which has app as default user
            description: computeEngine.projectName + ' / ' + computeEngine.creationTimestamp,
            port: 2222 // Compute Engines uses port 2222 for the inner Hypernode container
        };
    });

    var combined = mappedClusters.concat(mappedComputeEngines);

    return flatMap(combined, function(el){
        return el;
    });
};

/**
 * Get the compute engine JSON from Google Cloud through gcloud
 */
var gcloudComputeEngineList = function(projectId, projectName) {
    let jsonString = child_process.execSync('gcloud compute engine list --project=' + projectId + ' --format=json').toString();
    // Add name to computeEngine object to show in list
    return JSON.parse(jsonString).map(function (computeEngine) {
        computeEngine.projectName = projectName;
        return computeEngine;
    });
};

/**
 * Get the container clusters JSON from Google Cloud through gcloud
 */
var gcloudContainerClustersList = function(projectId, projectName) {
    let jsonString = child_process.execSync('gcloud container clusters list --project=' + projectId + ' --format=json').toString();
    // Add name to cluster object to show in list
    return JSON.parse(jsonString).map(function (cluster) {
        cluster.projectName = projectName;
        return cluster;
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
    var clusters = [];
    var computeEngines = [];
    var projects = gcloudProjectsList(); // production
    //var projects = [{projectId: 'bus-totaal', name: 'Bus Totaal'}, {projectId: 'dutchlabelshop', name: 'Dutchlabelshop'}]; // testing
    projects.forEach(function(project) {
        let clustersList = gcloudContainerClustersList(project.projectId, project.name);
        let computeEngineList = gcloudComputeEngineList(project.projectId, project.name);
        clusters = clusters.concat(clustersList);
        computeEngines = clusters.concat(computeEngineList);
    });

    var json = JSON.stringify(processData(clusters, computeEngines));

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

    return cmdExistsPromise('gcloud').then(function(a){
        if (fs.existsSync(cacheFile)) {
            var stats = fs.statSync(cacheFile);
            var mtime = new Date(stats.mtime);
            var yesterday = (function(d){ d.setDate(d.getDate()-7); return d})(new Date)

            // If cache file is newer than yesterday
            if (mtime > yesterday) {
                return JSON.parse(fs.readFileSync(cacheFile));
            }
        }

        if(a === true) {
            return refreshCache();
        }
        return a;
    });
};
