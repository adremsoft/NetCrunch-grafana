/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { adrem } from './adrem/module';
import { CONNECTION_ERROR_MESSAGES, MAX_SAMPLE_COUNT } from './netCrunchAPI.service';

adrem.useWebSocket = false; // disable web socket as it will not work with Grafana proxy
adrem.defaultRequestTimeout = 60 * 1000; // Set longer timeout for requests
adrem.isEmbedded = false;

export {
  adrem,
  CONNECTION_ERROR_MESSAGES,
  MAX_SAMPLE_COUNT
};
