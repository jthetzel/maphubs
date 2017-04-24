//@flow
import React from 'react';
import _find from 'lodash.find';
import LayerListDropDown from './LayerListDropDown';
import MapHubsPureComponent from '../MapHubsPureComponent';

export default class MapLayerMenu extends MapHubsPureComponent {

  props:  {
    categories:  Array<Object>,
    layers:  Array<Object>,
    toggleVisibility: Function
  }

  findLayer = (layer_id: number) => {
    return _find(this.props.layers, {layer_id});
  }

  render(){
    var _this = this;

    return (
       <nav style={{boxShadow: '0 0 1px rgba(0,0,0,0.7)', borderTop: '1px #444 solid'}}>
          <div className="nav-wrapper z-depth-0">
          <ul className="left">
      {this.props.categories.map((category, i) => {
        var name = category.name[_this.state.locale];
        if(!name) name = category.name.en;
        var categoriesLayers = [];
        category.layers.forEach(layer_id =>{
          categoriesLayers.push(_this.findLayer(layer_id));
        });
        return (       
          <LayerListDropDown key={`category-dropdown-${i}`} id={`category-dropdown-${i}`} name={name} layers={categoriesLayers} toggleVisibility={_this.props.toggleVisibility} />
        );
           
      })
       }
       </ul>
        </div>
      </nav>
    );
  }
}