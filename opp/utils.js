dojo.provide("shards.opp.utils");

shards.opp.utils.convert = function(table, convert){
	return dojo.map(table, function(item){
		if(item instanceof Array){
			return convert.apply(null, item);
		}
		return item;
	});
};
