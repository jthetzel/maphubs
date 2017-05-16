//@flow
import React from 'react';
import Header from '../components/header';
import InteractiveMap from '../components/InteractiveMap';
import MapHubsComponent from '../components/MapHubsComponent';
import Reflux from '../components/Rehydrate';
import LocaleStore from '../stores/LocaleStore';

type Props = {
  layer: Object,
  locale: string,
  _csrf: string,
  headerConfig: Object,
  mapConfig: Object
}

export default class LayerMap extends MapHubsComponent<void, Props, void> {

  props: Props

  constructor(props: Props) {
    super(props);
    Reflux.rehydrate(LocaleStore, {locale: this.props.locale, _csrf: this.props._csrf});
  }

	render() {
		return (
      <div>
      <Header {...this.props.headerConfig}/>
      <main className="no-margin" style={{margin: 0, height: 'calc(100% - 50px)', width: '100%'}}>         
          <InteractiveMap ref="interactiveMap" height="100%"       
                  fitBounds={this.props.layer.preview_position.bbox}
                  style={this.props.layer.style} 
                  layers={[this.props.layer]}
                  map_id={this.props.layer.layer_id}
                  mapConfig={this.props.mapConfig}
                  disableScrollZoom={false}
                  >
              <div className="addthis_sharing_toolbox" style={{position: 'absolute', bottom: '0px', left: '155px', zIndex:'1'}}></div>
          </InteractiveMap> 
     </main>
      </div>

		);
	}
}