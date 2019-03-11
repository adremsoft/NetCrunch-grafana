'use strict';System.register(['../adrem/module','./sessionCache'],function(_export){'use strict';var NetCrunchCounters,NETCRUNCH_COUNTER_CONST,NetCrunchSessionCache;/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 *//* eslint-disable no-shadow, no-param-reassign, object-shorthand, func-names */function NetCrunchCountersData(a,b){function c(w,x){n.addToCache(i,w,x)}function d(w){return n.getFromCache(i,w)}function e(w,x){n.addToCache(j,w,x)}function f(w){return n.getFromCache(j,w)}function g(w){n.addToCache(k,k,w)}function h(){return n.getFromCache(k,k)}var i='counters',j='countersPath',k='monitors',l=new NetCrunchCounters(a,b),m=NETCRUNCH_COUNTER_CONST,n=new NetCrunchSessionCache,o=null,p=void 0,q=void 0,r=new Promise(function(w,x){p=w,q=x}),s=null,t=void 0,u=void 0,v=new Promise(function(w,x){t=w,u=x});return n.addSection(i),n.addSection(j),n.addSection(k),{prepareCountersForMonitors:function(w){function y(F,G){return D.convertCounterPathToDisplay(F[1],G).then(function(H){// eslint-disable-line
return{name:F[1],displayName:H}})}function z(F,G){return F.displayName<G.displayName?-1:F.displayName>G.displayName?1:F.displayName===G.displayName?0:0}function A(F){return Object.keys(F).forEach(function(G){F[G].counters.sort(z)}),F}function B(F,G){return D.getMonitors(G).then(function(H){return Object.keys(F).forEach(function(I){null!=H[I]&&(F[I].name=H[I].counterGroup)}),F})}var x=1<arguments.length&&void 0!==arguments[1]?arguments[1]:!0,C=[],D=this,E=Object.create(null);return w.forEach(function(F){null==E[F[0]]&&(E[F[0]]=Object.create(null),E[F[0]].counters=[]),E[F[0]].counters.push(y(F,x))}),Object.keys(E).forEach(function(F){C.push(Promise.all(E[F].counters).then(function(G){E[F].counters=G}))}),Promise.all(C).then(function(){return E=A(E),B(E,x)})},getCounters:function(w){var x=1<arguments.length&&void 0!==arguments[1]?arguments[1]:!0,y=void 0;return y=x?d(w):null,null==y&&(null==o&&(o=new a.NetCrunch.TrendDB('ncSrv','',function(z){!0===z?p():q()},b)),y=r.then(function(){return new Promise(function(z){o.getCounters({machineId:w},function(A){A=A.map(function(B){return B.split('=')}),z(A)})})}),c(w,y)),y},convertCounterPathToDisplay:function(w){var x=1<arguments.length&&void 0!==arguments[1]?arguments[1]:!0,y=l.parseCounterPath(w),z=void 0,A=void 0;return A=x?f(w):null,null==A&&(!0===l.isMIBCnt(y.obj,y.cnt)?(z=l.counterPathObject(w,m.CNT_TYPE.cstMIB),A=l.counterPathToDisplayStr(z,!0,!0)):A=l.counterPathToDisplayStr(w,!0,!0),e(w,A)),A},getMonitors:function(){var w=0<arguments.length&&void 0!==arguments[0]?arguments[0]:!0,x=void 0;return x=w?h():null,null==x&&(null==s&&(s=new a.NetCrunch.MonitorMgrIntf('ncSrv',function(y){!0===y?t():u()},b)),x=v.then(function(){return new Promise(function(y){s.getMonitorsInfo({},function(z){var A=Object.create(null);z.forEach(function(B){A[B.monitorId]=B}),y(A)})})}),g(x)),x},getCountersForMonitors:function(w,x){var _this=this;function y(z){var A=[];return Object.keys(z).forEach(function(B){0<B&&(A=A.concat(z[B].counters))}),A}return this.getCounters(w,x).then(function(z){return _this.prepareCountersForMonitors(z,x)}).then(function(z){return z.table=y(z),z})},findCounterByName:function(w,x){var y=null;return w.table.some(function(z){return z.name===x&&(y=z,!0)}),y}}}return{setters:[function(_adremModule){NetCrunchCounters=_adremModule.NetCrunchCounters;NETCRUNCH_COUNTER_CONST=_adremModule.NETCRUNCH_COUNTER_CONST},function(_sessionCache){NetCrunchSessionCache=_sessionCache.NetCrunchSessionCache}],execute:function(){_export('NetCrunchCountersData',NetCrunchCountersData)}}});
//# sourceMappingURL=countersData.js.map
