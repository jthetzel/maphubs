import React from 'react';
import ReactDOM from 'react-dom';

import Auth0Invite from '../views/auth0invite';

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

document.addEventListener('DOMContentLoaded', () => {
  const data = window.__appData;

  ReactDOM.hydrate(
    <Auth0Invite {...data}/>,
    document.querySelector('#app')
  );
});
