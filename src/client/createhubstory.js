import React from 'react';
import ReactDOM from 'react-dom';

import CreateHubStory from '../views/createhubstory';

require('jquery');
require("materialize-css");

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

require('./story.css');
require('../../node_modules/mapbox-gl/dist/mapbox-gl.css');
require('@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css');
require('medium-editor/dist/css/medium-editor.css');
require('medium-editor/dist/css/themes/flat.css');
require("cropperjs/dist/cropper.css");
require('../../node_modules/slick-carousel/slick/slick.css');
require('../../node_modules/slick-carousel/slick/slick-theme.css');

document.addEventListener('DOMContentLoaded', () => {
  const data = window.__appData;

  ReactDOM.hydrate(
    <CreateHubStory {...data}/>,
    document.querySelector('#app')
  );
});
