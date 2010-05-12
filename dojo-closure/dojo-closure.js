dojo.provide("shards.dojo-closure");

// setting globals

dojo.global.goog = dojo.global.goog || {};
goog.global = dojo.global;
goog.DEBUG  = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.typedef = true;

// export utilities

goog.exportPath_ = function(name, opt_object, opt_objectToExportTo){
	return dojo.setObject(name, opt_object === undefined ? {} : opt_object, opt_objectToExportTo);
};

goog.getObjectByName = function(name, opt_obj){
	return dojo.getObject(name, false, opt_obj);
};

goog.globalize = function(obj, opt_global) {
	dojo._mixin(opt_global || dojo.global, obj);
};

// dependency utilities & loader

goog.deps_ = {
	nameToModule: {},
	moduleLoaded: {}
};

goog.THIRD_PARTY_PREFIX_ = "../../third_party/closure/goog/";

goog.addDependency = function(relPath, provides, requires){
	// convert relPath to dojo module
	if(relPath.slice(-3).toLowerCase() == ".js"){
		relPath = relPath.slice(0, -3);
	}
	var modulePrefix = "goog";
	if(relPath.slice(0, goog.THIRD_PARTY_PREFIX_.length) == goog.THIRD_PARTY_PREFIX_){
			modulePrefix = "googThirdPartyPrefix";
			relPath = relPath.slice(goog.THIRD_PARTY_PREFIX_.length);
	}
	var module = modulePrefix + "." + relPath.split("/").join(".");
	// set up internal structures
	dojo.forEach(provides, function(name){
		goog.deps_.nameToModule[name] = module;
	});
};

goog.provide = dojo.provide;

goog.require = function(name){
	var module = goog.deps_.nameToModule[name];
	if(!goog.deps_.moduleLoaded[module]){
		dojo.require(module, true);
		goog.deps_.moduleLoaded[module] = true;
	}
};

dojo.registerModulePath("googThirdPartyPrefix", dojo._getModulePrefix("goog") + "/" + goog.THIRD_PARTY_PREFIX_);
dojo.require("goog.deps", true);

// language helpers

goog.nullFunction = function(){};

goog.identityFunction = function(x){ return x; };

goog.abstractMethod = function(){
	throw Error('unimplemented abstract method');
};

goog.addSingletonGetter = function(ctor){
  ctor.getInstance = function(){
    return ctor.instance_ || (ctor.instance_ = new ctor());
  };
};

goog.typeOf = function(val){
	var t = typeof val;
	switch(t){
		case "object":
			if(val){
				switch(Object.prototype.toString.call(val)){
					case "[object Array]":		return "array";
					case "[object Function]":	return "function";
				}
				return "object";
			}
			return "null";
		case "function":
			if(!value.call)	return "object";
			// intentional fall down
	}
	return t;
};

goog.isDef = function(val){
	return val !== undefined;
};

goog.isNull = function(val){
	return val === null;
};

goog.isDefAndNotNull = function(val){
	return val != null;
};

goog.isArray = dojo.isArray;

goog.isArrayLike = dojo.isArrayLike;

goog.isDateLike = function(val){
	return goog.isObject(val) && typeof val.getFullYear == "function";
};

goog.isString = dojo.isString;

goog.isBoolean = function(val){
	return typeof val == "boolean";
};

goog.isNumber = function(val){
	return typeof val == "number";
};

goog.isFunction = dojo.isFunction;

goog.isObject = dojo.isObject;

// UID

goog.getUid = function(obj) {
	var uidProp = goog.UID_PROPERTY_;
	if(obj.hasOwnProperty ? obj.hasOwnProperty(uidProp) : obj[uidProp]){
		return obj[uidProp];
	}
	return obj[uidProp] = ++goog.uidCounter_;
};

goog.removeUid = function(obj) {
	var uidProp = goog.UID_PROPERTY_;
	if(obj.removeAttribute){
		obj.removeAttribute(uidProp);
	}
	try{
		delete obj[uidProp];
	}catch(ex){}
};

goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;

goog.getHashCode = goog.getUid;

goog.removeHashCode = goog.removeUid;

// general utilities

goog.cloneObject = function(obj){
	if(obj && obj.clone){
		return obj.clone();
	}
	return dojo.clone(obj);
};

goog.bind = function(fn, context, var_args){
	var args = [context, fn];
	if(arguments.length > 2){
		args = args.concat(Array.prototype.slice.call(arguments, 2));
	}
	return dojo.hitch.apply(dojo, args);
};

goog.partial = function(fn, var_args){
	var args = Array.prototype.slice.call(arguments, 1);
	return function() {
		return fn.apply(this, args.concat(Array.prototype.slice.call(arguments)));
	};
};

goog.mixin = dojo.mixin;

goog.now = Date.now || (function() {
	return +new Date();
});

// is it the same as dojo.eval?
goog.globalEval = dojo["eval"];
/*
goog.globalEval = function(script) {
	if(goog.global.execScript){
		goog.global.execScript(script, "JavaScript");
	}else if(goog.global.eval){
		if(goog.evalWorksForGlobals_ == null){
			goog.global.eval("var _et_ = 1;");
			if(typeof goog.global["_et_"] != "undefined"){
				delete goog.global["_et_"];
				goog.evalWorksForGlobals_ = true;
			}else{
				goog.evalWorksForGlobals_ = false;
			}
		}
		if(goog.evalWorksForGlobals_){
			goog.global.eval(script);
		}else{
			var doc = goog.global.document;
			var scriptElt = doc.createElement("script");
			scriptElt.type = "text/javascript";
			scriptElt.defer = false;
			scriptElt.appendChild(doc.createTextNode(script));
			doc.body.appendChild(scriptElt);
			doc.body.removeChild(scriptElt);
		}
	}else{
		throw Error("goog.globalEval not available");
	}
};
*/

// CSS utilities

goog.getCssName = function(className, opt_modifier){
	if(opt_modifier){
		className = className + "-" + opt_modifier;
	}
	return (goog.cssNameMapping_ && (className in goog.cssNameMapping_)) ?
		goog.cssNameMapping_[className] : className;
};

goog.setCssNameMapping = function(mapping){
	goog.cssNameMapping_ = mapping;
};

goog.getMsg = function(str, opt_values){
	return dojo.replace(str, opt_values || {}, /\{\$([^\}]+)\}/gi);
};

// export utilities

goog.exportSymbol = goog.exportPath_;

goog.exportProperty = function(object, publicName, symbol){
	object[publicName] = symbol;
};

// OOP utilities

goog.inherits = function(childCtor, parentCtor){
	childCtor.superClass_ = parentCtor.prototype;
	childCtor.prototype = dojo.delegate(parentCtor.prototype);
	childCtor.prototype.constructor = childCtor;
};

goog.base = function(me, opt_methodName, var_args){
	var caller = arguments.callee.caller;
	var aps = Array.prototype.slice;

	if (caller.superClass_) {
		return caller.superClass_.constructor.apply(me, aps.call(arguments, 1));
	}

	var args = aps.call(arguments, 2);
	var foundCaller = false;
	for(var ctor = me.constructor; ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor){
		if(ctor.prototype[opt_methodName] === caller){
			foundCaller = true;
		}else if (foundCaller){
			return ctor.prototype[opt_methodName].apply(me, args);
		}
	}
	
	if(me[opt_methodName] !== caller){
		throw Error("goog.base called from a method of one name to a method of a different name");
	}
	return me.constructor.prototype[opt_methodName].apply(me, args);
};
