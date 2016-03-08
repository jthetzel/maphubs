const React  = require('react');
const ReactDOM = require('react-dom');

require('jquery');
require("materialize-css");
require("materialize-css/dist/css/materialize.min.css");
var Map = require('../views/globalsearchmap');

require('../css/app.css');
require('../node_modules/mapbox-gl/dist/mapbox-gl.css');
require('../node_modules/slick-carousel/slick/slick.css');
require('../node_modules/slick-carousel/slick/slick-theme.css');


document.addEventListener('DOMContentLoaded', () => {
  let data = window.__appData;

  ReactDOM.render(
    <Map locale={data.locale}/>,
    document.querySelector('#app')
  );
});