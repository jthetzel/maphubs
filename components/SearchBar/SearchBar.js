/*
From https://github.com/vakhtang/react-search-bar/
License: MIT

Modified to support MaterializeCSS and other customizations

*/

//import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Suggestions from './Suggestions';

var $ = require('jquery');

const KEY_CODES = {
  UP: 38,
  DOWN: 40,
  ENTER: 13
};

var SearchBar = React.createClass({
  displayName: 'SearchBar',

  propTypes: {
    autoFocus: React.PropTypes.bool,
    autosuggestDelay: React.PropTypes.number,
    inputName: React.PropTypes.string,
    style: React.PropTypes.object,
    placeholder: React.PropTypes.string,
    onReset: React.PropTypes.func,
    onSubmit: React.PropTypes.func,
    onChange: React.PropTypes.func,
    id: React.PropTypes.string
  },
  getDefaultProps() {
    return {
      autoFocus: false,
      autosuggestDelay: 250,
      inputName: 'query',
      style: {},
      id: 'search'
    };
  },
  getInitialState() {
    return {
      value: '',
      suggestions: [],
      highlightedItem: -1
    };
  },

  componentDidMount() {
    if (this.props.autoFocus) {
      ReactDOM.findDOMNode(this.refs.value).focus();
    }
    $(ReactDOM.findDOMNode(this.refs.suggestions)).dropdown({
     inDuration: 300,
     outDuration: 225,
     constrain_width: true, // Does not change width of dropdown to that of the activator
     hover: false, // Activate on hover
     gutter: 0, // Spacing from edge
     belowOrigin: true // Displays dropdown below the button
   });
   $(document.body).on("click", this.hideSuggestions);

  },
  componentWillUnmount () {
    document.body.removeEventListener('click', this.hideSuggestions);
  },
  handleClick(e){
    e.nativeEvent.stopImmediatePropagation();
  },
  handleKeyDown(e) {
    if(e.which == KEY_CODES.ENTER ){
      e.preventDefault();
      this.submit(e);
    }
    if (e.which != KEY_CODES.UP && e.which != KEY_CODES.DOWN) return;
    e.preventDefault();
    let highlightedItem = this.state.highlightedItem;

    if (e.which == KEY_CODES.UP) {
      if (highlightedItem <= 0) return;
      --highlightedItem;
    }
    if (e.which == KEY_CODES.DOWN) {
      if (highlightedItem == this.state.suggestions.length - 1) return;
      ++highlightedItem;
    }

    this.setState({
      highlightedItem,
      value: this.state.suggestions[highlightedItem]
    });
  },
  displaySuggestions(suggestions) {
    this.setState({
      suggestions,
      highlightedItem: -1
    });
    $(ReactDOM.findDOMNode(this.refs.suggestions)).show();
  },
  hideSuggestions(){
      $(ReactDOM.findDOMNode(this.refs.suggestions)).hide();
  },
  fillInSuggestion(suggestion) {
    this.setState({value: suggestion.value});
    this.search(suggestion.value);
  },
  handleChange(e) {
    clearTimeout(this._timerId);
    let input = e.target.value;
    if (!input) return this.setState(this.getInitialState());
    this.setState({value: input});

    this._timerId = setTimeout(() => {
      new Promise((resolve) => {
        this.props.onChange(input, resolve);
      }).then((suggestions) => {
        if (!this.state.value) return;
        this.displaySuggestions(suggestions);
      });
    }, this.props.autosuggestDelay);
  },
  submit(e) {
    e.preventDefault();
    if (!this.state.value) return;
    this.search(this.state.value.trim());
  },
  search(value) {
    clearTimeout(this._timerId);
    let {suggestions, highlightedItem} = this.getInitialState();
    this.setState({
      suggestions,
      highlightedItem
    });
    this.props.onSubmit(value);
  },

  reset(){
    clearTimeout(this._timerId);
    let {suggestions, highlightedItem} = this.getInitialState();
    this.setState({
      value: {key: '', value: ''},
      suggestions,
      highlightedItem
    });
    if(this.props.onReset) this.props.onReset();
  },

  render() {
    return (
      <div style={this.props.style}>
      <nav className="omh-search-bar no-margin">
    <div className="nav-wrapper omh-search-bar-wrapper row white no-margin">

      <form style={{boxSizing: 'content-box'}}>

        <div className="input-field">
          <input id={this.props.id}
            className="omh-search truncate"
            type="search"
              style = {{margin: 0}}
              name={this.props.inputName}
              maxLength="100"
              autoComplete="off"
              ref="value"
              value={this.state.value.value}
              placeholder={this.props.placeholder}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              onClick={this.handleClick}
              data-beloworigin="true"
              data-activates={this.refs.suggestions}
            required />

          <label htmlFor={this.props.id} style={{height: 'inherit', lineHeight: 'inherit'}}><i className="material-icons omh-search-icon" style={{height: 'inherit', lineHeight: 'inherit'}}>search</i></label>
          <i className="material-icons" style={{height: 'inherit', lineHeight: 'inherit'}} onClick={this.reset}>close</i>
        </div>
      </form>


    </div>

  </nav>
  <div className="row no-margin">
    {!!this.state.suggestions.length &&
      <Suggestions
        ref="suggestions"
        suggestions={this.state.suggestions}
        highlightedItem={this.state.highlightedItem}
        onSelection={this.fillInSuggestion} />}
  </div>
  </div>
    );
  }
});

module.exports = SearchBar;