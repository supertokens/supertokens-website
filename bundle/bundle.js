var supertokens=function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=3)}([function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(10),o=r(11);function i(e){return new n.default(e).getAsStringDangerous()}function s(e){return new o.default(e).getAsStringDangerous()}function a(e){var t=function(e){(e=e.trim().toLowerCase()).startsWith(".")&&(e=e.substr(1)),e.startsWith("http://")||e.startsWith("https://")||(e="http://"+e);try{return(e=new URL(e).hostname).startsWith(".")&&(e=e.substr(1)),e}catch(e){throw new Error("Please provide a valid sessionScope")}}(e);return"localhost"===t||/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(t)?t:e.startsWith(".")?"."+t:t}t.isAnIpAddress=function(e){return/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(e)},t.normaliseURLDomainOrThrowError=i,t.normaliseURLPathOrThrowError=s,t.normaliseSessionScopeOrThrowError=a,t.validateAndNormaliseInputOrThrowError=function(e){var t=i(e.apiDomain),r=s("/auth");void 0!==e.apiBasePath&&(r=s(e.apiBasePath));var n=void 0;void 0!==e.sessionScope&&(n={scope:a(e.sessionScope.scope),authDomain:i(e.sessionScope.authDomain)});var o={};void 0!==e.refreshAPICustomHeaders&&(o=e.refreshAPICustomHeaders);var u=401;void 0!==e.sessionExpiredStatusCode&&(u=e.sessionExpiredStatusCode);var c=!0;return void 0!==e.autoAddCredentials&&(c=e.autoAddCredentials),{apiDomain:t,apiBasePath:r,sessionScope:n,refreshAPICustomHeaders:o,sessionExpiredStatusCode:u,autoAddCredentials:c}},t.getWindowOrThrow=function(){if("undefined"==typeof window)throw Error("If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined.");return window}},function(e,t,r){"use strict";(function(e){var n=this&&this.__assign||function(){return(n=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var o in t=arguments[r])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)},o=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{u(n.next(e))}catch(e){i(e)}}function a(e){try{u(n.throw(e))}catch(e){i(e)}}function u(e){e.done?o(e.value):new r((function(t){t(e.value)})).then(s,a)}u((n=n.apply(e,t||[])).next())}))},i=this&&this.__generator||function(e,t){var r,n,o,i,s={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function a(i){return function(a){return function(i){if(r)throw new TypeError("Generator is already executing.");for(;s;)try{if(r=1,n&&(o=2&i[0]?n.return:i[0]?n.throw||((o=n.return)&&o.call(n),0):n.next)&&!(o=o.call(n,i[1])).done)return o;switch(n=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return s.label++,{value:i[1],done:!1};case 5:s.label++,n=i[1],i=[0];continue;case 7:i=s.ops.pop(),s.trys.pop();continue;default:if(!(o=(o=s.trys).length>0&&o[o.length-1])&&(6===i[0]||2===i[0])){s=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){s.label=i[1];break}if(6===i[0]&&s.label<o[1]){s.label=o[1],o=i;break}if(o&&s.label<o[2]){s.label=o[2],s.ops.push(i);break}o[2]&&s.ops.pop(),s.trys.pop();continue}i=t.call(e,s)}catch(e){i=[6,e],n=0}finally{r=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,a])}}},s=this;Object.defineProperty(t,"__esModule",{value:!0});var a=r(2),u=r(7),c=r(8),l=r(0),d=r(12),f=function(){function e(){}return e.getToken=function(t){if(void 0!==t){if(void 0===e.tokenInfo){var r=function(){var e=p.crossDomainLocalstorage.getItem(m);if(null!==e)return e;var t=function(){var e=("; "+l.getWindowOrThrow().document.cookie).split("; "+m+"=");if(e.length>=2){var t=e.pop();if(void 0!==t){var r=t.split(";").shift();return void 0===r?null:r}}return null}();null!==t&&S(t);return t}();if(null===r)return;e.tokenInfo={antiCsrf:r,associatedIdRefreshToken:t}}else if(e.tokenInfo.associatedIdRefreshToken!==t)return e.tokenInfo=void 0,e.getToken(t);return e.tokenInfo.antiCsrf}e.tokenInfo=void 0},e.removeToken=function(){e.tokenInfo=void 0,S(void 0)},e.setItem=function(t,r){void 0!==t?(S(r),e.tokenInfo={antiCsrf:r,associatedIdRefreshToken:t}):e.tokenInfo=void 0},e}();t.AntiCsrfToken=f;var h=function(){function e(){}return e.getTokenInfo=function(){var e=b();if(null!==e)return JSON.parse(atob(e))},e.removeToken=function(){I(void 0)},e.setItem=function(e){I(e)},e}();function v(e,t,r,n){return o(this,void 0,void 0,(function(){var o;return i(this,(function(i){switch(i.label){case 0:return void 0===t?[2,void 0!==y()]:[4,T(e,t,r,n)];case 1:if("SESSION_EXPIRED"===(o=i.sent()).result)return[2,!1];if("API_ERROR"===o.result)throw o.error;return[2,!0]}}))}))}t.FrontToken=h,t.handleUnauthorised=v;var p=function(){function t(){}return t.setAuth0API=function(e){t.auth0Path=l.normaliseURLPathOrThrowError(e)},t.init=function(r){var n=l.validateAndNormaliseInputOrThrowError(r),o=n.apiDomain,i=n.apiBasePath,s=n.sessionScope,a=n.refreshAPICustomHeaders,u=n.signoutAPICustomHeaders,c=n.sessionExpiredStatusCode,f=n.autoAddCredentials;t.autoAddCredentials=f,t.refreshTokenUrl=o+i+"/session/refresh",t.signOutUrl=o+i+"/signout",t.refreshAPICustomHeaders=a,t.signoutAPICustomHeaders=u,t.sessionScope=s,t.sessionExpiredStatusCode=c,t.apiDomain=o,t.crossDomainLocalstorage=new d.default(s);var h=void 0===l.getWindowOrThrow().fetch?e:l.getWindowOrThrow();void 0===t.originalFetch&&(t.originalFetch=h.fetch.bind(h)),t.addedFetchInterceptor||(t.addedFetchInterceptor=!0,h.fetch=function(e,r){return t.fetch(e,r)}),t.initCalled=!0},t.getUserId=function(){var e=h.getTokenInfo();if(void 0===e)throw new Error("No session exists");return e.uid},t.getJWTPayloadSecurely=function(){return o(this,void 0,void 0,(function(){var e,r;return i(this,(function(n){switch(n.label){case 0:if(void 0===(e=h.getTokenInfo()))throw new Error("No session exists");return e.ate<Date.now()?(r=y(),[4,v(t.refreshTokenUrl,r,t.refreshAPICustomHeaders,t.sessionExpiredStatusCode)]):[3,4];case 1:return n.sent()?[4,t.getJWTPayloadSecurely()]:[3,3];case 2:return[2,n.sent()];case 3:throw new Error("Could not refresh session");case 4:return[2,e.up]}}))}))},t.signOut=function(){return o(this,void 0,void 0,(function(){var e;return i(this,(function(r){switch(r.label){case 0:return t.doesSessionExist()?[4,fetch(t.signOutUrl,{method:"post",credentials:"include",headers:void 0===t.signoutAPICustomHeaders?void 0:n({},t.signoutAPICustomHeaders)})]:[2];case 1:if((e=r.sent()).status===t.sessionExpiredStatusCode)return[2];if(e.status>=300)throw e;return[2]}}))}))},t.initCalled=!1,t.apiDomain="",t.addedFetchInterceptor=!1,t.getAuth0API=function(){return{apiPath:t.auth0Path}},t.getRefreshURLDomain=function(){return l.normaliseURLDomainOrThrowError(t.refreshTokenUrl)},t.doRequest=function(e,r,u){return o(s,void 0,void 0,(function(){var o,s,c,d,p,w,m,g;return i(this,(function(i){switch(i.label){case 0:if(!t.initCalled)throw Error("init function not called");o=!1;try{o="string"==typeof u&&l.normaliseURLDomainOrThrowError(u)!==t.apiDomain&&t.addedFetchInterceptor||void 0!==u&&"string"==typeof u.url&&l.normaliseURLDomainOrThrowError(u.url)!==t.apiDomain&&t.addedFetchInterceptor}catch(e){if("Please provide a valid domain name"!==e.message)throw e;o=l.normaliseURLDomainOrThrowError(window.location.origin)!==t.apiDomain&&t.addedFetchInterceptor}return o?[4,e(r)]:[3,2];case 1:return[2,i.sent()];case 2:t.addedFetchInterceptor&&a.ProcessState.getInstance().addState(a.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST),i.label=3;case 3:i.trys.push([3,,16,17]),s=!1,c=void 0,i.label=4;case 4:0,d=y(),p=f.getToken(d),w=r,void 0!==p&&(w=n({},w,{headers:void 0===w?{"anti-csrf":p}:n({},w.headers,{"anti-csrf":p})})),t.autoAddCredentials&&(void 0===w?w={credentials:"include"}:void 0===w.credentials&&(w=n({},w,{credentials:"include"}))),i.label=5;case 5:return i.trys.push([5,10,,14]),[4,e(w)];case 6:return(m=i.sent()).headers.forEach((function(e,t){"id-refresh-token"===t.toString()&&k(e)})),m.status!==t.sessionExpiredStatusCode?[3,8]:[4,v(t.refreshTokenUrl,d,t.refreshAPICustomHeaders,t.sessionExpiredStatusCode)];case 7:return i.sent()?[3,9]:(c=m,[3,15]);case 8:return m.headers.forEach((function(e,t){"anti-csrf"===t.toString()?f.setItem(y(),e):"front-token"===t.toString()&&h.setItem(e)})),[2,m];case 9:return[3,14];case 10:return(g=i.sent()).status!==t.sessionExpiredStatusCode?[3,12]:[4,v(t.refreshTokenUrl,d,t.refreshAPICustomHeaders,t.sessionExpiredStatusCode)];case 11:return i.sent()?[3,13]:(s=!0,c=g,[3,15]);case 12:throw g;case 13:return[3,14];case 14:return[3,4];case 15:if(s)throw c;return[2,c];case 16:return void 0===y()&&(f.removeToken(),h.removeToken()),[7];case 17:return[2]}}))}))},t.attemptRefreshingSession=function(){return o(s,void 0,void 0,(function(){var e;return i(this,(function(r){switch(r.label){case 0:if(!t.initCalled)throw Error("init function not called");r.label=1;case 1:return r.trys.push([1,,3,4]),e=y(),[4,v(t.refreshTokenUrl,e,t.refreshAPICustomHeaders,t.sessionExpiredStatusCode)];case 2:return[2,r.sent()];case 3:return void 0===y()&&(f.removeToken(),h.removeToken()),[7];case 4:return[2]}}))}))},t.fetch=function(e,r){return o(s,void 0,void 0,(function(){return i(this,(function(o){switch(o.label){case 0:return[4,t.doRequest((function(r){return t.originalFetch(e,n({},r))}),r,e)];case 1:return[2,o.sent()]}}))}))},t.doesSessionExist=function(){return void 0!==y()},t}();t.default=p;var w="sIRTFrontend",m="sAntiCsrf",g="sFrontToken";function T(e,t,r,s){return o(this,void 0,void 0,(function(){var o,a,l;return i(this,(function(d){switch(d.label){case 0:o=new c.default,a=function(){var a,c,l,d,v,w,m;return i(this,(function(i){switch(i.label){case 0:return[4,o.acquireLock("REFRESH_TOKEN_USE",1e3)];case 1:if(!i.sent())return[3,6];i.label=2;case 2:return i.trys.push([2,4,5,6]),void 0===(a=y())?[2,{value:{result:"SESSION_EXPIRED"}}]:a!==t?[2,{value:{result:"RETRY"}}]:(c=f.getToken(t),l=n({},r),void 0!==c&&(l=n({},l,{"anti-csrf":c})),l=n({},l,{"fdi-version":u.supported_fdi.join(",")}),[4,p.originalFetch(e,{method:"post",credentials:"include",headers:l})]);case 3:if(d=i.sent(),v=!0,d.headers.forEach((function(e,t){"id-refresh-token"===t.toString()&&(k(e),v=!1)})),d.status===s&&v&&k("remove"),d.status>=300)throw d;return void 0===y()?[2,{value:{result:"SESSION_EXPIRED"}}]:(d.headers.forEach((function(e,t){"anti-csrf"===t.toString()?f.setItem(y(),e):"front-token"===t.toString()&&h.setItem(e)})),[2,{value:{result:"RETRY"}}]);case 4:return w=i.sent(),void 0===y()?[2,{value:{result:"SESSION_EXPIRED"}}]:[2,{value:{result:"API_ERROR",error:w}}];case 5:return o.releaseLock("REFRESH_TOKEN_USE"),[7];case 6:return void 0===(m=y())?[2,{value:{result:"SESSION_EXPIRED"}}]:m!==t?[2,{value:{result:"RETRY"}}]:[2]}}))},d.label=1;case 1:return[5,a()];case 2:return"object"==typeof(l=d.sent())?[2,l.value]:[3,1];case 3:return[2]}}))}))}function y(){var e=p.crossDomainLocalstorage.getItem(w);if(null!==e){var t=e.split(";"),r=t[0];return Number(t[1])<Date.now()&&(k("remove"),r=void 0),r}var n=function(){var e=("; "+l.getWindowOrThrow().document.cookie).split("; "+w+"=");if(e.length>=2){var t=e.pop();if(void 0!==t)return t.split(";").shift()}}();return void 0!==n&&k(n+";9999999999999"),n}function k(e){"remove"===e?p.crossDomainLocalstorage.removeItem(w):p.crossDomainLocalstorage.setItem(w,e),function(e,t){var r="Thu, 01 Jan 1970 00:00:01 GMT",n="";if("remove"!==e){var o=e.split(";");n=o[0],r=new Date(Number(o[1])).toUTCString()}"localhost"===t||t===window.location.hostname?l.getWindowOrThrow().document.cookie=w+"="+n+";expires="+r+";path=/":l.getWindowOrThrow().document.cookie=w+"="+n+";expires="+r+";domain="+t+";path=/"}("remove",void 0===p.sessionScope?l.normaliseSessionScopeOrThrowError(l.getWindowOrThrow().location.hostname):p.sessionScope.scope)}function S(e){void 0===e?p.crossDomainLocalstorage.removeItem(m):p.crossDomainLocalstorage.setItem(m,e),function(e,t){var r="Thu, 01 Jan 1970 00:00:01 GMT",n="";void 0!==e&&(n=e,r=void 0),"localhost"===t||t===window.location.hostname?l.getWindowOrThrow().document.cookie=void 0!==r?m+"="+n+";expires="+r+";path=/":m+"="+n+";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/":l.getWindowOrThrow().document.cookie=void 0!==r?m+"="+n+";expires="+r+";domain="+t+";path=/":m+"="+n+";domain="+t+";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/"}(void 0,void 0===p.sessionScope?l.normaliseSessionScopeOrThrowError(l.getWindowOrThrow().location.hostname):p.sessionScope.scope)}function b(){var e=p.crossDomainLocalstorage.getItem(g);if(null!==e)return e;var t=function(){var e=("; "+l.getWindowOrThrow().document.cookie).split("; "+g+"=");if(e.length>=2){var t=e.pop();if(void 0!==t){var r=t.split(";").shift();return void 0===r?null:r}}return null}();return null!==t&&I(t),t}function I(e){void 0===e?p.crossDomainLocalstorage.removeItem(g):p.crossDomainLocalstorage.setItem(g,e),function(e,t){var r="Thu, 01 Jan 1970 00:00:01 GMT",n="";void 0!==e&&(n=e,r=void 0),"localhost"===t||t===window.location.hostname?l.getWindowOrThrow().document.cookie=void 0!==r?g+"="+n+";expires="+r+";path=/":g+"="+n+";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/":l.getWindowOrThrow().document.cookie=void 0!==r?g+"="+n+";expires="+r+";domain="+t+";path=/":g+"="+n+";domain="+t+";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/"}(void 0,void 0===p.sessionScope?l.normaliseSessionScopeOrThrowError(l.getWindowOrThrow().location.hostname):p.sessionScope.scope)}t.onUnauthorisedResponse=T,t.getIdRefreshToken=y,t.setIdRefreshToken=k,t.setAntiCSRF=S,t.getFrontToken=b,t.setFrontToken=I}).call(this,r(5))},function(e,t,r){"use strict";(function(e){var r=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{u(n.next(e))}catch(e){i(e)}}function a(e){try{u(n.throw(e))}catch(e){i(e)}}function u(e){e.done?o(e.value):new r((function(t){t(e.value)})).then(s,a)}u((n=n.apply(e,t||[])).next())}))},n=this&&this.__generator||function(e,t){var r,n,o,i,s={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function a(i){return function(a){return function(i){if(r)throw new TypeError("Generator is already executing.");for(;s;)try{if(r=1,n&&(o=2&i[0]?n.return:i[0]?n.throw||((o=n.return)&&o.call(n),0):n.next)&&!(o=o.call(n,i[1])).done)return o;switch(n=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return s.label++,{value:i[1],done:!1};case 5:s.label++,n=i[1],i=[0];continue;case 7:i=s.ops.pop(),s.trys.pop();continue;default:if(!(o=(o=s.trys).length>0&&o[o.length-1])&&(6===i[0]||2===i[0])){s=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){s.label=i[1];break}if(6===i[0]&&s.label<o[1]){s.label=o[1],o=i;break}if(o&&s.label<o[2]){s.label=o[2],s.ops.push(i);break}o[2]&&s.ops.pop(),s.trys.pop();continue}i=t.call(e,s)}catch(e){i=[6,e],n=0}finally{r=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,a])}}};Object.defineProperty(t,"__esModule",{value:!0}),function(e){e[e.CALLING_INTERCEPTION_REQUEST=0]="CALLING_INTERCEPTION_REQUEST",e[e.CALLING_INTERCEPTION_RESPONSE=1]="CALLING_INTERCEPTION_RESPONSE"}(t.PROCESS_STATE||(t.PROCESS_STATE={}));var o=function(){function t(){var t=this;this.history=[],this.addState=function(r){void 0!==e&&void 0!==e.env&&"testing"===e.env.TEST_MODE&&t.history.push(r)},this.getEventByLastEventByName=function(e){for(var r=t.history.length-1;r>=0;r--)if(t.history[r]==e)return t.history[r]},this.reset=function(){t.history=[]},this.waitForEvent=function(e,o){return void 0===o&&(o=7e3),r(t,void 0,void 0,(function(){var t,r=this;return n(this,(function(n){return t=Date.now(),[2,new Promise((function(n){var i=r;!function r(){var s=i.getEventByLastEventByName(e);void 0===s?Date.now()-t>o?n(void 0):setTimeout(r,1e3):n(s)}()}))]}))}))}}return t.getInstance=function(){return null==t.instance&&(t.instance=new t),t.instance},t}();t.ProcessState=o}).call(this,r(6))},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e){for(var r in e)t.hasOwnProperty(r)||(t[r]=e[r])}(r(4))},function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{u(n.next(e))}catch(e){i(e)}}function a(e){try{u(n.throw(e))}catch(e){i(e)}}function u(e){e.done?o(e.value):new r((function(t){t(e.value)})).then(s,a)}u((n=n.apply(e,t||[])).next())}))},o=this&&this.__generator||function(e,t){var r,n,o,i,s={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function a(i){return function(a){return function(i){if(r)throw new TypeError("Generator is already executing.");for(;s;)try{if(r=1,n&&(o=2&i[0]?n.return:i[0]?n.throw||((o=n.return)&&o.call(n),0):n.next)&&!(o=o.call(n,i[1])).done)return o;switch(n=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return s.label++,{value:i[1],done:!1};case 5:s.label++,n=i[1],i=[0];continue;case 7:i=s.ops.pop(),s.trys.pop();continue;default:if(!(o=(o=s.trys).length>0&&o[o.length-1])&&(6===i[0]||2===i[0])){s=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){s.label=i[1];break}if(6===i[0]&&s.label<o[1]){s.label=o[1],o=i;break}if(o&&s.label<o[2]){s.label=o[2],s.ops.push(i);break}o[2]&&s.ops.pop(),s.trys.pop();continue}i=t.call(e,s)}catch(e){i=[6,e],n=0}finally{r=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,a])}}},i=this;Object.defineProperty(t,"__esModule",{value:!0});var s=r(1),a=r(13),u=function(){function e(){}return e.init=function(e){s.default.init(e)},e.setAuth0API=function(e){return s.default.setAuth0API(e)},e.getUserId=function(){return s.default.getUserId()},e.getJWTPayloadSecurely=function(){return n(this,void 0,void 0,(function(){return o(this,(function(e){return[2,s.default.getJWTPayloadSecurely()]}))}))},e.getAuth0API=function(){return s.default.getAuth0API()},e.getRefreshURLDomain=function(){return s.default.getRefreshURLDomain()},e.attemptRefreshingSession=function(){return n(i,void 0,void 0,(function(){return o(this,(function(e){return[2,s.default.attemptRefreshingSession()]}))}))},e.doesSessionExist=function(){return s.default.doesSessionExist()},e.addAxiosInterceptors=function(e){return a.default.addAxiosInterceptors(e)},e.signOut=function(){return s.default.signOut()},e}();t.default=u,t.init=u.init,t.setAuth0API=u.setAuth0API,t.getAuth0API=u.getAuth0API,t.getRefreshURLDomain=u.getRefreshURLDomain,t.getUserId=u.getUserId,t.getJWTPayloadSecurely=u.getJWTPayloadSecurely,t.attemptRefreshingSession=u.attemptRefreshingSession,t.doesSessionExist=u.doesSessionExist,t.addAxiosInterceptors=u.addAxiosInterceptors,t.signOut=u.signOut},function(e,t){var r;r=function(){return this}();try{r=r||new Function("return this")()}catch(e){"object"==typeof window&&(r=window)}e.exports=r},function(e,t){var r,n,o=e.exports={};function i(){throw new Error("setTimeout has not been defined")}function s(){throw new Error("clearTimeout has not been defined")}function a(e){if(r===setTimeout)return setTimeout(e,0);if((r===i||!r)&&setTimeout)return r=setTimeout,setTimeout(e,0);try{return r(e,0)}catch(t){try{return r.call(null,e,0)}catch(t){return r.call(this,e,0)}}}!function(){try{r="function"==typeof setTimeout?setTimeout:i}catch(e){r=i}try{n="function"==typeof clearTimeout?clearTimeout:s}catch(e){n=s}}();var u,c=[],l=!1,d=-1;function f(){l&&u&&(l=!1,u.length?c=u.concat(c):d=-1,c.length&&h())}function h(){if(!l){var e=a(f);l=!0;for(var t=c.length;t;){for(u=c,c=[];++d<t;)u&&u[d].run();d=-1,t=c.length}u=null,l=!1,function(e){if(n===clearTimeout)return clearTimeout(e);if((n===s||!n)&&clearTimeout)return n=clearTimeout,clearTimeout(e);try{n(e)}catch(t){try{return n.call(null,e)}catch(t){return n.call(this,e)}}}(e)}}function v(e,t){this.fun=e,this.array=t}function p(){}o.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)t[r-1]=arguments[r];c.push(new v(e,t)),1!==c.length||l||a(h)},v.prototype.run=function(){this.fun.apply(null,this.array)},o.title="browser",o.browser=!0,o.env={},o.argv=[],o.version="",o.versions={},o.on=p,o.addListener=p,o.once=p,o.off=p,o.removeListener=p,o.removeAllListeners=p,o.emit=p,o.prependListener=p,o.prependOnceListener=p,o.listeners=function(e){return[]},o.binding=function(e){throw new Error("process.binding is not supported")},o.cwd=function(){return"/"},o.chdir=function(e){throw new Error("process.chdir is not supported")},o.umask=function(){return 0}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.package_version="5.1.0",t.supported_fdi=["1.7"]},function(e,t,r){"use strict";var n=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{u(n.next(e))}catch(e){i(e)}}function a(e){try{u(n.throw(e))}catch(e){i(e)}}function u(e){e.done?o(e.value):new r((function(t){t(e.value)})).then(s,a)}u((n=n.apply(e,t||[])).next())}))},o=this&&this.__generator||function(e,t){var r,n,o,i,s={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function a(i){return function(a){return function(i){if(r)throw new TypeError("Generator is already executing.");for(;s;)try{if(r=1,n&&(o=2&i[0]?n.return:i[0]?n.throw||((o=n.return)&&o.call(n),0):n.next)&&!(o=o.call(n,i[1])).done)return o;switch(n=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return s.label++,{value:i[1],done:!1};case 5:s.label++,n=i[1],i=[0];continue;case 7:i=s.ops.pop(),s.trys.pop();continue;default:if(!(o=(o=s.trys).length>0&&o[o.length-1])&&(6===i[0]||2===i[0])){s=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){s.label=i[1];break}if(6===i[0]&&s.label<o[1]){s.label=o[1],o=i;break}if(o&&s.label<o[2]){s.label=o[2],s.ops.push(i);break}o[2]&&s.ops.pop(),s.trys.pop();continue}i=t.call(e,s)}catch(e){i=[6,e],n=0}finally{r=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,a])}}};Object.defineProperty(t,"__esModule",{value:!0});var i=r(9);function s(e){return new Promise((function(t){return setTimeout(t,e)}))}function a(e){for(var t="0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",r="",n=0;n<e;n++){r+=t[Math.floor(Math.random()*t.length)]}return r}var u=function(){function e(){this.acquiredIatSet=new Set,this.id=Date.now().toString()+a(15),this.acquireLock=this.acquireLock.bind(this),this.releaseLock=this.releaseLock.bind(this),this.releaseLock__private__=this.releaseLock__private__.bind(this),this.waitForSomethingToChange=this.waitForSomethingToChange.bind(this),this.refreshLockWhileAcquired=this.refreshLockWhileAcquired.bind(this),void 0===e.waiters&&(e.waiters=[])}return e.prototype.acquireLock=function(t,r){return void 0===r&&(r=5e3),n(this,void 0,void 0,(function(){var n,i,u,c,l,d;return o(this,(function(o){switch(o.label){case 0:n=Date.now()+a(4),i=Date.now()+r,u="browser-tabs-lock-key-"+t,c=window.localStorage,o.label=1;case 1:return Date.now()<i?[4,s(30)]:[3,8];case 2:return o.sent(),null!==c.getItem(u)?[3,5]:(l=this.id+"-"+t+"-"+n,[4,s(Math.floor(25*Math.random()))]);case 3:return o.sent(),c.setItem(u,JSON.stringify({id:this.id,iat:n,timeoutKey:l,timeAcquired:Date.now(),timeRefreshed:Date.now()})),[4,s(30)];case 4:return o.sent(),null!==(d=c.getItem(u))&&(d=JSON.parse(d)).id===this.id&&d.iat===n?(this.acquiredIatSet.add(n),this.refreshLockWhileAcquired(u,n),[2,!0]):[3,7];case 5:return e.lockCorrector(),[4,this.waitForSomethingToChange(i)];case 6:o.sent(),o.label=7;case 7:return n=Date.now()+a(4),[3,1];case 8:return[2,!1]}}))}))},e.prototype.refreshLockWhileAcquired=function(e,t){return n(this,void 0,void 0,(function(){var r=this;return o(this,(function(s){return setTimeout((function(){return n(r,void 0,void 0,(function(){var r,n;return o(this,(function(o){switch(o.label){case 0:return[4,i.default().lock(t)];case 1:return o.sent(),this.acquiredIatSet.has(t)?(r=window.localStorage,null===(n=r.getItem(e))?(i.default().unlock(t),[2]):((n=JSON.parse(n)).timeRefreshed=Date.now(),r.setItem(e,JSON.stringify(n)),i.default().unlock(t),this.refreshLockWhileAcquired(e,t),[2])):(i.default().unlock(t),[2])}}))}))}),1e3),[2]}))}))},e.prototype.waitForSomethingToChange=function(t){return n(this,void 0,void 0,(function(){return o(this,(function(r){switch(r.label){case 0:return[4,new Promise((function(r){var n=!1,o=Date.now(),i=50,s=!1;function a(){if(s||(window.removeEventListener("storage",a),e.removeFromWaiting(a),clearTimeout(u),s=!0),!n){n=!0;var t=i-(Date.now()-o);t>0?setTimeout(r,t):r()}}window.addEventListener("storage",a),e.addToWaiting(a);var u=setTimeout(a,Math.max(0,t-Date.now()))}))];case 1:return r.sent(),[2]}}))}))},e.addToWaiting=function(t){this.removeFromWaiting(t),void 0!==e.waiters&&e.waiters.push(t)},e.removeFromWaiting=function(t){void 0!==e.waiters&&(e.waiters=e.waiters.filter((function(e){return e!==t})))},e.notifyWaiters=function(){void 0!==e.waiters&&e.waiters.slice().forEach((function(e){return e()}))},e.prototype.releaseLock=function(e){return n(this,void 0,void 0,(function(){return o(this,(function(t){switch(t.label){case 0:return[4,this.releaseLock__private__(e)];case 1:return[2,t.sent()]}}))}))},e.prototype.releaseLock__private__=function(t){return n(this,void 0,void 0,(function(){var r,n,s;return o(this,(function(o){switch(o.label){case 0:return r=window.localStorage,n="browser-tabs-lock-key-"+t,null===(s=r.getItem(n))?[2]:(s=JSON.parse(s)).id!==this.id?[3,2]:[4,i.default().lock(s.iat)];case 1:o.sent(),this.acquiredIatSet.delete(s.iat),r.removeItem(n),i.default().unlock(s.iat),e.notifyWaiters(),o.label=2;case 2:return[2]}}))}))},e.lockCorrector=function(){for(var t=Date.now()-5e3,r=window.localStorage,n=Object.keys(r),o=!1,i=0;i<n.length;i++){var s=n[i];if(s.includes("browser-tabs-lock-key")){var a=r.getItem(s);null!==a&&(void 0===(a=JSON.parse(a)).timeRefreshed&&a.timeAcquired<t||void 0!==a.timeRefreshed&&a.timeRefreshed<t)&&(r.removeItem(s),o=!0)}}o&&e.notifyWaiters()},e.waiters=void 0,e}();t.default=u},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(){var e=this;this.locked=new Map,this.addToLocked=function(t,r){var n=e.locked.get(t);void 0===n?void 0===r?e.locked.set(t,[]):e.locked.set(t,[r]):void 0!==r&&(n.unshift(r),e.locked.set(t,n))},this.isLocked=function(t){return e.locked.has(t)},this.lock=function(t){return new Promise((function(r,n){e.isLocked(t)?e.addToLocked(t,r):(e.addToLocked(t),r())}))},this.unlock=function(t){var r=e.locked.get(t);if(void 0!==r&&0!==r.length){var n=r.pop();e.locked.set(t,r),void 0!==n&&setTimeout(n,0)}else e.locked.delete(t)}}return e.getInstance=function(){return void 0===e.instance&&(e.instance=new e),e.instance},e}();t.default=function(){return n.getInstance()}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(0),o=function(e){var t=this;this.getAsStringDangerous=function(){return t.value},this.value=i(e)};function i(e,t){void 0===t&&(t=!1),e=e.trim().toLowerCase();try{if(!e.startsWith("http://")&&!e.startsWith("https://")&&!e.startsWith("supertokens://"))throw new Error("converting to proper URL");var r=new URL(e);return e=t?r.hostname.startsWith("localhost")||n.isAnIpAddress(r.hostname)?"http://"+r.host:"https://"+r.host:r.protocol+"//"+r.host}catch(e){}if(e.startsWith("/"))throw new Error("Please provide a valid domain name");if(0===e.indexOf(".")&&(e=e.substr(1)),(-1!==e.indexOf(".")||e.startsWith("localhost"))&&!e.startsWith("http://")&&!e.startsWith("https://")){e="https://"+e;try{return new URL(e),i(e,!0)}catch(e){}}throw new Error("Please provide a valid domain name")}t.default=o,t.normaliseURLDomainOrThrowError=i},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function e(t){var r=this;this.startsWith=function(e){return r.value.startsWith(e.value)},this.appendPath=function(t){return new e(r.value+t.value)},this.getAsStringDangerous=function(){return r.value},this.equals=function(e){return r.value===e.value},this.isARecipePath=function(){return"/recipe"===r.value||r.value.startsWith("/recipe/")},this.value=o(t)};function o(e){e=e.trim().toLowerCase();try{if(!e.startsWith("http://")&&!e.startsWith("https://"))throw new Error("converting to proper URL");return"/"===(e=new URL(e).pathname).charAt(e.length-1)?e.substr(0,e.length-1):e}catch(e){}if((function(e){if(-1===e.indexOf(".")||e.startsWith("/"))return!1;try{return-1!==new URL(e).hostname.indexOf(".")}catch(e){}try{return-1!==new URL("http://"+e).hostname.indexOf(".")}catch(e){}return!1}(e)||e.startsWith("localhost"))&&!e.startsWith("http://")&&!e.startsWith("https://"))return o(e="http://"+e);"/"!==e.charAt(0)&&(e="/"+e);try{return new URL("http://example.com"+e),o("http://example.com"+e)}catch(e){throw new Error("Please provide a valid URL path")}}t.default=n,t.normaliseURLPathOrThrowError=o},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(0),o=function(e){this.sessionScope=void 0,this.getItem=function(e){return n.getWindowOrThrow().localStorage.getItem(e)},this.removeItem=function(e){return n.getWindowOrThrow().localStorage.removeItem(e)},this.setItem=function(e,t){return n.getWindowOrThrow().localStorage.setItem(e,t)},this.sessionScope=e};t.default=o},function(e,t,r){"use strict";var n=this&&this.__assign||function(){return(n=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var o in t=arguments[r])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)},o=this&&this.__awaiter||function(e,t,r,n){return new(r||(r=Promise))((function(o,i){function s(e){try{u(n.next(e))}catch(e){i(e)}}function a(e){try{u(n.throw(e))}catch(e){i(e)}}function u(e){e.done?o(e.value):new r((function(t){t(e.value)})).then(s,a)}u((n=n.apply(e,t||[])).next())}))},i=this&&this.__generator||function(e,t){var r,n,o,i,s={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function a(i){return function(a){return function(i){if(r)throw new TypeError("Generator is already executing.");for(;s;)try{if(r=1,n&&(o=2&i[0]?n.return:i[0]?n.throw||((o=n.return)&&o.call(n),0):n.next)&&!(o=o.call(n,i[1])).done)return o;switch(n=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return s.label++,{value:i[1],done:!1};case 5:s.label++,n=i[1],i=[0];continue;case 7:i=s.ops.pop(),s.trys.pop();continue;default:if(!(o=(o=s.trys).length>0&&o[o.length-1])&&(6===i[0]||2===i[0])){s=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){s.label=i[1];break}if(6===i[0]&&s.label<o[1]){s.label=o[1],o=i;break}if(o&&s.label<o[2]){s.label=o[2],s.ops.push(i);break}o[2]&&s.ops.pop(),s.trys.pop();continue}i=t.call(e,s)}catch(e){i=[6,e],n=0}finally{r=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,a])}}},s=this;Object.defineProperty(t,"__esModule",{value:!0});var a=r(1),u=r(2),c=r(0);function l(e){var t=void 0===e.url?"":e.url,r=e.baseURL;return void 0!==r&&(t="/"===t.charAt(0)&&"/"===r.charAt(r.length-1)?r+t.substr(1):"/"!==t.charAt(0)&&"/"!==r.charAt(r.length-1)?r+"/"+t:r+t),t}function d(e){return o(this,void 0,void 0,(function(){var t,r,o,s,d;return i(this,(function(i){t=l(e),r=!1;try{r="string"==typeof t&&c.normaliseURLDomainOrThrowError(t)!==a.default.apiDomain}catch(e){if("Please provide a valid domain name"!==e.message)throw e;r=c.normaliseURLDomainOrThrowError(window.location.origin)!==a.default.apiDomain}return r?[2,e]:(u.ProcessState.getInstance().addState(u.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST),o=a.getIdRefreshToken(),s=a.AntiCsrfToken.getToken(o),d=e,void 0!==s&&(d=n({},d,{headers:void 0===d?{"anti-csrf":s}:n({},d.headers,{"anti-csrf":s})})),a.default.autoAddCredentials&&void 0===d.withCredentials&&(d=n({},d,{withCredentials:!0})),[2,d])}))}))}function f(e){var t=this;return function(r){return o(t,void 0,void 0,(function(){var t,n,o,s,d,f;return i(this,(function(i){try{if(!a.default.initCalled)throw new Error("init function not called");t=l(r.config),n=!1;try{n="string"==typeof t&&c.normaliseURLDomainOrThrowError(t)!==a.default.apiDomain}catch(e){if("Please provide a valid domain name"!==e.message)throw e;n=c.normaliseURLDomainOrThrowError(window.location.origin)!==a.default.apiDomain}return n?[2,r]:(u.ProcessState.getInstance().addState(u.PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE),void 0!==(o=r.headers["id-refresh-token"])&&a.setIdRefreshToken(o),r.status===a.default.sessionExpiredStatusCode?(s=r.config,[2,h.doRequest((function(t){return e(t)}),s,t,r,!0)]):(void 0!==(d=r.headers["anti-csrf"])&&a.AntiCsrfToken.setItem(a.getIdRefreshToken(),d),void 0!==(f=r.headers["front-token"])&&a.FrontToken.setItem(f),[2,r]))}finally{void 0===a.getIdRefreshToken()&&(a.AntiCsrfToken.removeToken(),a.FrontToken.removeToken())}return[2]}))}))}}t.interceptorFunctionRequestFulfilled=d,t.responseInterceptor=f;var h=function(){function e(){}return e.doRequest=function(e,t,r,u,l,d){return void 0===d&&(d=!1),o(s,void 0,void 0,(function(){var o,s,f,h,v,p,w,m,g,T,y,k,S,b;return i(this,(function(i){switch(i.label){case 0:if(!a.default.initCalled)throw Error("init function not called");o=!1;try{o="string"==typeof r&&c.normaliseURLDomainOrThrowError(r)!==a.default.apiDomain&&d}catch(e){if("Please provide a valid domain name"!==e.message)throw e;o=c.normaliseURLDomainOrThrowError(window.location.origin)!==a.default.apiDomain&&d}if(!o)return[3,2];if(void 0!==l)throw l;return void 0!==u?[2,u]:[4,e(t)];case 1:return[2,i.sent()];case 2:i.trys.push([2,,17,18]),s=!1,f=void 0,i.label=3;case 3:0,h=a.getIdRefreshToken(),v=a.AntiCsrfToken.getToken(h),p=t,void 0!==v&&(p=n({},p,{headers:void 0===p?{"anti-csrf":v}:n({},p.headers,{"anti-csrf":v})})),a.default.autoAddCredentials&&void 0===p.withCredentials&&(p=n({},p,{withCredentials:!0})),i.label=4;case 4:if(i.trys.push([4,11,,15]),w=l,m=u,l=void 0,u=void 0,void 0!==w)throw w;return void 0!==m?[3,6]:[4,e(p)];case 5:return T=i.sent(),[3,7];case 6:T=m,i.label=7;case 7:return void 0!==(y=(g=T).headers["id-refresh-token"])&&a.setIdRefreshToken(y),g.status!==a.default.sessionExpiredStatusCode?[3,9]:[4,a.handleUnauthorised(a.default.refreshTokenUrl,h,a.default.refreshAPICustomHeaders,a.default.sessionExpiredStatusCode)];case 8:return i.sent()?[3,10]:(f=g,[3,16]);case 9:return void 0!==(k=g.headers["anti-csrf"])&&a.AntiCsrfToken.setItem(a.getIdRefreshToken(),k),void 0!==(S=g.headers["front-token"])&&a.FrontToken.setItem(S),[2,g];case 10:return[3,15];case 11:return void 0===(b=i.sent()).response||b.response.status!==a.default.sessionExpiredStatusCode?[3,13]:[4,a.handleUnauthorised(a.default.refreshTokenUrl,h,a.default.refreshAPICustomHeaders,a.default.sessionExpiredStatusCode)];case 12:return i.sent()?[3,14]:(s=!0,f=b,[3,16]);case 13:throw b;case 14:return[3,15];case 15:return[3,3];case 16:if(s)throw f;return[2,f];case 17:return void 0===a.getIdRefreshToken()&&(a.AntiCsrfToken.removeToken(),a.FrontToken.removeToken()),[7];case 18:return[2]}}))}))},e.addAxiosInterceptors=function(t){for(var r=t.interceptors.request,n=0;n<r.handlers.length;n++)if(r.handlers[n].fulfilled===d)return;t.interceptors.request.use(d,(function(e){return o(this,void 0,void 0,(function(){return i(this,(function(t){throw e}))}))})),t.interceptors.response.use(f(t),(function(r){return o(this,void 0,void 0,(function(){var n;return i(this,(function(o){if(!a.default.initCalled)throw new Error("init function not called");try{if(void 0!==r.response&&r.response.status===a.default.sessionExpiredStatusCode)return n=r.config,[2,e.doRequest((function(e){return t(e)}),n,l(n),void 0,r,!0)];throw r}finally{void 0===a.getIdRefreshToken()&&(a.AntiCsrfToken.removeToken(),a.FrontToken.removeToken())}return[2]}))}))}))},e}();t.default=h}]);