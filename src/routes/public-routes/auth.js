// @flow
const passport = require('passport')
const local = require('../../local')
// var log = require('../../services/log');
const urlencode = require('urlencode')

module.exports = function (app: any) {
  function checkReturnTo (req, res, next) {
    const returnTo = req.query['returnTo']
    if (returnTo) {
      // Maybe unnecessary, but just to be sure.
      req.session = req.session || {}

      // Set returnTo to the absolute path you want to be redirect to after the authentication succeeds.
      req.session.returnTo = urlencode.decode(returnTo)
    }
    next()
  }

  app.get('/login', checkReturnTo,
    (req, res) => {
      res.render('auth0login', {
        title: req.__('Login') + ' - ' + MAPHUBS_CONFIG.productName,
        props: {
          AUTH0_CLIENT_ID: local.AUTH0_CLIENT_ID,
          AUTH0_DOMAIN: local.AUTH0_DOMAIN,
          AUTH0_CALLBACK_URL: local.AUTH0_CALLBACK_URL,
          allowSignUp: false
        },
        login: true,
        req
      })
    })

  // Perform the final stage of authentication and redirect to '/user'
  app.get('/callback',
    passport.authenticate('auth0', {failureRedirect: '/login/failed'}),
    (req, res) => {
      req.session.user = req.user
      if (req.session.returnTo === '/public/auth0login.css') {
        req.session.returnTo = ''
      }

      req.session.save(() => {
        res.redirect(req.session.returnTo || '/')
      })
    })

  app.get('/login/failed', (req, res) => {
    res.render('auth0error', {
      title: req.__('Login Failed') + ' - ' + MAPHUBS_CONFIG.productName,
      props: {
        requireInvite: local.requireInvite,
        adminEmail: local.adminEmail
      },
      login: true,
      req
    })
  })
}
