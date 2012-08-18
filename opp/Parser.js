dojo.provide("shards.opp");

dojo.require("shards.opp.utils");

// Based on the classic stream-based operator precedence parser by Max Motovilov.
// (c) 2000-2010 Max Motovilov, Eugene Lazutkin, used here under the BSD license

/*
	State table item is implemented by a naked object:

	{
		name:   "+",
		iPrty:  7000,       // input priority
		oPrty:  7001,       // output priority
		before: "operator", // expected state before
		after:  "operand"   // state after
		// extra: state-specific data
	}

	Priority:

	iPrty = 0        -- end of statement
	iPrty < oPrty    -- left associated operator
	iPrty > oPrty    -- right associated operator
	iPrty == oPrty   -- non-associated associated operator or brackets

	State:

	before == "operand"  && after == "operand"    -- unary prefix operator
	before == "operator" && after == "operator"   -- unary postfix operator
	before == "operator" && after == "operand"    -- binary infix operator
	before == "operand"  && after == "operator"   -- operand

	Token is implemented by a naked object:

	{
		name: "+"
		// token-specific data
	}

	Term is implemented by a naked object:

	{
		token: token,   // see above
		state: state    // see above
	}

	Brackets are either a bag of matching brackets:

	{
		"(": ")",
		"[": "]"
	}

	Or a string of them (only for one-character brackets): "()[]"

	Scanner produces tokens with the method "getToken()".

	Interpreter consumes terms with the method "putTerm(term)".
*/

(function(){
	dojo.declare("shards.opp.Parser", null, {

		state:    "supply",  // current parser state
		expected: "",        // currently expected input
		term: null,          // current term

		constructor: function(init, table, brackets){
			// transform table, if needed
			table = shards.opp.utils.convert(table, ["name", "iPrty", "oPrty", "before", "after", "extra"]);
			// split the table
			this.tables = {};
			dojo.forEach(table, function(item){
				var table = this.tables[item.before];
				if(!table){
					table = this.tables[item.before] = {};
				}
				table[item.name] = item;
			}, this);
			this.expected = this.init = init;
			if(typeof brackets == "string"){
				// split brackets
				this.brackets = {};
				for(var i = 0; i + 1 < brackets.length; i += 2){
					this.brackets[brackets.charAt(i)] = brackets.charAt(i + 1);
				}
			}else{
				this.brackets = brackets;
			}
			// initialize internal variables
			this.stack = [];
		},

		reset: function(){
			this.stack = [];
			this.state = "supply";
			this.expected = this.init;
		},

		supply: function(token){
			//assert(this.state == "supply");
			var newState = this.tables[this.expected][token.name];
			if(!newState){
				throw Error("Unknown input symbol: " + token.name + ", " + this.expected + " was expected");
			}
			this.term = {token: token, state: newState};
			this._decide();
		},

		consume: function(){
			if(this.state == "eos"){
				this.state = "done";
				return this.term;
			}

			//assert((this.state in lib.op.Parser.consumeReadyState) && this.stack.length);
			var t = this.stack.pop();

			if(this.state == "consume"){
				this._decide();
			}else{
				//assert(this.state == "bracket");
				this.stack.push(this.term);
				this.state = "supply";
			}

			return t;
		},

		_decide: function(){
			var iPrty = this.term.state.iPrty,
				oPrty = this.stack.length ? this.stack[this.stack.length - 1].state.oPrty : 0;

			if(iPrty > oPrty){
				this.expected = this.term.state.after;
				this.stack.push(this.term);
				this.state = "supply";
			}else if(iPrty < oPrty){
				this.state = this.stack.length ? "consume" : "eos";
			}else{
				if(this.brackets[this.stack[this.stack.length - 1].token.name] == this.term.token.name){
					this.state = "bracket";
				}else{
					throw Error("Unbalanced brackets or operator is not associative");
				}
			}
		}
	});

	var consumeReadyState = {consume: 1, bracket: 1, eos: 1};

	// "lazy" operations

	// "pull" mode of operations
	shards.opp.getTerm = function getNextTerm(parser, scanner){
		while(parser.state == "supply"){
			parser.supply(scanner.getToken());
		}
		return parser.state == "done" ? null : parser.consume();
	};

	// "push" mode of operations
	shards.opp.putToken = function putNextToken(parser, token, interpreter){
		if(parser.state == "done"){
			return false;
		}
		//assert(parser.state == "supply");
		parser.supply(token);
		while(parser.state in consumeReadyState){
			interpreter.putTerm(parser.consume());
		}
		return parser.state != "done";
	};

	// parsing complete statement
	shards.opp.parse = function parse(parser, scanner, interpreter){
		while(shards.opp.putToken(parser, scanner.getToken(), interpreter)){}
	}
})();
