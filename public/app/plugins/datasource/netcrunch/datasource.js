/***************************************************************
 *
 * Author   : boguslaw.gorczyca (boguslaw@gorczyca.name)
 * Created  : 2015-08-20
 *
 * 2015 Copyright AdRem Software, all rights reserved
 *
 ****************************************************************/

define([
  'angular',
  'lodash',
  'moment',
  'jquery',
  'app/core/config',
  './services/netCrunchConnectionProvider',
  './services/processingDataWorker',
  './controllers/netCrunchQueryCtrl',
  './controllers/netCrunchOptionsCtrl',
  './filters/netCrunchFilters'
],

function (angular, _, moment) {

  'use strict';

  var THREAD_WORKER_NODES_NUMBER = 1000,
      RAW_DATA_MAX_RANGE = {
        periodInterval: 2,
        periodType: 'days'
      },
      RAW_TIME_RANGE_EXCEEDED_WARNING_TITLE = 'Time range is too long.',
      RAW_TIME_RANGE_EXCEEDED_WARNING_TEXT = 'Maximum allowed length of time range for RAW data is '
                                             + RAW_DATA_MAX_RANGE.periodInterval + ' ' +
                                             RAW_DATA_MAX_RANGE.periodType + '.',
      TEMPLATES_NOT_SUPPORTED_INFO = 'NetCrunch datasource doesn\'t support templates.',
      SERIES_TYPES_DISPLAY_NAMES = {
        min: 'Min',
        avg: 'Avg',
        max: 'Max',
        avail: 'Avail',
        delta: 'Delta',
        equal: 'Equal',
        distr: 'Distr'
      };

  function QueryCache(datasource) {

    this.datasource = datasource;

    if (datasource.netCrunchConnection != null) {
      this.cache = datasource.netCrunchConnection.cache;
    } else {
      this.cache = Object.create(null);
      this.cache.counters = Object.create(null);
    }

    this.getCounters = function(nodeId) {
      var countersCache = this.cache.counters,
          cachedNodeCounters = countersCache[nodeId],
          countersQuery;

      if (cachedNodeCounters != null) {
        return cachedNodeCounters.data;
      } else {
        countersQuery = this.datasource.getCounters(nodeId);
        countersCache[nodeId] = {
          timestamp: moment(),
          data: countersQuery
        };
        return countersQuery;
      }
    };
  }

  function NetCrunchDatasource(instanceSettings, $q, $rootScope, alertSrv, netCrunchConnectionProvider,
                               netCrunchConnectionProviderConsts, netCrunchTrendDataProviderConsts,
                               netCrunchOrderNodesFilter, netCrunchMapNodesFilter, netCrunchNodesFilter,
                               processingDataWorker) {

    var PERIODS = Object.create(null),
        CONNECTION_ERROR_MESSAGES = netCrunchConnectionProviderConsts.ERROR_MESSAGES;

    PERIODS[netCrunchTrendDataProviderConsts.PERIOD_TYPE.tpMinutes] = 'minutes';
    PERIODS[netCrunchTrendDataProviderConsts.PERIOD_TYPE.tpHours] = 'hours';
    PERIODS[netCrunchTrendDataProviderConsts.PERIOD_TYPE.tpDays] = 'days';
    PERIODS[netCrunchTrendDataProviderConsts.PERIOD_TYPE.tpMonths] = 'months';

    var initTask = $q.defer(),
        nodesReady = $q.defer(),
        networkAtlasReady = $q.defer(),
        netCrunchLogin,
        self = this;

    this.datasource = instanceSettings;
    this.id = instanceSettings.id;
    this.name = instanceSettings.name;
    this.url = instanceSettings.url;
    this.username = instanceSettings.username;
    this.password = instanceSettings.password;
    this.netCrunchConnection = Object.create(null);
    this.ready = initTask.promise;
    this.nodes = nodesReady.promise;
    this.networkAtlas = networkAtlasReady.promise;
    this.cache = this.createQueryCache();
    this.instanceId = (new Date()).getTime();

    this.constructor = function() {

      function initUpdateNodes(networkAtlas) {
        $rootScope.$on('netcrunch-host-data-changed(' + self.url + ')', function() {
          var nodes = networkAtlas.networkNodes;

          nodes.table = [];
          Object.keys(nodes).forEach(function(nodeId) {
            nodes.table.push(nodes[nodeId]);
          });

          self.updateNodeList(nodes.table).then(function(updated) {
            nodesReady.resolve(updated);
            $rootScope.$broadcast('hosts-updated(' + self.instanceId + ')', updated);
          });
        });
      }

      function initUpdateAtlas(networkAtlas) {
        $rootScope.$on('netcrunch-network-data-changed(' + self.url + ')', function() {
          networkAtlasReady.resolve(networkAtlas);
        });
      }

      if (self.url != null) {
        netCrunchLogin = netCrunchConnectionProvider.getConnection(self.datasource);
        netCrunchLogin.then(
          function(connection) {
            self.netCrunchConnection = connection;
            self.cache = self.createQueryCache();
            initUpdateNodes(connection.networkAtlas);
            initUpdateAtlas(connection.networkAtlas);
            initTask.resolve();
          },
          function(error) {
            alertSrv.set(self.name, CONNECTION_ERROR_MESSAGES[error], 'error');
            console.log('');
            console.log('NetCrunch datasource');
            console.log(self.name + ': ' + CONNECTION_ERROR_MESSAGES[error]);
            initTask.reject();
          }
        );
      } else {
        initTask.reject();
      }
    };

    this.testDatasource = function() {
      var testResult = $q.defer();

      //TODO: reimplement this code

      testResult.resolve({
        status: "info",
        message: "This feature is not supported for NetCrunch datasource",
        title: "Information"
      });
      return testResult.promise;
    };

    this.getNodeById = function(nodeID) {
      return this.nodes.then(function(nodes) {
        return nodes.nodesMap[nodeID];
      });
    };

    this.getCounters = function(nodeId) {
      var countersApi = this.netCrunchConnection.counters;

      return this.ready.then(function() {
        return countersApi.getCounters(nodeId).then(function(counters) {
          return countersApi.prepareCountersForMonitors(counters).then(function(counters) {

            counters.table = [];
            Object.keys(counters).forEach(function(monitorID) {
              if (monitorID > 0) {
                counters[monitorID].counters.forEach(function(counter) {
                  counters.table.push(counter);
                });
              }
            });

            return counters;
          });
        });
      });
    };

    this.getCountersFromCache = function(nodeId) {
      return this.cache.getCounters(nodeId);
    };

    this.findCounterByName = function(counters, counterName) {
      var existingCounter = null;

      counters.table.some(function(counter) {
        if (counter.name === counterName) {
          existingCounter = counter;
          return true;
        } else {
          return false;
        }
      });

      return existingCounter;
    };

    this.filterNodeList = function(nodes, pattern) {
      var newNodeList = [],
          result = $q.when(newNodeList);

      function orderNodeList(nodes) {
        if (nodes != null) {
          return netCrunchOrderNodesFilter(nodes);
        } else {
          return [];
        }
      }

      if (nodes != null) {
        if (nodes.length < THREAD_WORKER_NODES_NUMBER) {
          newNodeList = netCrunchMapNodesFilter(nodes, null);
          newNodeList = orderNodeList(newNodeList);
          newNodeList = netCrunchNodesFilter(newNodeList, pattern);
          result = $q.when(newNodeList);
        } else {
          return processingDataWorker.filterAndOrderMapNodes(nodes, null).then(function(result) {
            return netCrunchNodesFilter(result, pattern);
          });
        }
      }

      return result;
    };

    this.updateNodeList = function(nodes) {
      return this.filterNodeList(nodes, '').then(function(updated) {
        updated.nodesMap = Object.create(null);
        updated.forEach(function(node) {
          updated.nodesMap[node.values.Id] = node;
        });
        return updated;
      });
    };

    this.validateSeriesTypes = function(series) {
      series.min = (series.min == null) ? false : series.min;
      series.avg = (series.avg == null) ? true : series.avg;
      series.max = (series.max == null) ? false : series.max;
      series.avail = (series.avail == null) ? false : series.avail;
      series.delta = (series.delta == null) ? false : series.delta;
      series.equal = (series.equal == null) ? false : series.equal;
      series.distr = (series.distr == null) ? false : series.distr;
      return series;
    };

    this.seriesTypesSelected = function(series) {
      return Object.keys(series).some(function(seriesKey) {
        return (series[seriesKey] === true);
      });
    };

    this.updatePanel = function(panel) {
      var MAX_SAMPLE_COUNT = netCrunchTrendDataProviderConsts.DEFAULT_MAX_SAMPLE_COUNT,
          scopedVars = (panel.scopedVars == null) ? Object.create(null) : panel.scopedVars,
          rawData = (scopedVars.rawData == null) ? false : scopedVars.rawData,
          setMaxDataPoints = (scopedVars.setMaxDataPoints == null) ? false : scopedVars.setMaxDataPoints,
          maxDataPoints = (scopedVars.maxDataPoints == null) ? MAX_SAMPLE_COUNT : scopedVars.maxDataPoints;

      panel.scopedVars = scopedVars;
      panel.scopedVars.rawData = rawData;
      panel.scopedVars.setMaxDataPoints = setMaxDataPoints;
      panel.scopedVars.maxDataPoints = maxDataPoints;
      return panel;
    };

    this.query = function(options) {
      var self = this;

      function floorTime(time, period) {
        var MINUTES_SLOT = 5,
            minuteRemains,
            floorMethod = Object.create(null);

        floorMethod['minutes'] = function(time) {
          minuteRemains = time.minute() % MINUTES_SLOT;
          return time.subtract(minuteRemains, 'minutes');
        };

        floorMethod['hours'] = function(time) {
          return time.startOf('hour');
        };

        floorMethod['days'] = function(time) {
          return time.startOf('day');
        };

        floorMethod['months'] = function(time) {
          return time.startOf('month');
        };

        return floorMethod[period](time).startOf('minute');
      }

      function addMarginsToTimeRange(rangeFrom, rangeTo, period) {

        rangeFrom = moment(rangeFrom).subtract(period.periodInterval, PERIODS[period.periodType]);
        rangeTo = moment(rangeTo).add(period.periodInterval, PERIODS[period.periodType]);

        if (rangeTo > moment()) {
          rangeTo = moment();
        }

        return {
          from: floorTime(rangeFrom, PERIODS[period.periodType]),
          to: rangeTo,
          periodInterval: period.periodInterval,
          periodType: period.periodType
        };
      }

      function calculateTimeRange(rangeFrom, rangeTo, maxDataPoints) {
        var trends = self.netCrunchConnection.trends,
            period = trends.calculateChartDataInterval(rangeFrom, rangeTo, maxDataPoints);
        return addMarginsToTimeRange(rangeFrom, rangeTo, period);
      }

      function calculateRAWTimeRange(rangeFrom, rangeTo) {
        var trends = self.netCrunchConnection.trends,
            period = {
              periodInterval: 1,
              periodType: trends.PERIOD_TYPE.tpMinutes
            };
        return addMarginsToTimeRange(rangeFrom, rangeTo, period);
      }

      function calculateMaxDataPoints(setMaxDataPoints, maxDataPoints) {
        var maxDataPointsInt,
            minMaxDataPoints = netCrunchTrendDataProviderConsts.DEFAULT_MIN_MAX_SAMPLE_COUNT,
            maxMaxDataPoints = netCrunchTrendDataProviderConsts.DEFAULT_MAX_MAX_SAMPLE_COUNT,
            result = netCrunchTrendDataProviderConsts.DEFAULT_MAX_SAMPLE_COUNT;

        function isNumber(value) {
          return !isNaN(parseFloat(value)) && isFinite(value);
        }

        if ((setMaxDataPoints === true) && (isNumber(maxDataPoints) === true)) {
          maxDataPointsInt = Math.round(parseFloat(maxDataPoints));
          if ((maxDataPointsInt >= minMaxDataPoints) && (maxDataPointsInt <= maxMaxDataPoints)) {
            result = maxDataPointsInt;
          }
        }

        return result;
      }

      function prepareTimeRange(rangeFrom, rangeTo, rawData, maxDataPoints) {
        var range = null;

        if (rawData === true) {
          if (moment(rangeTo).subtract(RAW_DATA_MAX_RANGE.periodInterval, RAW_DATA_MAX_RANGE.periodType) <= rangeFrom) {
            range = calculateRAWTimeRange(rangeFrom, rangeTo);
          } else {
            alertSrv.set(RAW_TIME_RANGE_EXCEEDED_WARNING_TITLE, RAW_TIME_RANGE_EXCEEDED_WARNING_TEXT, 'warning');
          }
        } else {
          range = calculateTimeRange(rangeFrom, rangeTo, maxDataPoints);
        }

        return range;
      }

      function validateCounterData(target) {
        var nodeName,
            counterDisplayName;

        nodeName = self.nodes.then(function(nodesData) {
          var nodeData = nodesData.nodesMap[target.nodeID];
          return (nodeData != null) ? nodeData.values.Name : null;
        });

        counterDisplayName = self.getCountersFromCache(target.nodeID).then(function(counters) {
          var counterData = self.findCounterByName(counters, target.counterName);
          return (counterData != null) ? counterData.displayName : null;
        });

        return $q.all([nodeName, counterDisplayName]).then(function(counterData) {
          var nodeName = counterData[0],
              counterDisplayName = counterData[1];

          if ((nodeName == null) || (counterDisplayName == null)) {
            return null;
          } else {
            return {
              nodeName: nodeName,
              counterDisplayName: counterDisplayName
            };
          }
        });
      }

      function prepareSeriesDataQuery(target, range, series) {
        var trends = self.netCrunchConnection.trends;

        if (self.seriesTypesSelected(series) === false) {
          return $q.when([]);
        }

        return trends.getCounterTrendData(target.nodeID, target.counterName, range.from, range.to, range.periodType,
                                          range.periodInterval, series).then(
          function(dataPoints) {
            var seriesData = [];

            Object.keys(dataPoints.values).forEach(function(seriesType) {
              seriesData.push({
                seriesType: seriesType,
                dataPoints: {
                  domain: dataPoints.domain,
                  values: dataPoints.values[seriesType]
                }
              });
            });

            return seriesData;
          });
      }

      function prepareTargetQuery(target, range, series) {
        var targetDataQuery = null;

        if ((target.hide !== true) && (target.counterDataComplete === true)) {
          targetDataQuery = validateCounterData(target).then(function(counterData) {
            var query = null,
                seriesDataQuery,
                seriesTypes;

            if (counterData != null) {
              query = [$q.when(counterData.nodeName + ' - ' + counterData.counterDisplayName)];
              seriesTypes = (series == null) ? Object.create(null) : series;
              seriesTypes = self.validateSeriesTypes(seriesTypes);
              seriesDataQuery = prepareSeriesDataQuery(target, range, seriesTypes);
              query.push(seriesDataQuery);
              query = $q.all(query);
            }

            return query;
          });
        }

        return targetDataQuery;
      }

      function prepareChartData(targetsChartData, rawData) {
        var counterSeries = Object.create(null),
            trends = self.netCrunchConnection.trends;

        function extendCounterName(baseCounterName, seriesType) {
          return baseCounterName + '\\' + SERIES_TYPES_DISPLAY_NAMES[seriesType];
        }

        counterSeries.data = [];

        if ((targetsChartData != null) && (targetsChartData.length > 0)) {
          targetsChartData.forEach(function(target) {
            var baseCounterName = (target != null) ? target[0] : null,
                targetSeries = (target != null) ? target[1] : null,
                extendedNamesCounters = !rawData,
                counterName;

            if (target != null) {
              targetSeries.forEach(function(serie) {
                if (extendedNamesCounters === true) {
                  counterName = extendCounterName(baseCounterName, serie.seriesType);
                } else {
                  counterName = baseCounterName;
                }
                counterSeries.data.push({
                  target: counterName,
                  datapoints: trends.grafanaDataConverter(serie.dataPoints)
                });
              });
            }
          });
        }

        return counterSeries;
      }

      try {
        return this.ready.then(
          function() {
            var targets = options.targets || [],
                scopedVars = (options.scopedVars == null) ? {} : options.scopedVars,
                rawData = (scopedVars.rawData == null) ? false : scopedVars.rawData,
                setMaxDataPoints = (scopedVars.setMaxDataPoints == null) ? false : scopedVars.setMaxDataPoints,
                maxDataPoints = (scopedVars.maxDataPoints == null) ?
                                 netCrunchTrendDataProviderConsts.DEFAULT_MAX_SAMPLE_COUNT : scopedVars.maxDataPoints,
                rangeFrom = options.range.from.startOf('minute'),
                rangeTo = options.range.to.startOf('minute'),
                rangeMaxDataPoints = calculateMaxDataPoints(setMaxDataPoints, maxDataPoints),
                range = prepareTimeRange(rangeFrom, rangeTo, rawData, rangeMaxDataPoints),
                dataQueries = [];

            if (range != null) {
              targets.forEach(function(target) {
                var targetDataQuery,
                    series = (rawData === true) ? { avg: true } : target.series;

                targetDataQuery = prepareTargetQuery(target, range, series);
                if (targetDataQuery != null) {
                  dataQueries.push(targetDataQuery);
                }
              });
            }

            return $q.all(dataQueries).then(function(targetsChartData) {
              return prepareChartData(targetsChartData, rawData);
            });
          },
          function() {
            return $q.when(false);
          }
        );
      }

      catch (error) {
        return $q.reject(error);
      }
    };

    this.metricFindQuery = function() {
      alertSrv.set(TEMPLATES_NOT_SUPPORTED_INFO);
      return $q.when([]);
    };

    this.constructor();
  }

  NetCrunchDatasource.prototype.createQueryCache = function() {
    return new QueryCache(this);
  };

  return NetCrunchDatasource;
});
