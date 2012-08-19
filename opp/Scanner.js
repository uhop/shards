dojo.provide("shards.opp.Scanner");

dojo.require("shards.opp.utils");

// Based on ideas by Matt Might (http://matt.might.net/articles/lexing-and-syntax-highlighting-in-javascript/).

/*
	Rule table is implemented by a naked object:

	{
		"main": [   // state
			{
				regexp: /\d+/,                              // regular expression to match
				action: function(match, rest, scanner){...} // action to take on match
				after:  newState                            // new state
			}
		]
	}

	Individual item can be abbreviated as [regexp, action, after]

	"action" can be a function as above, or "true" to create a token with its name equal to the match,
	or an arbitrary string, which will be a token name, and the match will be its value.

	"after" can be a string indicating a switch to a new state. If it is falsy, the old state is preserved.

	Token is implemented by a naked object:

	{
		name: "+"
		// token-specific data
	}

	Scanner produces tokens with the method "getToken()". In order to initialize it call "start(input)".
	Actions can put recognized tokens in scanner.tokens array.
 */

(function(){
	dojo.declare("shards.opp.Scanner", null, {
		constructor: function(init, rules){
			this.state = this.init = init;
			this.rules = {};
			for(var state in rules){
				if(rules.hasOwnProperty(state)){
					this.rules[state] = dojo.map(rules[state], function(rule){
						if(rule instanceof Array){
							rule = {
								regexp: rule[0],
								action: rule[1],
								after:  rule[3]
							};
						}
						rule.regexp = new RegExp("^(" + rule.regexp.source + ")");
						if(typeof rule.action != "function"){
							rule.action = next(rule);
						}
						return rule;
					});
				}
			}
		},
		match: function(input){
			var rule = -1, match = "", m,
				rules = this.rules[this.state], i = rules.length - 1;
			for(; i >= 0; --i){
				m = input.match(rules[i].regexp);
				if(m && m[1].length >= match.length){
					match = m[1];
					rule = i;
				}
			}
			if(rule >= 0){
				return rules[rule].action(match, input.substring(match.length), this);
			}
			throw Error("No match found for input");
		},
		continuation: function(input){
			var scanner = this;
			return function(){
				return scanner.match(input);
			};
		},
		// public API
		start: function(input){
			this.state = this.init;
			this.tokens = [];
			this.next = this.match(input);
		},
		getToken: function(){
			if(!this.tokens.length && typeof this.next == "function"){
				for(var next = this.next; typeof next == "function" && !this.tokens.length; next = next(this)){}
				this.next = next;
			}
			if(this.tokens.length){
				return this.tokens.shift();
			}
			throw Error("Requested tokens when stream is empty");
		}
	});

	// canned actions

	function next(rule){
		var action = rule.action, after = rule.after;
		return function(match, rest, scanner){
			if(action){
				scanner.tokens.push({name: action === true ? match : action, value: match});
			}
			if(after){
				scanner.state = after;
			}
			return after === false ? null : scanner.continuation(rest);
		};
	}

	// "lazy" operations

	// lexing complete input
	shards.opp.run = function(input, scanner){
		// uses trampoline
		for(var next = scanner.match(input); typeof next == "function"; next = next(scanner)){}
		return next;
	};
})();
