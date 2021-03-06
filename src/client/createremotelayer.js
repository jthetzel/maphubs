import React from 'react';
import ReactDOM from 'react-dom';

import CreateRemoteLayer from '../views/createremotelayer';

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

require('../../node_modules/mapbox-gl/dist/mapbox-gl.css');
require('@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css');

document.addEventListener('DOMContentLoaded', () => {
  localStorage.debug = '*';
  const data = window.__appData;

  ReactDOM.hydrate(
    <CreateRemoteLayer {...data}/>,
    document.querySelector('#app')
  );
});
