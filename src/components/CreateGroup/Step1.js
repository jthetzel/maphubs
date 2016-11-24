var React = require('react');
var Formsy = require('formsy-react');
var $ = require('jquery');
var TextArea = require('../forms/textArea');
var TextInput = require('../forms/textInput');
var Toggle = require('../forms/toggle');
var MessageActions = require('../../actions/MessageActions');
var NotificationActions = require('../../actions/NotificationActions');
var classNames = require('classnames');


var Reflux = require('reflux');
var StateMixin = require('reflux-state-mixin')(Reflux);
var GroupStore = require('../../stores/GroupStore');
var GroupActions = require('../../actions/GroupActions');
var LocaleStore = require('../../stores/LocaleStore');
var Locales = require('../../services/locales');

var CreateGroupStep1 = React.createClass({

  mixins:[StateMixin.connect(GroupStore, 'group'), StateMixin.connect(LocaleStore)],

  __(text){
    return Locales.getLocaleString(this.state.locale, text);
  },

  propTypes: {
    onSubmit: React.PropTypes.func,
    active: React.PropTypes.bool.isRequired
  },

  getDefaultProps() {
    return {
      onSubmit: null,
      active: false
    };
  },

  getInitialState() {
    return {
      canSubmit: false,
      showError: false,
      errorMessage: '',
      errorTitle: ''
    };
  },

  checkGroupIdAvailable(id){
    var _this = this;
    var result = false;
    //only check if a valid value was provided and we are running in the browser
    if (id && typeof window !== 'undefined') {
        $.ajax({
         type: "POST",
         url: '/api/group/checkidavailable',
         contentType : 'application/json;charset=UTF-8',
         dataType: 'json',
         data: JSON.stringify({id}),
          async: false,
          success(msg){
            if(msg.available){
              result = true;
            }
          },
          error(msg){
            MessageActions.showMessage({title: _this.__('Server Error'), message: msg});
          },
          complete(){
          }
      });
    }
    return result;

    },

  componentWillMount() {
    var _this = this;
    Formsy.addValidationRule('isAvailable', function (values, value) {
        if(_this.state.group.created) return true;
        if(!this.groupIdValue || value !== this.groupIdValue){
          this.groupIdValue = value;
          this.groupIdAvailable = _this.checkGroupIdAvailable(value);

        }
        return this.groupIdAvailable;

    });
  },

  componentDidMount() {

  },

  enableButton () {
      this.setState({
        canSubmit: true
      });
    },
    disableButton () {
      this.setState({
        canSubmit: false
      });
    },

    submit (model) {
      this.saveGroup(model);
    },


    saveGroup(model){
      var _this = this;
      if(this.state.group.created){
        GroupActions.updateGroup(model.group_id, model.name, model.description, model.location, model.published, function(err){
          if(err){
            MessageActions.showMessage({title: _this.__('Server Error'), message: err});
          }else{
            NotificationActions.showNotification(
              {
                message: _this.__('Group Saved'),
                position: 'bottomright',
                dismissAfter: 3000,
                onDismiss: _this.props.onSubmit
            });
          }
        });
      }else {
        GroupActions.createGroup(model.group_id, model.name, model.description, model.location, model.published, function(err){
          if(err){
            MessageActions.showMessage({title: _this.__('Server Error'), message: err});
          }else{
            NotificationActions.showNotification(
              {
                message: _this.__('Group Created'),
                position: 'bottomright',
                dismissAfter: 3000,
                onDismiss: _this.props.onSubmit
            });
          }
        });
      }

    },

    handleCancel(){
      var _this = this;
      if(_this.state.group.created){
        GroupActions.deleteGroup(function(err){
          if(err){
            MessageActions.showMessage({title: _this.__('Server Error'), message: err});
          }else{
            NotificationActions.showNotification(
              {
                message: _this.__('Group Cancelled'),
                position: 'bottomright',
                dismissAfter: 3000,
                onDismiss() {
                  window.location="/groups";
                }
            });
          }
        });

      }else{
        NotificationActions.showNotification(
          {
            message: _this.__('Group Cancelled'),
            position: 'bottomright',
            dismissAfter: 3000,
            onDismiss() {
              window.location="/groups";
            }
        });
      }
    },

	render() {

    //hide if not active
    var className = classNames('row');
    if(!this.props.active) {
      className = classNames('row', 'hidden');
    }

		return (
      <div className={className}>
        <div className="container">
          <div className="row">
            <Formsy.Form onValidSubmit={this.submit} onValid={this.enableButton} onInvalid={this.disableButton}>
              <div className="row">
                <TextInput name="group_id" label={this.__('Group ID')} icon="group_work" className="col s6"
                      disabled={this.state.group.created}
                      validations={{matchRegexp: /^[a-zA-Z0-9-]*$/, maxLength:25, isAvailable:true}} validationErrors={{
                       maxLength: this.__('ID must be 25 characters or less.'),
                       matchRegexp: this.__('Can only contain letters, numbers, or dashes.'),
                       isAvailable: this.__('ID already taken, please try another.')
                   }} length={25}
                   successText="ID is Available"
                   dataPosition="right" dataTooltip={this.__("Identifier for the Group. This will be used in links and URLs for your group's content.")}
                   required/>
              </div>
              <div className="row">
                <TextInput name="name" label={this.__('Name')} icon="info" className="col s12" validations="maxLength:100" validationErrors={{
                       maxLength: this.__('Name must be 100 characters or less.')
                   }} length={100}
                   dataPosition="top" dataTooltip={this.__('Short Descriptive Name for the Group')}
                   required/>
              </div>
              <div className="row">
                <TextArea name="description" label={this.__('Description')} icon="description" className="col s12" validations="maxLength:500" validationErrors={{
                       maxLength: this.__('Description must be 500 characters or less.')
                   }} length={500}
                   dataPosition="top" dataTooltip={this.__('Brief Description of the Group')}
                   required/>
              </div>
              <div className="row">
                <TextInput name="location" label="Location" icon="navigation" className="col s12" validations="maxLength:100" validationErrors={{
                       maxLength: this.__('Location must be 100 characters or less.')
                   }} length={100}
                   dataPosition="top" dataTooltip={this.__('Country or City Where the Group is Located')}
                   required/>
              </div>
              <div className="row">
                <Toggle name="published" labelOff={this.__('Draft')} labelOn={this.__('Published')} defaultChecked={true} className="col s12"
                  dataPosition="top" dataTooltip={this.__('Include in Public Group Listings')}
                  />
              </div>
              <div className="left">
                  <a className="waves-effect waves-light redirect btn" onClick={this.handleCancel}><i className="material-icons left">delete</i>{this.__('Cancel')}</a>
              </div>
              <div className="right">
                  <button type="submit" className="waves-effect waves-light btn" disabled={!this.state.canSubmit}><i className="material-icons right">arrow_forward</i>{this.__('Save and Continue')}</button>
              </div>

            </Formsy.Form>

         </div>
         </div>
      </div>
		);
	}
});

module.exports = CreateGroupStep1;