var React = require('react');

var Attributes = React.createClass({

  propTypes: {
		attributes: React.PropTypes.object.isRequired,
    selected: React.PropTypes.bool.isRequired,
    multipleSelected: React.PropTypes.bool.isRequired
  },


  render() {

    var _this = this;

    var spacer = (<div style={{height: '50px'}}></div>);
    if (this.props.multipleSelected){
      spacer = (<div style={{height: '118px'}}></div>);
    }

    var display = '';
    var photo = '';
    if(_this.props.attributes.photo_url){
      photo = (
        <img src={_this.props.attributes.photo_url} style={{width: '180px', height: 'auto'}} alt="feature photo"/>
      );
    }

    if(_this.props.attributes && Object.keys(_this.props.attributes).length > 0){
       display = (
           <ul className="collection">
             {photo}
             {
               Object.keys(_this.props.attributes).map(function (key) {
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
                })
             }

           </ul>

       );
    }
    var marginTop = '0px';
    if(this.props.selected){
       marginTop = '20px';
    }

    return (
      <div style={{marginTop, width: '100%', overflowY: 'auto'}}>
      {display}
      {spacer}
      {this.props.children}
      </div>
    );
  }
});

module.exports = Attributes;
