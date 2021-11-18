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
var processData = function(clusters, computeInstances) {
    var mappedClusters = clusters.map(function(cluster){
        return {
            hostname: cluster.name + '.elgentos.io',
            user: 'app', // all GCP clusters use Hypernode container, which has app as default user
            description: cluster.projectName + ' / ' + cluster.createTime + ' / ' + cluster.currentNodeVersion,
            network: cluster.endpoint
        };
    });

    var mappedComputeInstances = computeInstances.map(function(computeInstance){
        return {
            hostname: computeInstance.name + 'magento2.elgentos.io',
            user: 'app', // all compute instances use Hypernode container, which has app as default user
            description: computeInstance.projectName + ' / ' + computeInstance.creationTimestamp,
            port: 2222 // Compute instances uses port 2222 for the inner Hypernode container
        };
    });

    var combined = mappedClusters.concat(mappedComputeInstances);

    return flatMap(combined, function(el){
        return el;
    });
};

/**
 * Get the compute instance JSON from Google Cloud through gcloud
 */
var gcloudComputeInstanceList = function(projectId, projectName) {
    let jsonString = child_process.execSync('gcloud compute instances list --project=' + projectId + ' --format=json').toString();
    // Add name to computeInstance object to show in list
    return JSON.parse(jsonString).map(function (computeInstance) {
        computeInstance.projectName = projectName;
        return computeInstance;
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
    var computeInstances = [];
    var projects = gcloudProjectsList(); // production
    //var projects = [{projectId: 'bus-totaal', name: 'Bus Totaal'}, {projectId: 'dutchlabelshop', name: 'Dutchlabelshop'}]; // testing
    projects.forEach(function(project) {
        let clustersList = gcloudContainerClustersList(project.projectId, project.name);
        let computeInstanceList = gcloudComputeInstanceList(project.projectId, project.name);
        clusters = clusters.concat(clustersList);
        computeInstances = clusters.concat(computeInstanceList);
    });

    var json = JSON.stringify(processData(clusters, computeInstances));

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
