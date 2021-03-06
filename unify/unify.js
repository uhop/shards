dojo.provide("shards.unify");

(function(){
	"use strict";

	// AnyVar

	var _ = {};

	// Env

	function Env(){
		this.variables = {};
		this.values = {};
	}

	Env.prototype.bindVar = function(name1, name2){
		var vars = this.variables, u, t, k;
		if(vars.hasOwnProperty(name1)){
			u = vars[name1];
			if(vars.hasOwnProperty(name2)){
				t = vars[name2];
				for(k in t){
					if(t.hasOwnProperty(k)){
						vars[k] = u;
						u[k] = 1;
					}
				}
			}else{
				vars[name2] = u;
				u[name2] = 1;
			}
		}else{
			if(vars.hasOwnProperty(name2)){
				u = vars[name1] = vars[name2];
				u[name1] = 1;
			}else{
				u = vars[name1] = vars[name2] = {};
				u[name1] = u[name2] = 1;
			}
		}
	};

	Env.prototype.bindVal = function(name, val){
		if(this.variables.hasOwnProperty(name)){
			var names = this.variables[name];
			for(var k in names){
				if(names.hasOwnProperty(k)){
					this.values[k] = val;
				}
			}
		}else{
			this.values[name] = val;
		}
	};

	// Var

	var unique = 0;

	function Var(name){
		this.name = name || ("var" + unique++);
	}

	Var.prototype.bound = function(env){
		return env.values.hasOwnProperty(this.name);
	};

	Var.prototype.get = function(env){
		return env.values[this.name];
	};

	Var.prototype.unify = function(val, env){
		if(this.bound(env)){
			return unify(this.get(env), val, env);
		}
		// the next case is taken care of in unify() directly
		// the case of unbound variable
		//if(val === _ || val === this){
		//	return env;
		//}
		if(val instanceof Var){
			if(val.bound(env)){
				env.bindVal(this.name, val.get(env));
			}else{
				env.bindVar(this.name, val.name);
			}
			return env;
		}
		env.bindVal(this.name, val);
		return env;
	};

	function isVariable(x){
		return x && x instanceof Var;
	}

	function variable(name){
		return new Var(name);
	}

	// Incomplete

	function Incomplete(object, rest){
		this.object = object;
		this.rest = rest;
	}

	function isIncomplete(x){
		return x && x instanceof Incomplete;
	}

	function incomplete(object, rest){
		return new Incomplete(object, rest);
	}

	// unification

	function unify(l, r, env){
		env = env || new Env();
		// direct unity or anyvar
		if(l === r || l === _ || r === _){
			return env;
		}
		// unify with variables
		if(l && l instanceof Var) {
			return l.unify(r, env);
		}
		if(r && r instanceof Var) {
			return r.unify(l, env);
		}
		// unify incomplete structures
		if(l && l instanceof Incomplete){
			if(r && r instanceof Incomplete){
				var result = unify(l.object, r.object, env);
				if(!result){
					return null;
				}
				if(l.rest && r.rest){
					return unify(l.rest, r.rest, env);
				}
				return env;
			}
			return unifyIncompleteObjects(l, r, env);
		}
		if(r && r instanceof Incomplete){
			return unifyIncompleteObjects(r, l, env);
		}
		// check rough types
		if(typeof l != typeof r || typeof l != "object" || !l || !r){
			return null;
		}
		// unify arrays
		if(l instanceof Array){
			if(r instanceof Array){
				return unifyArrays(l, r, env);
			}
			return null;
		}
		if(r instanceof Array){
			return null;
		}
		// unify dates
		if(l instanceof Date){
			if(r instanceof Date){
				return l.getTime() == r.getTime ? env : null;
			}
			return null;
		}
		if(r instanceof Date){
			return null;
		}
		// unify regular expressions
		if(l instanceof RegExp){
			if(r instanceof RegExp){
				return l.source == r.source && l.global == r.global &&
					l.multiline == r.multiline && l.ignoreCase == r.ignoreCase ? env : null;
			}
			return null;
		}
		if(r instanceof RegExp){
			return null;
		}
		// unify objects
		return unifyExactObjects(l, r, env);
	}

	function unifyArrays(l, r, env){
		if(l.length != r.length){
			return null;
		}
		for(var i = 0; i < l.length; ++i){
			var result = unify(l[i], r[i], env);
			if(!result){
				return null;
			}
		}
		return env;
	}

	function unifyIncompleteArrays(il, r, env){
		// left is incomplete
		var l = il.object;
		if(l.length > r.length){
			return null;
		}
		for(var i = 0; i < l.length; ++i){
			var result = unify(l[i], r[i], env);
			if(!result){
				return null;
			}
		}
		if(il.rest){
			return unify(il.rest, r.slice(l.length), env);
		}
		return env;
	}

	function unifyExactObjects(l, r, env){
		// unify all left properties
		for(var k in l){
			if(l.hasOwnProperty(k)){
				if(!r.hasOwnProperty(k)){
					return null;
				}
				var result = unify(l[k], r[k], env);
				if(!result){
					return null;
				}
			}
		}
		// check if any right properties are missing in the left
		for(k in r){
			if(r.hasOwnProperty(k)){
				if(!l.hasOwnProperty(k)){
					return null;
				}
			}
		}
		return env;
	}

	function unifyIncompleteObjects(il, r, env){
		// left is incomplete
		var l = il.object;
		// incomplete arrays
		if(l instanceof Array){
			return unifyIncompleteArrays(il, r, env);
		}
		// unify all left properties
		for(var k in l){
			if(l.hasOwnProperty(k)){
				if(!r.hasOwnProperty(k)){
					return null;
				}
				var result = unify(l[k], r[k], env);
				if(!result){
					return null;
				}
			}
		}
		// unify the rest variable, if needed
		if(il.rest){
			// collect extra properties
			var o = {};
			for(k in r){
				if(r.hasOwnProperty(k)){
					if(!l.hasOwnProperty(k)){
						o[k] = r[k];
					}
				}
			}
			return unify(il.rest, o, env);
		}
		return env;
	}

	unify._ = _;
	unify.variable = variable;
	unify.isVariable = isVariable;
	unify.incomplete = incomplete;
	unify.isIncomplete = isIncomplete;
	unify.Env = Env;

	shards.unify = unify;
})();
