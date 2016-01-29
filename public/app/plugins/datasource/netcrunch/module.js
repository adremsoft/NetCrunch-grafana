/***************************************************************
 *
 * Author   : boguslaw.gorczyca
 * Created  : 2016-01-29
 *
 * 2016 Copyright AdRem Software, all rights reserved
 *
 ****************************************************************/

define([
    './datasource'
  ],

  function (NetCrunchDatasource) {

    'use strict';

    function metricsQueryEditor() {
      return {
        controller: 'netCrunchQueryCtrl',
        templateUrl: 'app/plugins/datasource/netcrunch/partials/query.editor.html'
      };
    }

    function metricsQueryOptions() {
      return {
        templateUrl: 'app/plugins/datasource/netcrunch/partials/query.options.html'
      };
    }

    function configView() {
      return {
        templateUrl: 'app/plugins/datasource/netcrunch/partials/config.html'
      };
    }

    return {
      Datasource: NetCrunchDatasource,
      configView: configView,
      metricsQueryEditor: metricsQueryEditor,
      metricsQueryOptions: metricsQueryOptions
    };
  }
);
