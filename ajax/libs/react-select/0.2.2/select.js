require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _ = require('underscore'),
	React = require('react'),
	classes = require('classnames');

var Option = React.createClass({
	
	displayName: 'Value',
	
	propTypes: {
		label: React.PropTypes.string.isRequired
	},
	
	blockEvent: function(event) {
		event.stopPropagation();
	},
	
	render: function() {
		return React.createElement("div", {className: "Select-item"}, 
			React.createElement("span", {className: "Select-item-icon", onMouseDown: this.blockEvent, onClick: this.props.onRemove}, "×"), 
			React.createElement("span", {className: "Select-item-label"}, this.props.label)
		);
	}
	
});

module.exports = Option;

},{"classnames":2,"react":undefined,"underscore":undefined}],2:[function(require,module,exports){
function classnames() {
	var args = arguments, classes = [];
	for (var i = 0; i < args.length; i++) {
		if (args[i] && 'string' === typeof args[i]) {
			classes.push(args[i]);
		} else if ('object' === typeof args[i]) {
			classes = classes.concat(Object.keys(args[i]).filter(function(cls) {
				return args[i][cls];
			}));
		}
	}
	return classes.join(' ') || undefined;
}

module.exports = classnames;

},{}],3:[function(require,module,exports){
var React = require('react');

var sizerStyle = { position: 'absolute', visibility: 'hidden', height: 0, width: 0, overflow: 'scroll', whiteSpace: 'nowrap' };

var AutosizeInput = React.createClass({
	
	displayName: 'AutosizeInput',

	propTypes: {
		value: React.PropTypes.any,                 // field value
		defaultValue: React.PropTypes.any,          // default field value
		onChange: React.PropTypes.func,             // onChange handler: function(newValue) {}
		style: React.PropTypes.object,              // css styles for the outer element
		className: React.PropTypes.string,          // className for the outer element
		inputStyle: React.PropTypes.object,         // css styles for the input element
		inputClassName: React.PropTypes.string      // className for the input element
	},
	
	getDefaultProps: function() {
		return {
			minWidth: 1
		};
	},
	
	getInitialState: function() {
		return {
			inputWidth: this.props.minWidth
		};
	},
	
	componentDidMount: function() {
		this.copyInputStyles();
		this.updateInputWidth();
	},
	
	componentDidUpdate: function() {
		this.updateInputWidth();
	},
	
	copyInputStyles: function() {
		if (!this.isMounted() || !window.getComputedStyle) {
			return;
		}
		var inputStyle = window.getComputedStyle(this.refs.input.getDOMNode());
		var widthNode = this.refs.sizer.getDOMNode();
		widthNode.style.fontSize = inputStyle.fontSize;
		widthNode.style.fontFamily = inputStyle.fontFamily;
	},
	
	updateInputWidth: function() {
		if (!this.isMounted()) {
			return;
		}
		var newInputWidth = this.refs.sizer.getDOMNode().scrollWidth + 2;
		if (newInputWidth < this.props.minWidth) {
			newInputWidth = this.props.minWidth;
		}
		if (newInputWidth !== this.state.inputWidth) {
			this.setState({
				inputWidth: newInputWidth
			});
		}
	},
	
	getInput: function() {
		return this.refs.input;
	},
	
	focus: function() {
		this.refs.input.getDOMNode().focus();
	},
	
	select: function() {
		this.refs.input.getDOMNode().select();
	},
	
	render: function() {
		
		var nbspValue = (this.props.value || '').replace(/ /g, '&nbsp;');
		
		var wrapperStyle = this.props.style || {};
		wrapperStyle.display = 'inline-block';
		
		var inputStyle = this.props.inputStyle || {};
		inputStyle.width = this.state.inputWidth;
		
		return (
			React.createElement("div", {className: this.props.className, style: wrapperStyle}, 
				React.createElement("input", React.__spread({},  this.props, {ref: "input", className: this.props.inputClassName, style: inputStyle})), 
				React.createElement("div", {ref: "sizer", style: sizerStyle, dangerouslySetInnerHTML: { __html: nbspValue}})
			)
		);
		
	}
	
});

module.exports = AutosizeInput;

},{"react":undefined}],"react-select":[function(require,module,exports){
var _ = require('underscore'),
	React = require('react'),
	Input = require('react-input-autosize'),
	classes = require('classnames'),
	Value = require('./value');

var requestId = 0;

var Select = React.createClass({
	
	displayName: 'Select',

	propTypes: {
		value: React.PropTypes.any,             // initial field value
		multi: React.PropTypes.bool,            // multi-value input
		options: React.PropTypes.array,         // array of options
		delimiter: React.PropTypes.string,      // delimiter to use to join multiple values
		asyncOptions: React.PropTypes.func,     // function to call to get options
		autoload: React.PropTypes.bool,         // whether to auto-load the default async options set
		placeholder: React.PropTypes.string,    // field placeholder, displayed when there's no value
		name: React.PropTypes.string,           // field name, for hidden <input /> tag
		onChange: React.PropTypes.func,         // onChange handler: function(newValue) {}
		className: React.PropTypes.string       // className for the outer element
	},
	
	getDefaultProps: function() {
		return {
			value: undefined,
			options: [],
			delimiter: ',',
			asyncOptions: undefined,
			autoload: true,
			placeholder: '',
			name: undefined,
			onChange: undefined,
			className: undefined
		};
	},
	
	getInitialState: function() {
		return {
			/*
			 * set by getStateFromValue on componentWillMount:
			 * - value
			 * - values
			 * - inputValue
			 * - placeholder
			 * - focusedOption
			*/
			options: this.props.options,
			isFocused: false,
			isOpen: false,
			isLoading: false
		};
	},
	
	componentWillMount: function() {
		
		this._optionsCache = {};
		this.setState(this.getStateFromValue(this.props.value));
		
		if (this.props.asyncOptions && this.props.autoload) {
			this.autoloadAsyncOptions();
		}
		
	},
	
	componentWillUnmount: function() {
		clearTimeout(this._blurTimeout);
		clearTimeout(this._focusTimeout);
	},
	
	componentDidUpdate: function() {
		console.log('component did update, focus: ' + this._focusAfterUpdate);
		if (this._focusAfterUpdate) {
			clearTimeout(this._blurTimeout);
			this._focusTimeout = setTimeout(function() {
				this.refs.input.focus();
				this._focusAfterUpdate = false;
			}.bind(this), 50);
		}
	},
	
	initValuesArray: function(values) {
		
		if (!Array.isArray(values)) {
			if ('string' === typeof values) {
				values = values.split(this.props.delimiter);
			} else {
				values = values ? [values] : []
			}
		};
		
		return values.map(function(val) {
			return ('string' === typeof val) ? val = _.findWhere(this.state.options, { value: val }) || { value: val, label: val } : val;
		}.bind(this));
		
	},
	
	getStateFromValue: function(value) {
		
		var values = this.initValuesArray(value);
		
		return {
			value: values.map(function(v) { return v.value }).join(this.props.delimiter),
			values: values,
			inputValue: '',
			placeholder: !this.props.multi && values.length ? values[0].label : this.props.placeholder || 'Select...',
			focusedOption: !this.props.multi ? values[0] : null
		};
		
	},
	
	setValue: function(value) {
		this._focusAfterUpdate = true;
		var newState = this.getStateFromValue(value);
		newState.isOpen = false;
		this.fireChangeEvent(newState);
		this.setState(newState);
	},
	
	selectValue: function(value) {
		this[this.props.multi ? 'addValue' : 'setValue'](value);
	},
	
	addValue: function(value) {
		this.setValue(this.state.values.concat(value));
	},
	
	popValue: function() {
		this.setValue(_.initial(this.state.values));
	},
	
	removeValue: function(value) {
		this.setValue(_.without(this.state.values, value));
	},
	
	clearValue: function() {
		this.setValue(null);
	},
	
	resetValue: function() {
		this.setValue(this.state.value);
	},
	
	fireChangeEvent: function(newState) {
		if (newState.value !== this.state.value && this.props.onChange) {
			this.props.onChange(newState.value, newState.values);
		}
	},
	
	handleMouseDown: function(event) {
		event.stopPropagation();
		event.preventDefault();
		if (this.state.isFocused) {
			this.setState({
				isOpen: true
			});
		} else {
			this._openAfterFocus = true;
			this.refs.input.focus();
		}
	},
	
	handleInputFocus: function() {
		this.setState({
			isFocused: true,
			isOpen: this.state.isOpen || this._openAfterFocus
		});
		this._openAfterFocus = false;
	},
	
	handleInputBlur: function(event) {
		this._blurTimeout = setTimeout(function() {
			console.log('blur: ' + this._focusAfterUpdate);
			if (this._focusAfterUpdate) return;
			this.setState({
				isOpen: false,
				isFocused: false
			});
		}.bind(this), 50);
	},
	
	handleKeyDown: function(event) {
		
		switch (event.keyCode) {
			
			case 8: // backspace
				if (!this.state.inputValue) {
					this.popValue();
				}
				return;
			break;
			
			case 9: // tab
				if (event.shiftKey || !this.state.isOpen || !this.state.focusedOption) {
					return;
				}
				this.selectFocusedOption();
			break;
			
			case 13: // enter
				this.selectFocusedOption();
			break;
			
			case 27: // escape
				if (this.state.isOpen) {
					this.resetValue();
				} else {
					this.clearValue();
				}
			break;
			
			case 38: // up
				this.focusPreviousOption();
			break;
			
			case 40: // down
				this.focusNextOption();
			break;
			
			default: return;
		}
		
		event.preventDefault();
		
	},
	
	handleInputChange: function(event) {
		if (this.props.asyncOptions) {
			this.setState({
				isLoading: true,
				inputValue: event.target.value
			});
			this.loadAsyncOptions(event.target.value, {
				isLoading: false,
				isOpen: true
			});
		} else {
			this.setState({
				isOpen: true,
				inputValue: event.target.value
			});
		}
	},
	
	autoloadAsyncOptions: function() {
		this.loadAsyncOptions('', {}, function() {});
	},
	
	loadAsyncOptions: function(input, state) {
		
		for (var i = 0; i <= input.length; i++) {
			var cacheKey = input.slice(0, i);
			if (this._optionsCache[cacheKey] && (input === cacheKey || this._optionsCache[cacheKey].complete)) {
				this.setState(_.extend({
					options: this._optionsCache[cacheKey].options
				}, state));
				return;
			}
		}
		
		var thisRequestId = this._currentRequestId = requestId++;
		
		this.props.asyncOptions(input, function(err, data) {
			
			this._optionsCache[input] = data;
			
			if (thisRequestId !== this._currentRequestId) {
				return;
			}
			
			this.setState(_.extend({
				options: data.options
			}, state));
			
		}.bind(this));
		
	},
	
	filterOptions: function() {
		var values = this.state.values.map(function(i) {
			return i.value;
		});
		var filterOption = function(op) {
			if (this.props.multi && _.contains(values, op.value)) return false;
			return (
				!this.state.inputValue
				|| op.value.toLowerCase().indexOf(this.state.inputValue.toLowerCase()) >= 0
				|| op.label.toLowerCase().indexOf(this.state.inputValue.toLowerCase()) >= 0
			);
		}
		return _.filter(this.state.options, filterOption, this);
	},
	
	selectFocusedOption: function() {
		return this.selectValue(this.state.focusedOption);
	},
	
	focusOption: function(op) {
		this.setState({
			focusedOption: op
		});
	},
	
	focusNextOption: function() {
		this.focusAdjacentOption('next');
	},
	
	focusPreviousOption: function() {
		this.focusAdjacentOption('previous');
	},
	
	focusAdjacentOption: function(dir) {
		
		var ops = this.filterOptions();
		
		if (!this.state.isOpen) {
			this.setState({
				isOpen: true,
				inputValue: '',
				focusedOption: this.state.focusedOption || ops[dir === 'next' ? 0 : ops.length - 1]
			});
			return;
		}
		
		if (!ops.length) {
			return;
		}
		
		var focusedIndex = -1;
		
		for (var i = 0; i < ops.length; i++) {
			if (this.state.focusedOption === ops[i]) {
				focusedIndex = i;
				break;
			}
		}
		
		var focusedOption = ops[0];
		
		if (dir === 'next' && focusedIndex > -1 && focusedIndex < ops.length - 1) {
			focusedOption = ops[focusedIndex + 1];
		} else if (dir === 'previous') {
			if (focusedIndex > 0) {
				focusedOption = ops[focusedIndex - 1];
			} else {
				focusedOption = ops[ops.length - 1];
			}
		}
		
		this.setState({
			focusedOption: focusedOption
		});
		
	},
	
	unfocusOption: function(op) {
		if (this.state.focusedOption === op) {
			this.setState({
				focusedOption: null
			});
		}
	},
	
	buildMenu: function() {
		
		var ops = _.map(this.filterOptions(), function(op) {
			
			var optionClass = classes({
				'Select-option': true,
				'is-focused': this.state.focusedOption === op
			});
			
			var mouseEnter = this.focusOption.bind(this, op),
				mouseLeave = this.unfocusOption.bind(this, op),
				mouseDown = this.selectValue.bind(this, op);
			
			return React.createElement("div", {key: 'option-' + op.value, className: optionClass, onMouseEnter: mouseEnter, onMouseLeave: mouseLeave, onMouseDown: mouseDown}, op.label);
			
		}, this);
		
		return ops.length ? ops : React.createElement('div', { className: "Select-noresults" }, "No results found");
		
	},
	
	render: function() {
		
		var selectClass = classes('Select', this.props.className, {
			'is-multi': this.props.multi,
			'is-open': this.state.isOpen,
			'is-focused': this.state.isFocused,
			'is-loading': this.state.isLoading,
			'has-value': this.state.value
		});
		
		var value = [];
		
		if (this.props.multi) {
			this.state.values.forEach(function(val) {
				props = _.extend({
					key: val.value,
					onRemove: this.removeValue.bind(this, val)
				}, val);
				value.push(React.createElement(Value, props));
			}, this);
		}
		
		if (!this.state.inputValue && (!this.props.multi || !value.length)) {
			value.push(React.createElement("div", {className: "Select-placeholder", key: "placeholder"}, this.state.placeholder));
		}
		
		var loading = this.state.isLoading ? React.createElement('span', { className: "Select-loading" }) : null;
		var clear = this.state.value ? React.createElement("span", {className: "Select-clear", onMouseDown: this.clearValue, dangerouslySetInnerHTML: { __html: '&times;'}}) : null;
		var menu = this.state.isOpen ? React.createElement("div", {className: "Select-menu"}, this.buildMenu()) : null;
		
		return (
			React.createElement("div", {ref: "wrapper", className: selectClass}, 
				React.createElement("input", {type: "hidden", ref: "value", name: this.props.name, value: this.state.value}), 
				React.createElement("div", {className: "Select-control", ref: "control", onKeyDown: this.handleKeyDown, onMouseDown: this.handleMouseDown}, 
					value, 
					React.createElement(Input, {className: "Select-input", tabIndex: this.props.tabIndex, ref: "input", value: this.state.inputValue, onFocus: this.handleInputFocus, onBlur: this.handleInputBlur, onChange: this.handleInputChange, minWidth: "5"}), 
					React.createElement("span", {className: "Select-arrow"}), 
					loading, 
					clear
				), 
				menu
			)
		);
		
	}
	
});

module.exports = Select;

},{"./value":1,"classnames":2,"react":undefined,"react-input-autosize":3,"underscore":undefined}]},{},[]);
