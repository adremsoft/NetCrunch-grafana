import { DataSourcePlugin } from '@grafana/data';

import { NetCrunchDatasource } from './datasource';
import { NetCrunchDatasourceConfigCtrl } from './config/datasourceConfig.controller';
import { NetCrunchQueryController } from './query/query.controller';

export const plugin = new DataSourcePlugin<NetCrunchDatasource>(NetCrunchDatasource)
  .setConfigCtrl(NetCrunchDatasourceConfigCtrl)
  .setQueryCtrl(NetCrunchQueryController);
