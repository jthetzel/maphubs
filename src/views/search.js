// @flow
import React from 'react'
import Map from '../components/Map/Map'
import Header from '../components/header'
import Footer from '../components/footer'
import SearchBox from '../components/SearchBox'
import CardCollection from '../components/CardCarousel/CardCollection'
import request from 'superagent'
import _shuffle from 'lodash.shuffle'
import MessageActions from '../actions/MessageActions'
import NotificationActions from '../actions/NotificationActions'
import Progress from '../components/Progress'
import MapHubsComponent from '../components/MapHubsComponent'
import Reflux from '../components/Rehydrate'
import LocaleStore from '../stores/LocaleStore'
import BaseMapStore from '../stores/map/BaseMapStore'
import ErrorBoundary from '../components/ErrorBoundary'
import type {CardConfig} from '../components/CardCarousel/Card'

const cardUtil = require('../services/card-util')
const debug = require('../services/debug')('home')
const $ = require('jquery')

type Props = {
  locale: string,
  footerConfig: Object,
  headerConfig: Object,
  mapConfig: Object,
  _csrf: string
}

type State = {
  searchResult: any,
  searchCards: Array<CardConfig>,
  searching: boolean
}

export default class Search extends MapHubsComponent<Props, State> {
  props: Props

  state: State = {
    searchResult: null,
    searchCards: [],
    searching: false
  }

  constructor (props: Props) {
    super(props)
    this.stores.push(BaseMapStore)
    Reflux.rehydrate(LocaleStore, {locale: this.props.locale, _csrf: this.props._csrf})
    if (props.mapConfig && props.mapConfig.baseMapOptions) {
      Reflux.rehydrate(BaseMapStore, {baseMapOptions: props.mapConfig.baseMapOptions})
    }
  }

  getParameterByName = (name: string, url: any) => {
    if (!url) url = window.location.href
    url = url.toLowerCase() // This is just to avoid case sensitiveness
    name = name.replace(/[\[\]]/g, '\\$&').toLowerCase()// This is just to avoid case sensitiveness for query parameter name
    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
    let results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ''
    return decodeURIComponent(results[2].replace(/\+/g, ' '))
  }

  componentDidMount () {
    const q = this.getParameterByName('q')
    if (q) {
      this.handleSearch(q)
    }
  }

  componentDidUpdate () {
    if (this.state.searchResult) {
      const scrollTarget = $(this.refs.search)
      $('html,body').animate({
        scrollTop: scrollTarget.offset().top
      }, 1000)
    }
  }

  onResetSearch = () => {
    this.refs.map.resetGeoJSON()
    this.setState({searchResult: null, searchCards: []})
  }

  handleSearch = async (input: string) => {
    this.setState({searching: true})
    try {
      let totalResults = 0

      try {
        let featureRes = await request.get(`/api/global/search?q=${input}`).type('json').accept('json')
        if (featureRes.body && featureRes.body.features && featureRes.body.features.length > 0) {
          this.setState({
            searchResult: featureRes.body
          })
          totalResults += featureRes.body.features.length
        }
      } catch (err) {
        debug.error(err)
      }

      const layerRes = await request.get(`/api/layers/search?q=${input}`).type('json').accept('json')
      const groupRes = await request.get(`/api/groups/search?q=${input}`).type('json').accept('json')
      const hubRes = await request.get(`/api/hubs/search?q=${input}`).type('json').accept('json')
      const mapRes = await request.get(`/api/maps/search?q=${input}`).type('json').accept('json')

      let layerResults = []
      let groupResults = []
      let hubResults = []
      let mapResults = []
      const storyResults = []

      // layers
      if (layerRes.body && layerRes.body.layers && layerRes.body.layers.length > 0) {
        totalResults += layerRes.body.layers.length
        layerResults = layerRes.body.layers
      }

      // groups
      if (groupRes.body && groupRes.body.groups && groupRes.body.groups.length > 0) {
        totalResults += groupRes.body.groups.length
        groupResults = groupRes.body.groups
      }

      // hubs
      if (hubRes.body && hubRes.body.hubs && hubRes.body.hubs.length > 0) {
        totalResults += hubRes.body.hubs.length
        hubResults = hubRes.body.hubs
      }

      // map
      if (mapRes.body && mapRes.body.maps && mapRes.body.maps.length > 0) {
        totalResults += mapRes.body.maps.length
        mapResults = mapRes.body.maps
      }

      const searchCards = this.getMixedCardSet(layerResults, groupResults, hubResults, mapResults, storyResults)
      this.setState({
        searchCards
      })

      this.setState({searching: false})

      if (totalResults > 0) {
        NotificationActions.showNotification(
          {
            message: totalResults +
             ' ' + this.__('Results Found'),
            position: 'bottomright',
            dismissAfter: 3000
          })
      } else {
        // clear Map
        // tell user no results found
        NotificationActions.showNotification(
          {
            message: this.__('No Results Found'),
            position: 'bottomright',
            dismissAfter: 3000
          })
      }
    } catch (err) {
      this.setState({searching: false})
      debug.error(err)
      MessageActions.showMessage({title: 'Error', message: err.toString()})
    }
  }

  getMixedCardSet (layers: Array<Object>, groups: Array<Object>, hubs: Array<Object>, maps: Array<Object>, stories: Array<Object>) {
    return _shuffle(layers.map(cardUtil.getLayerCard)
      .concat(groups.map(cardUtil.getGroupCard))
      .concat(hubs.map(cardUtil.getHubCard))
      .concat(maps.map(cardUtil.getMapCard))
      .concat(stories.map(cardUtil.getStoryCard))
    )
  }

  render () {
    let cardsPanel = ''
    if (this.state.searchCards && this.state.searchCards.length > 0) {
      cardsPanel = (
        <CardCollection cards={this.state.searchCards} />
      )
    }

    return (
      <ErrorBoundary>
        <Header {...this.props.headerConfig} />
        <main style={{margin: 0}}>
          <div ref='search' className='container' style={{height: '55px', paddingTop: '10px'}}>
            <div className='row no-margin'>
              <SearchBox label={this.__('Search') + ' ' + MAPHUBS_CONFIG.productName} onSearch={this.handleSearch} onReset={this.onResetSearch} />
            </div>
          </div>
          <div className='row no-margin' style={{height: 'calc(75vh - 55px)', minHeight: '200px'}}>
            <Map ref='map'
              id='global-search-map'
              style={{width: '100%', height: '100%'}}
              disableScrollZoom hoverInteraction={false} showLogo={false} attributionControl
              mapConfig={this.props.mapConfig}
              data={this.state.searchResult} />
          </div>
          <div className='divider' />
          <div className='row no-margin' style={{height: 'calc(50% - 50px)', minHeight: '200px'}}>
            {cardsPanel}
          </div>
          <Progress id='searching' title={this.__('Searching')} subTitle='' dismissible={false} show={this.state.searching} />
        </main>
        <Footer {...this.props.footerConfig} />
      </ErrorBoundary>
    )
  }
}
