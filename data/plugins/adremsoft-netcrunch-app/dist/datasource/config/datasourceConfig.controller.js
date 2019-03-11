'use strict';System.register(['../common'],function(_export){'use strict';var datasourceURL,_createClass,NetCrunchDatasourceConfigCtrl;function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor))throw new TypeError('Cannot call a class as a function')}return{setters:[function(_common){datasourceURL=_common.datasourceURL}],execute:function(){_createClass=function(){function defineProperties(target,props){for(var descriptor,i=0;i<props.length;i++)descriptor=props[i],descriptor.enumerable=descriptor.enumerable||!1,descriptor.configurable=!0,'value'in descriptor&&(descriptor.writable=!0),Object.defineProperty(target,descriptor.key,descriptor)}return function(Constructor,protoProps,staticProps){return protoProps&&defineProperties(Constructor.prototype,protoProps),staticProps&&defineProperties(Constructor,staticProps),Constructor}}();_export('NetCrunchDatasourceConfigCtrl',NetCrunchDatasourceConfigCtrl=function(){function NetCrunchDatasourceConfigCtrl(){_classCallCheck(this,NetCrunchDatasourceConfigCtrl),this.updateURL()}return _createClass(NetCrunchDatasourceConfigCtrl,[{key:'updateURL',value:function(){this.current.access='proxy',this.current.url=this.protocol+this.simpleURL}},{key:'serverAddressChange',value:function(){this.updateURL()}},{key:'isSSLClick',value:function(){this.updateURL()}},{key:'simpleURL',get:function(){return this.current.jsonData.simpleUrl}},{key:'isSSL',get:function(){return this.current.jsonData.isSSL}},{key:'protocol',get:function(){return!0===this.isSSL?'https://':'http://'}}],[{key:'templateUrl',get:function(){return datasourceURL+'config/config.html'},set:function(){// eslint-disable-line
}}]),NetCrunchDatasourceConfigCtrl}());_export('NetCrunchDatasourceConfigCtrl',NetCrunchDatasourceConfigCtrl)}}});
//# sourceMappingURL=datasourceConfig.controller.js.map
