/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

/* eslint-disable no-param-reassign */

const
  C_PERSEC = '/sec',
  CNT_SEPARATOR = '|',
  CNT_SRC_SEPARATOR = '&',
  MIB_CNT_SRC_ID = 'MIB',
  XML_CNT_SRC_ID = 'XML',
  SENSOR_CNT_SRC_ID = 'SENSOR',

  DYNAMIC_INSTANCE = '*',
  DYNAMIC_INSTANCE_SELECTOR = `${DYNAMIC_INSTANCE}{`,

  // Overall counter instances
  OVERALL_TOTAL = '_Total',
  OVERALL_MAXIMUM = '_Maximum',
  OVERALL_MINIMUM = '_Minimum',
  OVERALL_AVERAGE = '_Average',
  OVERALL_COUNT = '_Count',
  knownMSCounters = ['load time', 'check time', 'round trip time'],

  NETCRUNCH_COUNTER_CONST = {
    CNT_TYPE: {
      cstXML: 1,
      cstMIB: 2,
      cstSimple: 3,
      cstSensor: 4
    },

    SNMP_INSTANCE_TYPE: {
      sitValue: 1,
      sitNone: 2,
      sitByIndex: 3,
      sitByLookup: 4,
      sitComputable: 5
    },

    SNMP_FUNC: {
      scfUnknown: 1,
      scfSum: 2,
      scfMin: 3,
      scfMax: 4,
      scfAvg: 5,
      scfCount: 6
    }
  },

  NETCRUNCH_COUNTER_TYPES = {
    percentage: '%',
    milliseconds: 'ms',
    bytesBitsPS: 'bps',
    bytesBps: 'Bps',
    bytes: 'bytes',
    seconds: 's'
  };

