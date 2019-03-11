'use strict';System.register(['./networkNode','./networkMap','./networkNodes'],function(_export){'use strict';var NetCrunchNetworkNode,NetCrunchNetworkMap,NetCrunchNodes,_createClass,ATLAS_ROOT_ID,MONITORING_PACKS_NET_ID,PRIVATE_PROPERTIES,ROOT_MAP_REC,NetCrunchNetworkAtlas;function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor))throw new TypeError('Cannot call a class as a function')}return{setters:[function(_networkNode){NetCrunchNetworkNode=_networkNode.NetCrunchNetworkNode},function(_networkMap){NetCrunchNetworkMap=_networkMap.NetCrunchNetworkMap},function(_networkNodes){NetCrunchNodes=_networkNodes.NetCrunchNodes}],execute:function(){_createClass=function(){function defineProperties(target,props){for(var descriptor,i=0;i<props.length;i++)descriptor=props[i],descriptor.enumerable=descriptor.enumerable||!1,descriptor.configurable=!0,'value'in descriptor&&(descriptor.writable=!0),Object.defineProperty(target,descriptor.key,descriptor)}return function(Constructor,protoProps,staticProps){return protoProps&&defineProperties(Constructor.prototype,protoProps),staticProps&&defineProperties(Constructor,staticProps),Constructor}}();ATLAS_ROOT_ID='';MONITORING_PACKS_NET_ID=3;PRIVATE_PROPERTIES={connection:Symbol('connection'),nodes:Symbol('nodes'),atlasMaps:Symbol('atlasMaps'),orphans:Symbol('orphans')};ROOT_MAP_REC={local:{},getValues:function(){// eslint-disable-line
return{DisplayName:'Network Atlas',MapClassTag:'dynfolder',NetIntId:ATLAS_ROOT_ID}}};_export('NetCrunchNetworkAtlas',NetCrunchNetworkAtlas=function(){function NetCrunchNetworkAtlas(a){_classCallCheck(this,NetCrunchNetworkAtlas),this[PRIVATE_PROPERTIES.connection]=a,this[PRIVATE_PROPERTIES.nodes]=new NetCrunchNodes,this[PRIVATE_PROPERTIES.atlasMaps]=new Map,this[PRIVATE_PROPERTIES.atlasMaps].set(ATLAS_ROOT_ID,new NetCrunchNetworkMap(ROOT_MAP_REC)),this[PRIVATE_PROPERTIES.orphans]=[]}return _createClass(NetCrunchNetworkAtlas,[{key:'addNetworkMap',value:function(a){var e=this;e[PRIVATE_PROPERTIES.atlasMaps].set(a.netId,a),function(f){e[PRIVATE_PROPERTIES.orphans]=e[PRIVATE_PROPERTIES.orphans].filter(function(g){return g.parentId!==f.netId||(f.addChild(g),!1)})}(a),function(f){return f.netId===MONITORING_PACKS_NET_ID}(a)||function(f){e[PRIVATE_PROPERTIES.atlasMaps].has(f.parentId)?e[PRIVATE_PROPERTIES.atlasMaps].get(f.parentId).addChild(f):e[PRIVATE_PROPERTIES.orphans].push(f)}(a)}},{key:'addMap',value:function(a){var b=new NetCrunchNetworkMap(a);this.addNetworkMap(b)}},{key:'addNode',value:function(a){var b=new NetCrunchNetworkNode(a,this[PRIVATE_PROPERTIES.connection]);this[PRIVATE_PROPERTIES.nodes].add(b)}},{key:'nodes',get:function(){return this[PRIVATE_PROPERTIES.nodes]}},{key:'atlasMaps',get:function(){return this[PRIVATE_PROPERTIES.atlasMaps]}},{key:'networkAtlasRoot',get:function(){return this.atlasMaps.get(ATLAS_ROOT_ID)}},{key:'monitoringPacks',get:function(){return this[PRIVATE_PROPERTIES.atlasMaps].has(MONITORING_PACKS_NET_ID)?this[PRIVATE_PROPERTIES.atlasMaps].get(MONITORING_PACKS_NET_ID):null}}]),NetCrunchNetworkAtlas}());_export('NetCrunchNetworkAtlas',NetCrunchNetworkAtlas)}}});
//# sourceMappingURL=networkAtlas.js.map
