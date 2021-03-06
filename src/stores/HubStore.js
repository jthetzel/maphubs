// @flow
import Reflux from 'reflux'
import Actions from '../actions/HubActions'
import type {Layer} from './layer-store'

const request = require('superagent')
const debug = require('../services/debug')('stores/hub-store')
const checkClientError = require('../services/client-error-response').checkClientError

export type Hub = {
  hub_id?: string,
  name?: string,
  description?: string,
  tagline?: string,
  resources?: string,
  about?: string,
  published?: boolean,
  map_id?: number,
  owned_by_group_id?: string,
  hasBannerImage?: boolean,
  hasLogoImage?: boolean,
  private?: boolean
}

export type HubStoreState = {
  hub: Hub,
  map?: Object,
  layers?: Array<Layer>,
  logoImage?: Object,
  bannerImage?: Object,
  logoImageInfo?: Object,
  bannerImageInfo?: Object,
  hasLogoImage?: boolean,
  hasBannerImage?: boolean,
  unsavedChanges?: boolean,
  saving?: boolean,
  created?: boolean
}

export default class HubStore extends Reflux.Store {
  state: HubStoreState

  constructor () {
    super()
    this.state = this.getDefaultState()
    this.listenables = Actions
  }

  getDefaultState (): HubStoreState {
    const hub: Hub = {
      hub_id: '',
      name: '',
      description: '',
      tagline: '',
      resources: '',
      about: '',
      hasLogoImage: false,
      hasBannerImage: false,
      published: false,
      private: false

    }

    const defaultState: HubStoreState = {
      hub,
      layers: [],
      hasLogoImage: false,
      hasBannerImage: false,
      unsavedChanges: false,
      saving: false
    }

    return defaultState
  }

  reset () {
    this.setState(this.getDefaultState())
  }

  storeDidUpdate () {
    debug.log('store updated')
  }

  // listeners
  loadHub (hub: Hub) {
    debug.log('load hub')
    this.setState({hub})
  }

  createHub (hub_id: string, group_id: string, name: string, published: boolean, isPrivate: boolean, _csrf: string, cb: Function) {
    debug.log('create hub')
    const _this = this

    request.post('/api/hub/create')
      .type('json').accept('json')
      .send({
        hub_id,
        group_id,
        name,
        published,
        private: isPrivate,
        _csrf
      })
      .end((err, res) => {
        checkClientError(res, err, cb, (cb) => {
          const hub = {
            hub_id,
            name,
            published
          }
          _this.setState({hub, created: true})
          _this.trigger(_this.state)
          cb(null)
        })
      })
  }

  saveHub (_csrf: string, cb: Function) {
    debug.log('save hub')
    const _this = this
    const hub_id = this.state.hub.hub_id ? this.state.hub.hub_id : 'unknown'
    const baseUrl = '/hub/' + hub_id

    this.setState({saving: true})
    request.post(baseUrl + '/api/save')
      .type('json').accept('json')
      .send({
        hub_id: this.state.hub.hub_id,
        name: this.state.hub.name,
        description: this.state.hub.description,
        tagline: this.state.hub.tagline,
        resources: this.state.hub.resources,
        about: this.state.hub.about,
        published: this.state.hub.published,
        map_id: this.state.hub.map_id,
        logoImage: this.state.logoImage,
        logoImageInfo: this.state.logoImageInfo,
        bannerImage: this.state.bannerImage,
        bannerImageInfo: this.state.bannerImageInfo,
        _csrf

      })
      .end((err, res) => {
        checkClientError(res, err, cb, (cb) => {
          _this.setState({saving: false, unsavedChanges: false})
          cb(null)
        })
      })
  }

  setPrivate (isPrivate: boolean, _csrf: string, cb: Function) {
    const _this = this
    debug.log('hub privacy')
    const hub_id = this.state.hub.hub_id ? this.state.hub.hub_id : 'unknown'
    const baseUrl = '/hub/' + hub_id
    request.post(baseUrl + '/api/privacy')
      .type('json').accept('json')
      .send({
        hub_id: this.state.hub.hub_id,
        private: isPrivate,
        _csrf
      })
      .end((err, res) => {
        checkClientError(res, err, cb, (cb) => {
          const hub = _this.state.hub
          hub.private = isPrivate
          _this.setState({hub})
          cb()
        })
      })
  }

  transferOwnership (to_group_id: string, _csrf: string, cb: Function) {
    const _this = this
    debug.log('hub privacy')
    const hub_id = this.state.hub.hub_id ? this.state.hub.hub_id : 'unknown'
    const baseUrl = '/hub/' + hub_id
    request.post(baseUrl + '/api/transfer')
      .type('json').accept('json')
      .send({
        hub_id: this.state.hub.hub_id,
        group_id: to_group_id,
        _csrf
      })
      .end((err, res) => {
        checkClientError(res, err, cb, (cb) => {
          const hub = _this.state.hub
          hub.owned_by_group_id = to_group_id
          _this.setState({hub})
          cb()
        })
      })
  }

  deleteHub (_csrf: string, cb: Function) {
    const _this = this
    debug.log('delete hub')
    const hub_id = this.state.hub.hub_id ? this.state.hub.hub_id : 'unknown'
    const baseUrl = '/hub/' + hub_id

    request.post(baseUrl + '/api/delete')
      .type('json').accept('json')
      .send({hub_id: this.state.hub.hub_id, _csrf})
      .end((err, res) => {
        checkClientError(res, err, cb, (cb) => {
          _this.setState({hub: {}})
          _this.trigger(_this.state)
          cb(null)
        })
      })
  }

  setMap (map: Object) {
    const hub = this.state.hub
    hub.map_id = map.map_id
    this.setState({hub, map, unsavedChanges: true})
  }

  setHubLogoImage (data: Object, info: Object) {
    const hub = this.state.hub
    hub.hasLogoImage = true
    this.setState({logoImage: data, logoImageInfo: info, unsavedChanges: true, hub})
  }

  setHubBannerImage (data: Object, info: Object) {
    const hub = this.state.hub
    hub.hasBannerImage = true
    this.setState({bannerImage: data, bannerImageInfo: info, unsavedChanges: true, hub})
  }

  setTitle (title: string) {
    const hub = this.state.hub
    hub.name = title
    this.setState({hub, unsavedChanges: true})
  }

  publish (_csrf: string, cb: Function) {
    const hub = this.state.hub
    hub.published = true
    this.setState({hub, unsavedChanges: true})
    this.trigger(this.state)
    this.saveHub(_csrf, cb)
  }

  setTagline (tagline: string) {
    const hub = this.state.hub
    hub.tagline = tagline
    this.setState({hub, unsavedChanges: true})
  }

  setDescription (description: string) {
    const hub = this.state.hub
    hub.description = description
    this.setState({hub, unsavedChanges: true})
  }

  setResources (resources: string) {
    const hub = this.state.hub
    hub.resources = resources
    this.setState({hub, unsavedChanges: true})
  }

  setAbout (about: string) {
    const hub = this.state.hub
    hub.about = about
    this.setState({hub, unsavedChanges: true})
  }
}
