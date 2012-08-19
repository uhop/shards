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
		constructor: function(init, rules, eosName){
			this.state = this.init = init;
			this.rules = {};
			for(var state in rules){
				if(rules.hasOwnProperty(state)){
					this.rules[state] = dojo.map(rules[state], function(rule){
						if(rule instanceof Array){
							rule = {
								regexp: rule[0],
								action: rule[1],
								value:  rule[2],
								after:  rule[3]
							};
						}
						rule.regexp = new RegExp("^(" + rule.regexp.source + ")");
						if(typeof rule.action != "function"){
							if(!rule.action){
								rule.action = switchNext(rule.after);
							}else if(rule.action === true){
								rule.action = selfTokenSwitch(rule.after);
							}else{
								rule.action = (rule.value ? valueTokenSwitch : namedTokenSwitch)(rule.action, rule.after);
							}
						}
						return rule;
					});
				}
			}
			this.eosName = eosName || "eos";
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
			return {name: this.eosName};
		}
	});

	// canned actions

	function next(match, rest, scanner){
		return scanner.continuation(rest);
	}

	function switchNext(newState){
		if(newState){
			return function(match, rest, scanner){
				scanner.state = newState;
				return scanner.continuation(rest);
			};
		}
		return next;
	}

	function selfToken(match, rest, scanner){
		scanner.tokens.push({name: match});
		return scanner.continuation(rest);
	}

	function selfTokenSwitch(newState){
		if(newState){
			return function(match, rest, scanner){
				scanner.tokens.push({name: match});
				scanner.state = newState;
				return scanner.continuation(rest);
			};
		}
		return selfToken;
	}

	function namedToken(id){
		return function(match, rest, scanner){
			scanner.tokens.push({name: id});
			return scanner.continuation(rest);
		};
	}

	function namedTokenSwitch(id, newState){
		if(newState){
			return function(id){
				scanner.tokens.push({name: id});
				scanner.state = newState;
				return scanner.continuation(rest);
			};
		}
		return namedToken(id);
	}

	function valueToken(id){
		return function(match, rest, scanner){
			scanner.tokens.push({name: id, value: match});
			return scanner.continuation(rest);
		};
	}

	function valueTokenSwitch(id, newState){
		if(newState){
			return function(id){
				scanner.tokens.push({name: id, value: match});
				scanner.state = newState;
				return scanner.continuation(rest);
			};
		}
		return valueToken(id);
	}

	// "lazy" operations

	// lexing complete input
	shards.opp.run = function(input, scanner){
		// uses trampoline
		for(var next = scanner.match(input); typeof next == "function"; next = next(scanner)){}
		return next;
	};
})();
