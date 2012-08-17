dojo.provide("shards.opp.Scanner");

dojo.require("shards.opp.utils");

// Based on ideas by Matt Might (http://matt.might.net/articles/lexing-and-syntax-highlighting-in-javascript/).

/*
	Rule table item is implemented by a naked object:

	{
		regexp: /\d+/,                              // regular expression to match
		action: function(match, rest, scanner){...} // action to take on match
		// rule-specific data
	}

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
		constructor: function(rules, eosName){
			this.rules = shards.opp.utils.convert(rules, shards.opp.convertRule);
			this.eosName = eosName || "eos";
		},
		match: function(input){
			var rule = -1, match = "", m, i = this.rules.length - 1;
			for(; i >= 0; --i){
				m = input.match(this.rules[i].regexp);
				if(m && m[1].length >= match.length){
					match = m[1];
					rule = i;
				}
			}
			if(rule >= 0){
				return this.rules[rule].action(match, input.substring(match.length), this);
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
			return {name: this.eosName};
		}
	});

	// utilities

	shards.opp.convertRule = function(regexp, action){
		return {
			regexp: new RegExp("^(" + regexp.source + ")"),
			action: action
		};
	};

	// "lazy" operations

	// lexing complete input
	shards.opp.run = function(input, scanner){
		// uses trampoline
		for(var next = scanner.match(input); typeof next == "function"; next = next(scanner)){}
		return next;
	};
})();
