webpackJsonp([3],{0:function(e,t,n){"use strict";var r=n(1),o=n(30),s=n(723);n(165),n(556),document.addEventListener("DOMContentLoaded",function(){var e=window.__appData;o.render(r.createElement(s,e),document.querySelector("#app"))})},198:function(e,t,n){"use strict";var r=n(199);e.exports=function(e){return r("maphubs:"+e)}},202:function(e,t,n){"use strict";var r=n(198)("clientError");e.exports={checkClientError:function(e,t,n,o){t&&e&&e.body&&e.body.error?(r(e.body.error),n(e.body.error)):t?(r(t.message),n(t.message)):e&&e.body&&void 0!==e.body.success&&0==e.body.success?e.body.error?(r(e.body.error),n(e.body.error)):(r("unknown error"),n("unknown error")):e.body.error?(r(e.body.error),n(e.body.error)):o(e.body.success?n:n)}}},226:function(e,t,n){"use strict";var r=n(167),o=n(186)(r),s=n(227),a=n(193),i=n(198)("stores/local-store"),c=n(202).checkClientError;e.exports=r.createStore({mixins:[o],listenables:s,getInitialState:function(){return{locale:"en",_csrf:null}},reset:function(){this.setState(this.getInitialState())},storeDidUpdate:function(){i("store updated")},changeLocale:function(e){var t=this;a.post("/api/user/setlocale").type("json").accept("json").send({locale:e}).end(function(n,r){c(r,n,function(n){n?i(n):(i("changed locale to: "+e),t.setState({locale:e}),t.trigger(t.state))},function(e){e()})})}})},227:function(e,t,n){"use strict";var r=n(167),o=r.createActions({changeLocale:{}});e.exports=o},568:function(e,t){"use strict";e.exports={getBaseUrl:function(e){var t,n;e?(t=MAPHUBS_CONFIG.host_internal,n=MAPHUBS_CONFIG.internal_port):(t=MAPHUBS_CONFIG.host,n=MAPHUBS_CONFIG.port);var r="http://";MAPHUBS_CONFIG.https&&!e&&(r="https://");var o=r+t;return 80!=n&&(o+=":"+n),o},getUrlParameter:function(e){if("undefined"!=typeof window){var t,n,r=decodeURIComponent(window.location.search.substring(1)),o=r.split("&");for(n=0;n<o.length;n++)if(t=o[n].split("="),t[0]===e)return void 0===t[1]||t[1]}}}},723:function(e,t,n){"use strict";var r=n(1),o=n(568),s=n(167),a=n(186)(s),i=n(226),c=n(228),l=r.createClass({displayName:"OAuthDialog",mixins:[a.connect(i,{initWithProps:["locale","_csrf"]})],__:function(e){return c.getLocaleString(this.state.locale,e)},propTypes:{locale:r.PropTypes.string.isRequired,user:r.PropTypes.string,client:r.PropTypes.string,transactionID:r.PropTypes.string},getDefaultProps:function(){return{user:"Unknown",client:"Unknown",transactionID:""}},render:function(){var e=o.getBaseUrl(),t=e+"/edit/land.html";return r.createElement("div",{className:"container"},r.createElement("p",null,"Hi ",this.props.user,"!"),r.createElement("p",null,r.createElement("b",null,this.props.client)," ",this.__("is requesting access to your account")),r.createElement("p",null,this.__("Do you approve?")),r.createElement("form",{action:"/dialog/authorize/decision",method:"post"},r.createElement("input",{name:"transaction_id",type:"hidden",value:this.props.transactionID}),r.createElement("input",{type:"hidden",name:"oauth_callback",id:"oauth_callback",value:t}),r.createElement("div",null,r.createElement("input",{type:"submit",value:"Allow",id:"allow"}),r.createElement("input",{type:"submit",value:"Deny",name:"cancel",id:"deny"}))))}});e.exports=l}});