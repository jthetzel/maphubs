import React from 'react'
const $ = require('jquery')

type Props = {|
  icon: string,
  top: string,
  right: string,
  bottom: string,
  left: string,
  tooltipText: string,
  color: string,
  onClick: Function,
  show: boolean,
  disabled: boolean
|}

type DefaultProps = {
  icon: string,
  top: string,
  right: string,
  bottom: string,
  left: string,
  tooltipText: string,
  color: string,
  show: boolean,
  disabled: boolean
}

export default class MapToolButton extends React.PureComponent<DefaultProps, Props, void> {
  props: Props

  static defaultProps: DefaultProps = {
    icon: 'edit',
    top: '10px',
    color: MAPHUBS_CONFIG.primaryColor,
    right: '10px',
    bottom: 'auto',
    left: 'auto',
    tooltipText: '',
    show: true,
    disabled: false
  }

  componentDidMount () {
    if (this.props.tooltipText && this.props.tooltipText !== '') {
      $(this.refs.mapToolButton).tooltip()
    }
  }

  onClick = (e) => {
    if (this.props.disabled) return

    $(this.refs.mapToolButton).tooltip('remove')
    $(this.refs.mapToolButton).tooltip()
    this.props.onClick(e)
  }

  render () {
    if (this.props.show) {
      let backgroundColor = 'white'
      let color = this.props.color
      if (this.props.disabled) {
        backgroundColor = '#DFDFDF'
        color = '#9F9F9F'
      }
      return (
        <a ref='mapToolButton'
          onClick={this.onClick}
          style={{position: 'absolute',
            top: this.props.top,
            right: this.props.right,
            bottom: this.props.bottom,
            left: this.props.left,
            height: '30px',
            zIndex: '100',
            lineHeight: '30px',
            borderRadius: '4px',
            textAlign: 'center',
            boxShadow: '0 2px 5px 0 rgba(0,0,0,0.16),0 2px 10px 0 rgba(0,0,0,0.12)',
            width: '30px'}}
          data-position='bottom' data-delay='50' data-tooltip={this.props.tooltipText}
        >
          <i className='material-icons'
            style={{height: '30px',
              lineHeight: '30px',
              width: '30px',
              color,
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor,
              borderColor: '#ddd',
              borderStyle: 'solid',
              borderWidth: '1px',
              textAlign: 'center',
              fontSize: '18px'}}
          >{this.props.icon}</i>
        </a>
      )
    } else {
      return null
    }
  }
}
