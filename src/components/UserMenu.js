// @flow
import React from 'react'
import MapHubsComponent from './MapHubsComponent'
import UserStore from '../stores/UserStore'
import UserActions from '../actions/UserActions'
import Gravatar from './user/Gravatar'
import UserIcon from './user/UserIcon'
import _isequal from 'lodash.isequal'
import urlencode from 'urlencode'
import type {UserStoreState} from '../stores/UserStore'

const $ = require('jquery')

type Props = {
    id: string,
    sideNav: boolean
  }

type State = {
  loaded: boolean
} & UserStoreState

export default class UserMenu extends MapHubsComponent<Props, State> {
  props: Props

  static defaultProps: Props = {
    id: 'user-menu',
    sideNav: false
  }

  state: State

  constructor (props: Props) {
    super(props)
    this.stores.push(UserStore)
  }

  componentDidMount () {
    UserActions.getUser(() => {})
  }

  shouldComponentUpdate (nextProps: Props, nextState: State) {
    // only update if something changes

    if (!_isequal(this.props, nextProps)) {
      return true
    }
    if (!_isequal(this.state, nextState)) {
      return true
    }
    return false
  }

  componentDidUpdate (prevProps: Props, prevState: State) {
    if (this.state.loggedIn && !prevState.loggedIn) {
      $(this.refs.userButton).dropdown({
        inDuration: 300,
        outDuration: 225,
        constrainWidth: false, // Does not change width of dropdown to that of the activator
        hover: false, // Activate on hover
        gutter: 0, // Spacing from edge
        belowOrigin: true, // Displays dropdown below the button
        alignment: 'right' // Displays dropdown with edge aligned to the left of button
      })
    }
  }

  loginClick = () => {
    window.location = '/login?returnTo=' + urlencode(window.location.href)
  }

  render () {
    let user = (<div style={{width: '194px'}} />)
    if (!this.state.loaded) {
      return user
    }
    if (this.state.loggedIn && this.state.user) {
      let adminInvites = ''
      if (this.state.user.admin) {
        adminInvites = (
          <li className='usermenu-wrapper'><a href='/admin/manage'>{this.__('Manage Users')}</a></li>
        )
      }

      let picture = ''
      if (this.state.user.picture) {
        picture = (
          <UserIcon {...this.state.user} />
        )
      } else {
        picture = (
          <Gravatar email={this.state.user.email} />
        )
      }

      const displayName = (this.state.user && this.state.user.display_name) ? this.state.user.display_name : ''

      user = (
        <li>
          <div ref='userButton' className='chip user-dropdown-button omh-btn' style={{marginRight: '5px', marginLeft: '5px', backgroundColor: '#FFF'}} data-activates={this.props.id}>
            {picture}
            {displayName}
            <i className='material-icons right' style={{marginLeft: 0, color: '#212121', height: '30px', lineHeight: '30px', width: '15px'}}>arrow_drop_down</i>
          </div>
          <ul id={this.props.id} className='dropdown-content' style={{top: '100px'}}>
            <li className='usermenu-wrapper'><a href={`/user/${displayName}/maps`}>{this.__('My Maps')}</a></li>
            <li className='divider' />
            <li className='usermenu-wrapper'><a href={`/user/${displayName}/stories`}>{this.__('My Stories')}</a></li>
            <li className='divider' />
            <li className='usermenu-wrapper'><a href={`/user/${displayName}/groups`}>{this.__('My Groups')}</a></li>
            <li className='divider' />
            <li className='usermenu-wrapper'><a href={`/user/${displayName}/hubs`}>{this.__('My Hubs')}</a></li>
            <li className='divider' />
            <li className='usermenu-wrapper'><a href='/user/profile'>{this.__('Settings')}</a></li>
            {adminInvites}
            <li className='divider' />
            <li className='usermenu-wrapper'><a href={'/logout'}>{this.__('Logout')}</a></li>
          </ul>

        </li>
      )
    } else {
      let style = {}
      if (!this.props.sideNav) {
        style = {marginLeft: '1px', marginRight: '5px'}
      }
      if (!MAPHUBS_CONFIG.mapHubsPro) {
        user = (
          <li className='nav-link-wrapper login-with-signup'>
            <a className='nav-link-item login-with-signup-link' style={{float: !this.props.sideNav ? 'left' : 'inherit'}} href='#' onClick={this.loginClick}>{this.__('Login')}</a>
            <a className='btn' style={style} href='/signup'>{this.__('Sign Up')}</a>
          </li>
        )
      } else {
        user = (
          <li className='nav-link-wrapper'>
            <a className='nav-link-item' style={{float: !this.props.sideNav ? 'left' : 'inherit'}} href='#' onClick={this.loginClick}>{this.__('Login')}</a>
          </li>
        )
      }
    }

    return user
  }
}
