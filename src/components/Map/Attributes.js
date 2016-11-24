var React = require('react');

var Attributes = React.createClass({

  propTypes: {
		attributes: React.PropTypes.object.isRequired,
    selected: React.PropTypes.bool.isRequired,
    multipleSelected: React.PropTypes.bool.isRequired,
    presets:  React.PropTypes.array
  },


  render() {
    var _this = this;


    var spacer = (<div style={{height: '50px'}}></div>);
    if (this.props.multipleSelected){
      spacer = (<div style={{height: '118px'}}></div>);
    }

    var display = '';
    var photo = '';
    var photoUrl = null;
    if(_this.props.attributes.photo_url){
      photoUrl = _this.props.attributes.photo_url;
    }else if(_this.props.attributes['Photo URL']){
      photoUrl = _this.props.attributes['Photo URL'];
    }

    if(photoUrl){
      photo = (
        <img src={photoUrl} style={{width: '180px', height: 'auto'}} alt="feature photo"/>
      );
    }

    if(_this.props.attributes && Object.keys(_this.props.attributes).length > 0){
      if(this.props.presets){
        var presets = this.props.presets;
        //only display presets
        display = (
            <ul className="collection" style={{marginTop: 0}}>
              {photo}
              {
                presets.map(function(preset){
                  var val = _this.props.attributes[preset.tag];
                  if(typeof val === 'string' && val.startsWith('http')){
                    val = (<a target="_blank" href={val}>{val}</a>);
                  }
                  return (
                     <li key={preset.tag} className="collection-item attribute-collection-item">
                       <p style={{wordWrap: 'break-word'}}><b className="left">{preset.label}</b>: &nbsp;
                         {val}
                       </p>


                     </li>
                   );

                })
              }
            </ul>

        );
      }else {

        display = (
            <ul className="collection" style={{marginTop: 0}}>
              {photo}
              {
                Object.keys(_this.props.attributes).map(function (key) {
                    if(key !== 'osm_id' || key !== 'layer_id'
                    || key !== 'maphubs_host'){
                     var val = _this.props.attributes[key];
                     if(typeof val === 'string' && val.startsWith('http')){
                       val = (<a target="_blank" href={val}>{val}</a>);
                     }
                     return (
                        <li key={key} className="collection-item attribute-collection-item">
                          <p style={{wordWrap: 'break-word'}}><b className="left">{key}</b>: &nbsp;
                            {val}
                          </p>


                        </li>
                      );
                    }
                 })
              }

            </ul>

        );

      }


    }
    var marginTop = '0px';
    if(this.props.selected){
       marginTop = '25px';
    }

    return (
      <div style={{marginTop, width: '100%', overflowY: 'auto', height: 'calc(100% - 85px)', borderTop: '1px solid #DDD'}}>
      {display}
      {spacer}
      {this.props.children}
      </div>
    );
  }
});

module.exports = Attributes;