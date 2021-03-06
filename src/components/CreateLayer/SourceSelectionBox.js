// @flow
import React from 'react'
import MapHubsPureComponent from '../MapHubsPureComponent'

type Props = {|
  onSelect: Function,
  name: string,
  value: string,
  icon: string,
  selected: boolean
|}

export default class SourceSelectionBox extends MapHubsPureComponent<Props, void> {
  static defaultProps = {
    selected: false
  }

  onSelect = () => {
    this.props.onSelect(this.props.value)
  }

  render () {
    let icon = ''
    if (this.props.icon) {
      icon = (<i className='material-icons omh-accent-text' style={{fontSize: '48px'}}>{this.props.icon}</i>)
    }
    const border = `3px solid ${MAPHUBS_CONFIG.primaryColor}`
    return (
      <div className='card-panel center' style={{width: '110px', height: '110px', padding: '5px', marginLeft: 'auto', marginRight: 'auto', border}}
        onClick={this.onSelect}>

        <form action='#' style={{height: '100%', position: 'relative'}} >
          {icon}
          <p className='no-margin' style={{position: 'absolute', bottom: '0'}}>
            <input type='checkbox' className='filled-in' id={this.props.name + '-checkbox'} onChange={this.onSelect} checked={this.props.selected ? 'checked' : null} />
            <label className='omh-accent-text' style={{fontSize: '13px'}} htmlFor={this.props.name + '-checkbox'}>{this.props.name}</label>
          </p>
        </form>

      </div>
    )
  }
}