function NetCrunchCounters(adremClient, netCrunchConnection) {

  const snmpMibData = {
      getFullOidPath(oid) {
        return new Promise((resolve) => {
          netCrunchConnection.ncSrv.IRemoteSNMPMIBData.GetFullOIDPath(oid, resolve, () => resolve(''));
        });
      },
      getShortOidPath(oid) {
        return new Promise((resolve) => {
          netCrunchConnection.ncSrv.IRemoteSNMPMIBData.GetShortOIDPath(oid, resolve, () => resolve(''));
        });
      }
    },
    shortOidPathsCache = new Map(),
    fullOidPathsCache = new Map(),
    moduleRes = {
      'metrics': {
        'bytes': 'bytes',
        'mbytes': 'mbytes',
        'kbytes': 'kbytes',
        'memory': 'memory'
      },
      'allInstances': '[All Instances]',
      'filteredInstance': '[Filtered Instances]',
      'filter': {
        'startsWith': 'Starts with',
        'notStartsWith': 'Doesn\'t start with',
        'notContains': 'Doesn\'t contain',
        'contains': 'Contains',
        'regEx': 'Match'
      }
    };

  function isOid(string) {
    if (string.indexOf(C_PERSEC) >= 0) {
      string = string.replace(C_PERSEC, '');
    }
    return (string.match(/^((([0-9]+)\.)+[0-9]+)$/) != null);
  }

  function isMIBCnt(obj, cnt) {
    return (((isOid(obj) === true) && ((cnt === '') || (isOid(cnt) === true))) ||
      ((obj === '') && (isOid(cnt) === true)));
  }

  function counterPathObject(counter, counterType) {
    if (counterType !== NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstSimple) {
      if (counterType === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstXML) {
        return XML_CNT_SRC_ID + CNT_SRC_SEPARATOR + counter;
      }
      if (counterType === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstMIB) {
        return MIB_CNT_SRC_ID + CNT_SRC_SEPARATOR + counter;
      }
    }
    return counter;
  }

  function stringToCntType(type) {
    if (type === MIB_CNT_SRC_ID) {
      return NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstMIB;
    } else if (type === SENSOR_CNT_SRC_ID) {
      return NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstSensor;
    }
    return NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstXML;
  }

  function getCounterPathType(counterPath) {
    let pathType = NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstSimple;

    if (counterPath.indexOf(CNT_SRC_SEPARATOR) > 0) {
      pathType = stringToCntType(counterPath.split(CNT_SRC_SEPARATOR)[0]);
    } else {
      const [obj, cnt = ''] = counterPath.split(CNT_SEPARATOR);
      if (isMIBCnt(obj, cnt)) {
        pathType = NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstMIB;
      }
    }
    return pathType;
  }

  function isSensorCnt(path) {
    return getCounterPathType(path) === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstSensor;
  }

  function removeCounterPathType(counterPath) {
    let resultPath = counterPath;

    if (counterPath.indexOf(CNT_SRC_SEPARATOR) > 0) {
      resultPath = counterPath.split(CNT_SRC_SEPARATOR)[1];
    }

    return resultPath;
  }

  function removePerSecond(string) {
    return string.replace(C_PERSEC, '');
  }

  function parseSNMPPath(snmpPath) {
    let objectType,
      objectValue,
      snmpPathParts;

    if (snmpPath.indexOf(CNT_SRC_SEPARATOR) < 0) {
      objectType = getCounterPathType(snmpPath);
      objectValue = snmpPath;
    } else {
      snmpPathParts = snmpPath.split(CNT_SRC_SEPARATOR);
      objectType = stringToCntType(snmpPathParts[0]);
      objectValue = snmpPathParts[1];
    }

    return {
      type: objectType,
      value: objectValue
    };
  }

  function displayStringToSnmpFunc(string) {
    let result = NETCRUNCH_COUNTER_CONST.SNMP_FUNC.scfUnknown;
    const functionMap = {};

    functionMap[OVERALL_TOTAL] = NETCRUNCH_COUNTER_CONST.SNMP_FUNC.scfSum;
    functionMap[OVERALL_AVERAGE] = NETCRUNCH_COUNTER_CONST.SNMP_FUNC.scfAvg;
    functionMap[OVERALL_MAXIMUM] = NETCRUNCH_COUNTER_CONST.SNMP_FUNC.scfMax;
    functionMap[OVERALL_MINIMUM] = NETCRUNCH_COUNTER_CONST.SNMP_FUNC.scfMin;
    functionMap[OVERALL_COUNT] = NETCRUNCH_COUNTER_CONST.SNMP_FUNC.scfCount;

    if (functionMap[string] != null) {
      result = functionMap[string];
    }
    return result;
  }

  function decodePath(path) {
    const
      parts = (path || '').split(CNT_SEPARATOR),
      result = {};

    result.obj = parts[0];
    result.cnt = parts.length > 1 ? parts[1] : '';
    if (parts.length === 3) {
      result.inst = parts[2];
    } else if (parts.length > 3) {
      result.inst = parts.slice(2).join(CNT_SEPARATOR);
    } else {
      result.inst = '';
    }
    return result;
  }

  function parseShortPath(counterPath) {
    return decodePath(counterPath);
  }

  function parseOIDPath(oidPath) {
    const
      decodedPath = parseShortPath(oidPath),
      instOID = decodedPath.obj,
      isPerSec = (decodedPath.cnt.indexOf(C_PERSEC) >= 0);

    let
      inst = decodedPath.inst,
      objOID = decodedPath.cnt,
      instType,
      decodedObjOID;


    if (isPerSec === true) {
      objOID = objOID.replace(C_PERSEC, '');
    }

    if ((inst === '') || (inst === '-')) {
      decodedObjOID = objOID.match(/(.*)\.([0-9]+)$/);
      if (decodedObjOID.length > 1) {
        objOID = decodedObjOID[1];
        inst = decodedObjOID[2];
      }

      if (inst === '0') {
        instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitNone;
      } else {
        instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitByIndex;
      }
    } else if (inst.charAt(0) === '#') {
      inst = inst.substr(1);
      instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitByIndex;
    } else if ((inst.charAt(0) === '_') &&
      (displayStringToSnmpFunc(inst) !== NETCRUNCH_COUNTER_CONST.SNMP_FUNC.scfUnknown)) {
      instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitComputable;
    } else {
      instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitByLookup;
    }

    return {
      objOID,
      instOID,
      inst,
      type: instType,
      isPerSec
    };
  }

  function parseXMLPath(xmlPath, hasInstance) {
    const
      decodedPath = parseShortPath(xmlPath);
    let
      inst = decodedPath.inst,
      instType;

    if (hasInstance === true) {
      instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitByLookup;

      if (inst !== '') {
        if (inst.charAt(0) === '#') {
          inst = inst.substr(1);
          instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitByIndex;
        } else if (inst.charAt(0) === '_') {
          instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitComputable;
        }
      } else if ((inst === '') || (inst === '-')) {
        instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitNone;
      } else {
        instType = NETCRUNCH_COUNTER_CONST.SNMP_INSTANCE_TYPE.sitByLookup;
      }

      decodedPath.inst = inst;
      decodedPath.type = instType;
    }

    return decodedPath;
  }

  function parseCounterPath(counterPath) {
    let
      parsedCounterPath;
    const
      counterPathType = getCounterPathType(counterPath);

    if (counterPathType === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstXML) {
      parsedCounterPath = parseXMLPath(counterPath, true);
    } else if (counterPathType === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstMIB) {
      parsedCounterPath = parseOIDPath(removeCounterPathType(counterPath));
      parsedCounterPath.obj = parsedCounterPath.objOID;
      parsedCounterPath.cnt = '';
      if (parsedCounterPath.inst === '') {
        parsedCounterPath.inst = parsedCounterPath.instOID;
      }
    } else if (counterPathType === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstSimple) {
      parsedCounterPath = parseShortPath(counterPath);
    }

    return parsedCounterPath;
  }

  function getOidPath(oid, oidCache, getOidFunc) {
    let oidPath = oidCache.get(oid);
    if (oidPath == null) {
      oidPath = oid;
      oidCache.set(oid, oidPath);
    }

    if (oidPath === oid) {
      return getOidFunc(oid, (_oidPath) => {
        oidCache.set(oid, _oidPath);
        return _oidPath;
      });
    }
    return Promise.resolve(oidPath);
  }

  function getShortOidPath(oid) {
    return getOidPath(oid, shortOidPathsCache, _oid => snmpMibData.getShortOidPath(_oid));
  }

  function getFullOidPath(oid) {
    return getOidPath(oid, fullOidPathsCache, _oid => snmpMibData.getFullOidPath(_oid));
  }

  function encodePath(parts) {
    const p = [parts.obj, parts.cnt];
    if (parts.inst !== '') {
      p.push(parts.inst);
    }
    return p.join(CNT_SEPARATOR);
  }

  function decodeDisplayPath(displayPath) {
    const result = {
      obj: '', cnt: '', inst: ''
    };
    let objParts, ix, perSec;

    ix = displayPath.indexOf(C_PERSEC);
    perSec = (ix >= 0);
    if (perSec) {
      displayPath = displayPath.substr(0, ix);
    }

    if (![
      {fmt: new RegExp('(.+)\\((.+)\\)\\\\(.+)'), parts: ['obj', 'inst', 'cnt']},// obj(inst)\cnt
      {fmt: new RegExp('(.+)\\\\(.+)'), parts: ['obj', 'cnt']}, // obj\cnt
      {fmt: new RegExp('(.+)\\((.+)\\)'), parts: ['obj', 'inst']} // obj(inst)
    ].some((s) => { //eslint-disable-line
      const parts = displayPath.match(s.fmt);
      if (parts != null) {
        s.parts.forEach((p, _ix) => result[p] = parts[_ix + 1]);
        return true;
      }
      return false;
    })) {
      // formats do not match
      result.obj = displayPath;
    }
    // Fix SNMP column path
    if (result.cnt === '' && result.obj !== '') {
      if (result.obj.includes('(')) {
        ix = displayPath.indexOf('(');
        result.obj = displayPath.substr(0, ix);
        result.inst = displayPath.substr(ix + 1);
      }
      if (result.obj.match('^[0-9\\.]+(\\.[0-9]+)$')) {
        result.cnt = '';
        if (result.inst !== '') {
          result.obj = result.obj + '.' + result.inst;
          result.inst = '';
        }
      } else if (result.obj.indexOf('.') >= 0) {
        objParts = result.obj.split('.');
        result.cnt = objParts[1];
        result.obj = objParts[0];
      } else {
        result.cnt = result.obj;
        result.obj = '';
      }
    }
    result.perSec = perSec;
    if (perSec) {
      result.cnt = result.cnt + C_PERSEC;
    }
    return result;
  }

  function removePerSec(displayName) {
    const ix = displayName.indexOf(C_PERSEC);
    //todo: check if ix == displayName.length - C_PERSEC.length
    return displayName.substr(0, ix);
  }

  function encodeDisplayPath(parts, withPerSec) {
    let result = parts.obj, ix;
    withPerSec = (withPerSec == null) ? true : withPerSec;

    if (parts.inst !== '' && parts.inst != null) {
      result = parts.obj + '(' + parts.inst + ')';
    }

    if (parts.cnt !== '' && parts.cnt != null) {
      if (!withPerSec && parts.perSec) { // remove /sec from counter name
        ix = parts.cnt.indexOf(C_PERSEC);
        result = result + '\\' + parts.cnt.substr(0, ix);
      } else {
        result = result + '\\' + parts.cnt;
      }
    }
    return result;
  }

  function isDynamicInstance(inst) {
    return inst === DYNAMIC_INSTANCE || inst.startsWith(DYNAMIC_INSTANCE_SELECTOR);
  }

  function counterInstanceToDisplay(inst) {
    const parts = inst.split('(');
    let isDynamic = isDynamicInstance(inst);
    if (!isDynamic && parts.length > 1) { // it can be aggregated instance
      isDynamic = isDynamicInstance(parts[1]);
      if (isDynamic) {
        inst = parts.slice(1).join('(');
        if (inst.endsWith(')')) {
          inst = inst.slice(0, -1);
        }
      }
    }
    if (isDynamic) {
      if (inst === DYNAMIC_INSTANCE) {
        inst = moduleRes.allInstances;
      } else if (inst.startsWith(DYNAMIC_INSTANCE_SELECTOR)) {
        let filter;
        try {
          filter = JSON.parse(inst.substr(1));
        } catch (e) {
          // this is not valid selector, do nothing
        }
        if (filter != null) {
          if (filter.all) {
            inst = moduleRes.allInstances;
          } else if (filter.selector != null) {
            const
              {kind, pattern} = filter.selector,
              dispKind = moduleRes.filter[kind] || kind;
            inst = `[${dispKind}: ${pattern}]`;
          }
        }
      }
      if (parts.length > 1) {
        inst = parts[0] + inst;
      }
    }
    return inst;
  }

  function counterToString(counterPath) {
    const decodedCounter = decodePath(counterPath);
    decodedCounter.inst = counterInstanceToDisplay(decodedCounter.inst);
    return encodeDisplayPath(decodedCounter, true);
  }

  function makeShortPath(object, counter, instance) {
    if (instance === '') {
      return object + CNT_SEPARATOR + counter;
    } else {
      return object + CNT_SEPARATOR + counter + CNT_SEPARATOR + instance;
    }
  }

  function getSNMPDisplayPath(counterPath, shortPath, showPerSecondValue) {
    let snmpPath,
      oidPath,
      displayPath = Promise.resolve(null);

    snmpPath = parseSNMPPath(counterPath);
    if (snmpPath.type === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstXML) {
      displayPath = Promise.resolve(counterToString(snmpPath.value));
    } else {
      if (snmpPath.type === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstMIB) {
        oidPath = parseOIDPath(counterPath);
        if (shortPath === true) {
          displayPath = getShortOidPath(oidPath.objOID);
        } else {
          displayPath = getFullOidPath(oidPath.objOID);
        }

        return displayPath.then((resolvedPath) => {
          if ((resolvedPath == null) || (resolvedPath === '')) {
            resolvedPath = oidPath.objOID;
          }
          if (oidPath.inst === '0') {
            oidPath.inst = '';
          }

          resolvedPath = counterToString(makeShortPath(resolvedPath, '', oidPath.inst));

          if ((showPerSecondValue === true) && (oidPath.isPerSec === true)) {
            resolvedPath = resolvedPath + C_PERSEC;
          }
          return resolvedPath;
        });
      }
    }

    return displayPath;
  }

  /**
   *
   * @param counterPath
   * @param shortPath
   * @param showPerSecValue
   * @return {*}
   */
  function counterPathToDisplayStr(counterPath, shortPath = true, showPerSecValue = true) {
    const pathType = getCounterPathType(counterPath);

    if ((pathType === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstXML) ||
      (pathType === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstMIB)) {
      return getSNMPDisplayPath(counterPath, shortPath, showPerSecValue);
    } else if (pathType === NETCRUNCH_COUNTER_CONST.CNT_TYPE.cstSimple) {
      return Promise.resolve(counterToString(removeCounterPathType(counterPath)));
    } else {
      return Promise.resolve(counterToString(counterPath));
    }
  }

  function isKnownMillisecondCounter(cnt) {
    return knownMSCounters.indexOf(cnt.toLowerCase()) >= 0;
  }

  /**
   * isMillisecondsCounter(
   * @param counter
   * @returns {boolean}
   */
  function isMillisecondsCounter(counter) {
    const
      c = decodePath(counter),
      cnt = c.cnt.toUpperCase();
    return !cnt.includes('%') && (c.cnt.endsWith('Time')
      || cnt.includes('(MS)')
      || cnt.includes('MILLISECOND')
      || isKnownMillisecondCounter(c.cnt)) && c.obj !== 'Global';
  }

  /**
   * isBytesCounter
   * @param displayName
   * @returns {null|''|'M'|'K'}
   */
  function isBytesCounter(displayName) {
    let result = '', cnt = displayName.toLowerCase();

    if (cnt.includes(moduleRes.metrics.bytes)
      || cnt.includes(moduleRes.metrics.memory)
      || cnt.includes('octet') || displayName.includes('MB')
      || displayName.includes('KB')) {
      if (cnt.includes(moduleRes.metrics.mbytes) || cnt.includes('mega') || displayName.includes('MB')) {
        result = 'M';
      } else if (cnt.includes(moduleRes.metrics.kbytes) || cnt.includes('kilo') || displayName.includes('KB')) {
        result = 'K';
      }
      return result;
    } else {
      return null;
    }
  }

  function getValueFormatting(value, base1, base, units) {
    let range = '';
    units = units || ['K', 'M', 'G', 'T'];
    if (value >= 1 * base1 && value < base1 * base) {
      value = value / base1;
      range = units[0];
    } else if (value >= base1 * base && value < base1 * base * base) {
      value = value / base1 / base;
      range = units[1];
    } else if (value >= base1 * base * base && value < base1 * base * base * base) {
      value = value / base1 / base / base;
      range = units[2];
    } else if (value >= base1 * base * base * base) {
      value = value / base1 / base / base / base;
      range = units[3];
    }
    return {
      value: value,
      units: range
    };
  }

  function getValueRange(value, kilo) {
    return getValueFormatting(value, kilo, kilo);
  }

  function getTimeRange(value) {
    if (value > 86400000) {
      return {
        value: value / 86400000,
        units: 'days'
      };
    } else {
      return getValueFormatting(value, 1000, 60, ['sec', 'min', 'hrs']);
    }
  }

  return {
    unitsToMetric(units, counterName, counterDisplayName) {
      if (units === 'bytestobps') {
        return 'bps';
      } else if (units === 'percentage') {
        return '%';
      } else if (units === 'bytesps') {
        return 'Bps';
      } else if (units === 'bytes') {
        return 'bytes';
      } else if (units === 'ms') {
        return 'ms';
      } else if (units === 's') {
        return 's';
      } else {
        return this.getMetric(counterName, counterDisplayName) || units;
      }
    },

    /**
     * Get Metric for Counter
     * @param counterPath
     * @param displayName
     * @returns {*}
     */
    getMetric(counterPath, displayName = '') {
      if (displayName.includes('%')) {
        return NETCRUNCH_COUNTER_TYPES.percentage;
      } else {
        if (isMillisecondsCounter(counterPath)) {
          return NETCRUNCH_COUNTER_TYPES.milliseconds;
        } else {
          let multiplier = isBytesCounter(displayName);
          if (multiplier != null) {
            if (multiplier !== '') {
              multiplier = '#' + multiplier;
            }
            if (displayName.includes(C_PERSEC) || displayName.includes('per sec.')) { //ESX counters are 'per sec.'
              return NETCRUNCH_COUNTER_TYPES.bytesBitsPS + multiplier;
            } else {
              return NETCRUNCH_COUNTER_TYPES.bytes + multiplier;
            }
          } else {
            return '';
          }
        }
      }
    },

    getMultiplierValue(code, isBytes) {
      if (code === 'M') {
        return isBytes ? 1048576 : 1000000;
      }
      if (code === 'K') {
        return isBytes ? 1024 : 1000;
      }
    },

    getDisplayValue(value, metric) {
      const
        mparts = metric.split('#'), m = mparts[0],
        multiplier = mparts.length > 1 ? mparts[1] : '',
        isBPS = (m === NETCRUNCH_COUNTER_TYPES.bytesBitsPS),
        isBytes = (m === NETCRUNCH_COUNTER_TYPES.bytes) || isBPS || (m === NETCRUNCH_COUNTER_TYPES.bytesBps),
        mvalue = this.getMultiplierValue(multiplier, isBytes),
        isSec = (m === NETCRUNCH_COUNTER_TYPES.seconds),
        isNoUnits = (m === '');

      if (value == null || isNaN(value)) {
        return {value: value, units: ''};
      } else {
        if (isBPS) {
          value = value * 8;
        }
        if (multiplier !== '') {
          if (mvalue != null) {
            value *= mvalue;
          } else {
            return {
              value: Math.round(value * 100) / 100,
              units: multiplier + (isBytes ? 'B' : '')
            };
          }
        }
        let v;
        if (isBytes) {
          v = getValueRange(value, 1024);
          if (m === NETCRUNCH_COUNTER_TYPES.bytes) {
            v.units = v.units + 'B';
          } else {
            v.units = v.units + m;
          }
          v.value = Math.round(v.value * 100) / 100;

        } else if (isNoUnits) {
          v = getValueRange(value, 1000);
        } else if (m === NETCRUNCH_COUNTER_TYPES.milliseconds || isSec) {
          v = getTimeRange((isSec) ? value * 1000 : value);
          if (v.units === '') {
            v.units = (isSec) ? NETCRUNCH_COUNTER_TYPES.seconds : NETCRUNCH_COUNTER_TYPES.milliseconds;
          }
        } else {
          return {
            value,
            units: m
          };
        }
        return {
          value: v.value,
          units: v.units
        };
      }
    },

    getDisplayValueStr(value, metric) {
      const dv = this.getDisplayValue(value, metric);
      return dv.value + dv.units;
    },

    isOid,
    isMIBCnt,
    isSensorCnt,
    counterPathObject,
    stringToCntType,
    getCounterPathType,
    removeCounterPathType,
    removePerSecond,
    parseSNMPPath,
    parseOIDPath,
    parseXMLPath,
    parseCounterPath,
    getShortOidPath,
    getFullOidPath,
    decodePath,
    encodePath,
    addInstance: (path, inst) => inst !== '' ? path + CNT_SEPARATOR + inst : path,
    decodeDisplayPath,
    encodeDisplayPath,
    removePerSec,
    getSNMPDisplayPath,
    counterToString,
    counterPathToDisplayStr,
    isDynamicInstanceCounter: (path) => decodePath(path).inst.startsWith(DYNAMIC_INSTANCE)
  };
}

export {
  NETCRUNCH_COUNTER_CONST,
  NETCRUNCH_COUNTER_TYPES,
  NetCrunchCounters
};
