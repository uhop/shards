dojo.provide("shards.opp.utils");

shards.opp.utils.convert = function(table, convert){
	if(convert instanceof Array){
		return dojo.map(table, function(item){
			if(item instanceof Array){
				var o = {};
				dojo.forEach(convert, function(name, i){
					o[name] = item[i];
				});
				return o;
			}
			return item;
		});
	}
	return dojo.map(table, function(item){
		if(item instanceof Array){
			return convert.apply(null, item);
		}
		return item;
	});
};
