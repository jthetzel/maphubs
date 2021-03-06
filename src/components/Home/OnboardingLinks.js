// @flow
import React from 'react'
import MapHubsPureComponent from '../MapHubsPureComponent'

export default class OnboardingLinks extends MapHubsPureComponent<void, void> {
  render () {
    return (
      <div className='row no-margin'>
        <div className='col s12 m3 l3 home-onboarding-icon-wrapper' style={{margin: 'auto'}}>
          <a href='/map/new' style={{margin: 'auto'}}>
            <div className='valign-wrapper' style={{height: '125px', position: 'relative', margin: 'auto'}}>
              <i className='material-icons valign center-align' style={{fontSize: '80px', margin: 'auto'}}>map</i>
            </div>
            <h5 className='center-align'>{this.__('Make a Map')}</h5>
          </a>
        </div>
        <div className='col s12 m3 l3 home-onboarding-icon-wrapper' style={{margin: 'auto'}}>
          <a href='/explore' style={{margin: 'auto'}}>
            <div className='valign-wrapper' style={{height: '125px', position: 'relative', margin: 'auto'}}>
              <i className='material-icons valign center-align' style={{fontSize: '80px', margin: 'auto'}}>explore</i>
            </div>
            <h5 className='center-align'>{this.__('Explore')}</h5>
          </a>
        </div>
        <div className='col s12 m3 l3 home-onboarding-icon-wrapper' style={{margin: 'auto'}}>
          <a href='/stories' style={{margin: 'auto'}}>
            <div className='valign-wrapper' style={{height: '125px', position: 'relative', margin: 'auto'}}>
              <i className='material-icons valign center-align' style={{fontSize: '80px', margin: 'auto'}}>chat_bubble</i>
            </div>
            <h5 className='center-align'>{this.__('Write a Map Story')}</h5>
          </a>
        </div>
        <div className='col s12 m3 l3 home-onboarding-icon-wrapper' style={{margin: 'auto'}}>
          <a href='/search' style={{margin: 'auto'}}>
            <div className='valign-wrapper' style={{height: '125px', position: 'relative', margin: 'auto'}}>
              <i className='material-icons valign center-align' style={{fontSize: '80px', margin: 'auto'}}>search</i>
            </div>
            <h5 className='center-align'>{this.__('Search')}</h5>
          </a>
        </div>
      </div>
    )
  }
}
