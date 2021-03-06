import React from 'react';
import ReactDOM from 'react-dom';

import HubInfo from '../views/hubinfo';
if (!global.Intl) {
 require('intl');
 require('intl/locale-data/jsonp/en.js');
 require('intl/locale-data/jsonp/es.js');
 require('intl/locale-data/jsonp/fr.js');
 require('intl/locale-data/jsonp/it.js');
}

require('jquery');
require("materialize-css");

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

require('./story.css');
require('../../node_modules/slick-carousel/slick/slick.css');
require('../../node_modules/slick-carousel/slick/slick-theme.css');
require('../../node_modules/mapbox-gl/dist/mapbox-gl.css');
require('@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css');
require('medium-editor/dist/css/medium-editor.css');
require('medium-editor/dist/css/themes/flat.css');
require("cropperjs/dist/cropper.css");

document.addEventListener('DOMContentLoaded', () => {
  const data = window.__appData;

  ReactDOM.hydrate(
    <HubInfo {...data}/>,
    document.querySelector('#app')
  );
});
