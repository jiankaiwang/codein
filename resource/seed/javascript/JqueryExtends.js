/*
 * desc : parse URL to array("variable" : "value")
 * usge : $.getUrlVar("token");
 */
$.extend({ 
	getUrlVars: function(){ 
		var vars = [], hash; 
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&'); 
		for(var i = 0; i < hashes.length; i++) 
		{ 
			hash = hashes[i].split('='); 
			vars.push(hash[0]); 
			vars[hash[0]] = hash[1]; 
		} 
		return vars; 
	}
	, 
	getUrlVar: function(name){ 
		return $.getUrlVars()[name]; 
	} 
});

/*
 * desc : parse URL to array("variable" : "value")
 * usge : $.getUrlVarsByChar('#',"token");
 */
$.extend({ 
	getUrlVarsByCharBody: function(word){ 
		var vars = [], hash; 
		var hashes = window.location.href.slice(window.location.href.indexOf(word) + 1).split('&'); 
		for(var i = 0; i < hashes.length; i++) 
		{ 
			hash = hashes[i].split('='); 
			vars.push(hash[0]); 
			vars[hash[0]] = hash[1]; 
		} 
		return vars; 
	}
	, 
	getUrlVarsByChar: function(word, name){ 
		return $.getUrlVarsByCharBody(word)[name]; 
	} 
});
