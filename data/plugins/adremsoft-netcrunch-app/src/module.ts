import { AppPlugin } from '@grafana/data';

import { ExampleConfigCtrl } from './legacy/config';

export { ExampleConfigCtrl as ConfigCtrl };

export const plugin = new AppPlugin<{}>();
