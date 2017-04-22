import React from 'react';
import ReactDOM from 'react-dom';

import AdminUserInvite from '../views/adminuserinvite';

require('jquery');
require("materialize-css");


document.addEventListener('DOMContentLoaded', () => {
  let data = window.__appData;

  ReactDOM.render(
    <AdminUserInvite {...data}/>,
    document.querySelector('#app')
  );
});
