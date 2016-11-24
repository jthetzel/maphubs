const React  = require('react');
const ReactDOM = require('react-dom');

const HubInfo = require('../views/hubinfo');
if (!global.Intl) {
 require('intl');
 require('intl/locale-data/jsonp/en.js');
 require('intl/locale-data/jsonp/es.js');
 require('intl/locale-data/jsonp/fr.js');
 require('intl/locale-data/jsonp/it.js');
}
require('babel-polyfill');
require('jquery');
require('../../node_modules/react-colorpickr/dist/colorpickr.css');
require("materialize-css");

require('./story.css');
require('../../assets/assets/js/mapbox-gl/mapbox-gl.css');
require('medium-editor/dist/css/medium-editor.css');
require('medium-editor/dist/css/themes/flat.css');
require("cropperjs/dist/cropper.css");

document.addEventListener('DOMContentLoaded', () => {
  let data = window.__appData;

  ReactDOM.render(
    <HubInfo {...data}/>,
    document.querySelector('#app')
  );
});