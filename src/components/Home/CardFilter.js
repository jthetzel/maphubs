//@flow
import React from 'react';
import MapHubsComponent from '../MapHubsComponent';

export default class CardFilter extends MapHubsComponent {

  props: {
    defaultValue: string,
    onChange: Function
  }

  static defaultProps = {
    defaultValue:'featured'
  }

  constructor(props: Object){
    super(props);
    this.state = {
      value: props.defaultValue
    };
  }

  onFeatured = () => {
    this.setState({value: 'featured'});
    this.props.onChange('featured');
  }

  onPopular = () => {
    this.setState({value: 'popular'});
    this.props.onChange('popular');
  }

  onRecent = () => {
    this.setState({value: 'recent'});
    this.props.onChange('recent');
  }

  render(){
    var activeClass = 'omh-accent-text';
    var featuredClass = '', popularClass= '', recentClass = '';
    if(this.state.value === 'featured'){
      featuredClass = activeClass;
    }else if(this.state.value === 'popular'){
      popularClass = activeClass;
    }else if(this.state.value === 'recent'){
      recentClass = activeClass;
    }
    return (
      <div className="valign right-align" style={{width: '100%'}}>
        <span className={featuredClass} onClick={this.onFeatured} style={{cursor: 'pointer'}}>{this.__('Featured')}</span> |&nbsp;
        <span className={popularClass} onClick={this.onPopular} style={{cursor: 'pointer'}}>{this.__('Popular')}</span> |&nbsp;
        <span className={recentClass} onClick={this.onRecent} style={{cursor: 'pointer'}}>{this.__('Recent')}</span>
      </div>
    );
  }
}