'use strict';System.register([],function(_export){'use strict';var _createClass,AdremWebWorker;function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor))throw new TypeError('Cannot call a class as a function')}return{setters:[],execute:function(){_createClass=function(){function defineProperties(target,props){for(var descriptor,i=0;i<props.length;i++)descriptor=props[i],descriptor.enumerable=descriptor.enumerable||!1,descriptor.configurable=!0,'value'in descriptor&&(descriptor.writable=!0),Object.defineProperty(target,descriptor.key,descriptor)}return function(Constructor,protoProps,staticProps){return protoProps&&defineProperties(Constructor.prototype,protoProps),staticProps&&defineProperties(Constructor,staticProps),Constructor}}();_export('AdremWebWorker',AdremWebWorker=function(){function AdremWebWorker(a){function b(){for(var e=new Date().getTime();c.has(e);)e+=1;return e}_classCallCheck(this,AdremWebWorker);var c=new Map,d=new Worker(a);d.onmessage=function(e){var f=e.data.taskId;if(c.has(f)){var g=c.get(f);c.delete(f),g(e.data.result)}},this.executeTask=function(e){var f=b(),g=e;return g.taskId=f,new Promise(function(h){c.set(f,h),d.postMessage(g)})}}return _createClass(AdremWebWorker,[{key:'addTask',value:function(a){this[a.name]=function(){for(var _len=arguments.length,b=Array(_len),_key=0;_key<_len;_key++)b[_key]=arguments[_key];var c={funcName:a.name,args:b,async:a.async};if(!0===a.async){var d=this;return new Promise(function(e,f){d.executeTask(c).then(function(g){'resolve'===g.type&&e(g.result),'reject'===g.type&&f(g.error)})})}return this.executeTask(c)}}}],[{key:'webWorkerBuilder',value:function(){function a(){function g(){function j(o,p){n.postMessage({taskId:o,result:p})}function k(o,p,q){j(o,n[p].apply(n,q))}function l(o,p,q){n[p].apply(n,q).then(function(r){return j(o,{type:'resolve',result:r})}).catch(function(r){return j(o,{type:'reject',error:r})})}var n=this;return function(o){var p=o.data;!0===p.async?l(p.taskId,p.funcName,p.args):k(p.taskId,p.funcName,p.args)}}var i=void 0;return i=function(){return'this.onmessage = '+g.name+'().bind(this);\n\n'}(),i+=g.toString()+'\n',i+=e.reduce(function(j,k){return j+'\n'+k},''),new Blob([i],{type:'application/javascript'})}function b(){return URL.createObjectURL(a())}var e=[],f=[];return{addFunctionCode:function(g){var h=1<arguments.length&&void 0!==arguments[1]&&arguments[1],i=2<arguments.length&&void 0!==arguments[2]&&arguments[2];return'function'==typeof g&&(e.push(g.toString()),!0===h&&null!=g.name&&''!==g.name&&f.push({name:g.name,async:i}),!0)},getWebWorker:function(){var g=new AdremWebWorker(b());return f.forEach(function(h){g.addTask(h)}),g}}}}]),AdremWebWorker}());_export('AdremWebWorker',AdremWebWorker)}}});
//# sourceMappingURL=adremWebWorker.js.map
