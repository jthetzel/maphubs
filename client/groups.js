const React  = require('react');
const ReactDOM = require('react-dom');

const Groups = require('../views/groups');

require('jquery');
require("materialize-css");
require("materialize-css/dist/css/materialize.min.css");
require('../css/app.css');
require('../node_modules/slick-carousel/slick/slick.css');
require('../node_modules/slick-carousel/slick/slick-theme.css');

document.addEventListener('DOMContentLoaded', () => {
  let data = window.__appData;

  ReactDOM.render(
    <Groups groups={data.groups} locale={data.locale}/>,
    document.querySelector('#app')
  );

});