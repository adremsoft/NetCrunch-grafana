/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

/* eslint-disable func-names, object-shorthand, prefer-template */

import { NetCrunchNetworkAtlas } from './networkAtlas';

function NetCrunchNetworkData(adremClient, netCrunchConnection) {

  const
    netCrunchServerConnection = netCrunchConnection.serverConnection,
    networkAtlas = new NetCrunchNetworkAtlas(netCrunchServerConnection),
    nodesReady = {},
    networksReady = {},
    sensorsReady = {};

  let remoteDataInitialized = null;

  nodesReady.promise = new Promise(resolve => (nodesReady.resolve = resolve));
  networksReady.promise = new Promise(resolve => (networksReady.resolve = resolve));
  sensorsReady.promise = new Promise(resolve => (sensorsReady.resolve = resolve));

  function openRemoteData(table, query, processFunction, notifyFunction) {
    const
      dataList = new adremClient.RemoteDataListStore('ncSrv', 1000, netCrunchServerConnection),
      self = this;

    return new Promise((resolve) => {
      if (typeof processFunction === 'function') {
        dataList.on('record-changed', (data) => {
          if ((dataList.data != null) && (dataList.data.length > 0)) {
            data.forEach(processFunction, self);
          }
        });
      }

      if (typeof notifyFunction === 'function') {
        dataList.on('changed', () => {
          notifyFunction();
        });
      }

      dataList.open(table, query, () => resolve());
    });
  }

  function processHostsData(nodeRec) {
    networkAtlas.addNode(nodeRec);
  }

  function processMapData(mapRec) {
    networkAtlas.addMap(mapRec);
  }

  function processSensorData(sensorRec) {
    networkAtlas.addSensor(sensorRec);
  }

  return {
    nodes: () => nodesReady.promise,
    networks: () => networksReady.promise,
    sensors: () => sensorsReady.promise,
    atlas: () => Promise
      .all([nodesReady.promise, networksReady.promise, networksReady.promise])
      .then(() => networkAtlas),

    init() {
      const
        self = this,

        PERFORMANCE_VIEWS_NET_INT_ID = 2,
        HOSTS_QUERY = 'SELECT Id, Name, Address, DeviceType, GlobalDataNode, CustomDisplayName',
        NETWORKS_QUERY = `SELECT NetIntId, DisplayName, Nodes, IconId, MapClassTag, ParentId, Children 
                                 WHERE (MapClassTag != 'pnet') && (MapClassTag != 'dependencynet') &&
                                       (MapClassTag != 'issuesnet') && (MapClassTag != 'all') &&
                                       (NetIntId != ${PERFORMANCE_VIEWS_NET_INT_ID})`,
        SENSORS_QUERY = `SELECT NodeId, Name, Status, UId, Alerts, CfgGroup WHERE CfgGroup = 'sensors' || CfgGroup = 'cloud'`;

      let
        hostsData,
        networkData,
        sensorData,
        hostsResolved = false;

      function hostsChanged() {
        nodesReady.resolve(networkAtlas.nodes);
        hostsResolved = true;
        if (typeof self.onNodesChanged === 'function') {
          self.onNodesChanged();
        }
      }

      function networksChanged() {
        networksReady.resolve(networkAtlas.atlasMaps);

        if (typeof self.onNetworksChanged === 'function') {
          self.onNetworksChanged();
        }
      }

      function sensorsChanged() {
        sensorsReady.resolve(networkAtlas.sensors);
        if (hostsResolved && typeof self.onNodesChanged === 'function') {
          self.onNodesChanged();
        }
      }

      if (remoteDataInitialized != null) {
        return remoteDataInitialized;
      }

      // eslint-disable-next-line
      hostsData = openRemoteData('Hosts', HOSTS_QUERY, processHostsData, hostsChanged);

      // eslint-disable-next-line
      networkData = openRemoteData('Networks', NETWORKS_QUERY, processMapData, networksChanged);

      // eslint-disable-next-line
      sensorData = openRemoteData('SensorStatus', SENSORS_QUERY, processSensorData, sensorsChanged);

      remoteDataInitialized = Promise.all([hostsData, networkData, sensorData]);

      return remoteDataInitialized;
    }
  };
}

export {
  NetCrunchNetworkData
};
