webpackJsonp([3],{0:function(e,t,n){"use strict";var r=n(1),o=n(28),s=n(844);n(168),n(596),document.addEventListener("DOMContentLoaded",function(){var e=window.__appData;o.render(r.createElement(s,e),document.querySelector("#app"))})},201:function(e,t,n){"use strict";var r=n(202);e.exports=function(e){return r("maphubs:"+e)}},205:function(e,t,n){"use strict";var r=n(201)("clientError");e.exports={checkClientError:function(e,t,n,o){t&&e&&e.body&&e.body.error?(r(e.body.error),n(e.body.error)):t?(r(t.message),n(t.message)):e&&e.body&&void 0!==e.body.success&&0==e.body.success?e.body.error?(r(e.body.error),n(e.body.error)):(r("unknown error"),n("unknown error")):e.body.error?(r(e.body.error),n(e.body.error)):o(e.body.success?n:n)}}},266:function(e,t,n){"use strict";var r=n(170),o=n(189)(r),s=n(267),i=n(196),a=n(201)("stores/local-store"),c=n(205).checkClientError;e.exports=r.createStore({mixins:[o],listenables:s,getInitialState:function(){return{locale:"en",_csrf:null}},reset:function(){this.setState(this.getInitialState())},storeDidUpdate:function(){a("store updated")},changeLocale:function(e){var t=this;i.post("/api/user/setlocale").type("json").accept("json").send({locale:e}).end(function(n,r){c(r,n,function(n){n?a(n):(a("changed locale to: "+e),t.setState({locale:e}),t.trigger(t.state))},function(e){e()})})}})},267:function(e,t,n){"use strict";var r=n(170),o=r.createActions({changeLocale:{}});e.exports=o},608:function(e,t){"use strict";e.exports={getBaseUrl:function(){var e,t,n=arguments.length>0&&void 0!==arguments[0]&&arguments[0];n?(e=MAPHUBS_CONFIG.host_internal,t=MAPHUBS_CONFIG.internal_port):(e=MAPHUBS_CONFIG.host,t=MAPHUBS_CONFIG.port);var r="http://";MAPHUBS_CONFIG.https&&!n&&(r="https://");var o=r+e;return 80!=t&&(o+=":"+t),o},getUrlParameter:function(e){if("undefined"!=typeof window){var t,n,r=decodeURIComponent(window.location.search.substring(1)),o=r.split("&");for(n=0;n<o.length;n++)if(t=o[n].split("="),t[0]===e)return void 0===t[1]||t[1]}}}},844:function(e,t,n){"use strict";var r=n(1),o=n(608),s=n(170),i=n(189)(s),a=n(266),c=n(268),l=r.createClass({displayName:"OAuthDialog",mixins:[i.connect(a,{initWithProps:["locale","_csrf"]})],__:function(e){return c.getLocaleString(this.state.locale,e)},propTypes:{locale:r.PropTypes.string.isRequired,user:r.PropTypes.string,client:r.PropTypes.string,transactionID:r.PropTypes.string},getDefaultProps:function(){return{user:"Unknown",client:"Unknown",transactionID:""}},render:function(){var e=o.getBaseUrl(),t=e+"/edit/land.html";return r.createElement("div",{className:"container"},r.createElement("p",null,"Hi ",this.props.user,"!"),r.createElement("p",null,r.createElement("b",null,this.props.client)," ",this.__("is requesting access to your account")),r.createElement("p",null,this.__("Do you approve?")),r.createElement("form",{action:"/dialog/authorize/decision",method:"post"},r.createElement("input",{name:"transaction_id",type:"hidden",value:this.props.transactionID}),r.createElement("input",{type:"hidden",name:"oauth_callback",id:"oauth_callback",value:t}),r.createElement("div",null,r.createElement("input",{type:"submit",value:"Allow",id:"allow"}),r.createElement("input",{type:"submit",value:"Deny",name:"cancel",id:"deny"}))))}});e.exports=l}});