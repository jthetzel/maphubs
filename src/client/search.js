import React from 'react';
import ReactDOM from 'react-dom';

require('babel-polyfill');
require('jquery');
require("materialize-css");
import Search from '../views/search';

require('../../assets/assets/js/mapbox-gl/mapbox-gl-0-32-1.css');
require('../../assets/assets/js/mapbox-gl/mapbox-gl-draw.css');
require('../../node_modules/slick-carousel/slick/slick.css');
require('../../node_modules/slick-carousel/slick/slick-theme.css');


document.addEventListener('DOMContentLoaded', () => {
  let data = window.__appData;

  ReactDOM.render(
    <Search {...data}/>,
    document.querySelector('#app')
  );
});
