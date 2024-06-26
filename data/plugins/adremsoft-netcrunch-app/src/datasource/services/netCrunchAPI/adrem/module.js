/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

/* global SystemJS */

import angular from 'angular';
import { systemJSDatasourceURL, servicesModule } from '../../../common';
import { NetCrunchCounters, NETCRUNCH_COUNTER_CONST, NETCRUNCH_COUNTER_TYPES } from './counters';
import { AdremWebWorker } from './adremWebWorker';

const
  adremModuleUrl = `${systemJSDatasourceURL}services/netCrunchAPI/adrem/`,
  adremClient = `${adremModuleUrl}client.min.js`,
  remoteDataLists = `${adremModuleUrl}RemoteDataLists.min.js`;

async function importAdremClient() {
  return SystemJS.import(adremClient).then(adrem => SystemJS.import(remoteDataLists).then(() => {
    adrem.useWebSockets = false; // disable web socket as it will not work with Grafana proxy
    adrem.defaultRequestTimeout = 60 * 1000; // Set longer timeout for requests
    adrem.isEmbedded = false;
    return adrem;
  }));
}

// eslint-disable-next-line
const
  adrem = importAdremClient();

angular.module(servicesModule).factory('adrem', () => adrem);

export {
  adrem,
  NetCrunchCounters,
  NETCRUNCH_COUNTER_CONST,
  NETCRUNCH_COUNTER_TYPES,
  AdremWebWorker
};
