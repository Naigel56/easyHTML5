/**
 * @projectDescription   javascript library to use an object oriented paradigm to
 * build complex web application
 *
 * @author   Lorenzo Cavazzi   lorenzo.cavazzi@mail.polimi.it
 * @version  0.6.1
 */



// hide every function to global
(function(){
	
// *********** GENERAL VARIABLES **********//

// library infos
var easyHTML5 = {
	'version' : '0.6.1',
	'date' : '09.08.2012',
	'author' : 'Lorenzo Cavazzi',
    'contact': 'lorenzo.cavazzi@mail.polimi.it'
};

// global variables
var items = new Array();
var itemNames = new Array();
var itemsToDraw = new Array();
var itemsLive = new Array();

var itemsReset = new Object();
var errors = new Array();
var arrayBindings = new Array();

var elementsAfter = [];

// Error codes
var CRITICALERROR = -1;
var NOARGS = -2;
var WRONGARGS = -3;
var INTERNAL_NOARGS = -5;
var INTERNAL_WRONGARGS = -6;
var WARNING = -10;
var CALLTIME = -12;
var WRONGITEMNAME = -3;
var ERRORDISP = {
	'NODISP': 0,
	'ONLYCONSOLE': 1,
	'ONLYPOPUP': 10,
	'CONSOLEPOPUP': 11
};
var ERRHANDLE = ERRORDISP.ONLYCONSOLE;


// constants and RegExp
var DUMMY = 0;
var REGDOUBLEPOINT = /\:/;
var REGPOINT = /\./;
var REGOPENSB = /\[/;
var REGCLOSESB = /\]/;
var REGDATEBACKSLASH1 = /\d\d\d\d\/\d\d\/\d\d/;
var REGDATEBACKSLASH2 = /\d\d\/\d\d\/\d\d\d\d/;
var REGDATEMINUS1 = /\d\d\d\d-\d\d-\d\d/;
var REGDATEMINUS2 = /\d\d-\d\d-\d\d\d\d/;
var REGDATE = /\d\d\d\d/;
var REGDOTGET = /\.get\(\)/;
//var REGSUBBINDING = /(\w|\d|\[|\])+\.(\w|\d)+\.get\(\)/gi;
var REGSUBBINDING = /((\w|\d)+|((\w|\d)+\[(\w|\d|\.)+\]))\.(\w|\d)+\.get\(\)/gi;
var REGGET = /\.get\(\)/;
var REGLONGARRAY = /(\w|\d|)+\[(\w|\d|)+\].(\w|\d)+/;


var ISRUNTIME = false;
var HADLIVECHANGES = false;
var DEBUG = true;




//*********** ITEM **********//
/**
* Item is the foundamental element of this library.
* 
* @return Item   Returns a new Item.
*/
function Item() {
	// check if any input to use as constructor
	if (arguments.length > 0) {
		// if argument passed is the name of another item, the new item will be a copy of the second one
		if (arguments.length === 1 && typeof(arguments[0]) === 'object' && arguments[0] instanceof Item) {
			// copy attributes
			this._semideepCopy(arguments[0]);
		}
		// if argument passed is the name of another item, the new item will be a copy of the second one
		else if (arguments.length === 1 && typeof(arguments[0]) === 'string' && _extractItem(arguments[0])) {
			var toCopy = _extractItem(arguments[0]);
			
			// copy attributes
			this._semideepCopy(toCopy);	
		}
		// if argument passed is a JSON string
		else if (arguments.length === 1 && typeof(arguments[0]) === 'string' && !_extractItem(arguments[0])) {
			// check if input is JSON or not
			if (/^[\],:{}\s]*$/.test(arguments[0].replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
				// parse to an object
				var tmpJSONstructure = JSON.parse(arguments[0]);
				
				// adding sub-object attributes
				for (var sub in tmpJSONstructure) {
					var subObj = tmpJSONstructure[sub];
					
					// add name attribute
					subObj["name"] = sub;
					
					// if attribute is a _sNumber, _sString or _sBollean, add it if at least name is defined
					if (subObj["___type"] == "string" || subObj["___type"] == "number" || subObj["___type"] == "boolean" || subObj["___type"] == "date") {
						if (subObj["___type"] == "number") {
							delete subObj["___type"];
							this.addNumber(subObj);
						} else if (subObj["___type"] == "string") {
							delete subObj["___type"];
							this.addString(subObj);
						} else if (subObj["___type"] == "boolean") {
							delete subObj["___type"];
							this.addBoolean(subObj);
						} else if (subObj["___type"] == "date") {
							delete subObj["___type"];
							this.addDate(subObj);
						}
					}
				}
				
				// adding local storage if defined
				if (tmpJSONstructure["localStorage"] != undefined) {
					this["localStorage"] = tmpJSONstructure["localStorage"];
				}
				
			}
			// if not correctly formatted in JSON signals error
			else {
				errore("Item", WRONGARGS, "Item initializazion with wrong parameter: the string is not an Item name neither correctly formatted JSON code");
			}
			
			// TRY CATCH WAY
			// try {
				// var tmpJSONstructure = JSON.parse(arguments[0]);
			// } catch (e) {
				// 
			// }
		}
		// if none of the cases above, signals error
		else {
			errore("Item", WRONGARGS, "Item initializazion with wrong parameter(s)");
		}
	}
	
	// define localStorage
	if (this["localStorage"] == undefined) {
		this.localStorage = false;
	}
	
	// initialize array containing reference to items that has a binding to this item
	this.bindingRef = [];
	this.bindingRefAdvanced = [];
	this.bindingRefSocket = [];
	
	// save a reference to this object in a global variable
	items.push(this);

	return this;
}


/**
* Creates a new sNumber object as item's method to store numbers.
* 
* @param objIn   accept one or more strings or objects. string are in the form "name" or
* "name:value" where value must be a number; object are in the form {"attribute":"value",
* "aatribute2":"value2", ...} with "name" mandatory
* @return Item   Returns this item.
* @example myItem.addNumber({"name": string, "value": number, "label": string, "modifiable": boolean,
* "binded": string, "max": number, "min": number, "isInteger": boolean});
* @example myItem.addNumber("gol1", "gol2", "golCasa:4", "golFuori:1", {"name": "totaleGoal", "value": 5});
*/
Item.prototype.addNumber = function(objIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("addNumber", NOARGS, "insufficient input arguments, at least 1 is required");
        return this;
    // if at least 1 argument in input
    } else {
        // for every argument
        for (var argIn = arguments.length, i=0; i<argIn; i++) {
            var thisArg = arguments[i];
            // if number or boolean signals warning and add a void metod as variable's name
            if (typeof(thisArg) === 'number' || typeof(thisArg) === 'boolean') {
                errore("addNumber", WARNING, "variable name is a number or a boolean, it should be a string");
                this[thisArg] = new _sNumber({"name": thisArg});
            // if string
            } else if (typeof(thisArg) === 'string') {
                // check if defined also a value to assign
                var doublePointPos = thisArg.search(REGDOUBLEPOINT);
                if (doublePointPos != -1) {
                    // extract name and value
                    var name = thisArg.substring(0, doublePointPos)
                    var value = parseFloat(thisArg.substring(doublePointPos+1, thisArg.length));
                    // if value is not a number signals warning and only define variable
                    if (isNaN(value)) {
                        errore("addNumber", WARNING, "value is not parsable to a number, it will not be assigned");
                        this[name] = new _sNumber({"name": name});
                    // if number assign also value
                    } else {
                        this[name] = new _sNumber({"name": name, "value": value});
                    }
                // if not, define only variable's name
                } else {
                    this[thisArg] = new _sNumber({"name": thisArg});
                }
            // if array or object
            } else {
                // if array signals warning
                if (thisArg.length) {
                    errore("addNumber", WARNING, "input variable is an array, it's not supported");
                // final case: object
                } else { 
                    // check if at least name property is defined
                    if (thisArg.name) {
                        this[thisArg.name] = new _sNumber(thisArg);
                    // if name not defined warning
                    } else {
                        errore("addNumber", WARNING, "input object doesn't have a name property, it's mandatory. It will no be created");
                    }
                }
            }
        }   
    }
    
    return this;
};
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "addNumber", {enumerable: false});


/** 
 * Creates a new sString object as item's method to store strings.
 * 
 * @param objIn   accept the following combination of objects: string (defines a sString
 * name or its name and its value if in the form "name:value"), object (defines any
 * sString's method; name is mandatory).
 * @return Item     Returns this item
 * @example sString({name: string, value: string, modifiable: boolean, binded: string});
 * myItem.addString("squadra1", "squadra2", "inCasa:no", {"name": "risultato", "value": "pareggio"});
 */
Item.prototype.addString = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("addString", NOARGS, "insufficient input arguments, at least 1 is required");
        return this;
    // if at least 1 argument in input
    } else {
        // for every argument
        for (var argIn = arguments.length, i=0; i<argIn; i++) {
            var thisArg = arguments[i];
            // if number or boolean signals warning and add a void metod as variable's name
            if (typeof(thisArg) === 'number' || typeof(thisArg) === 'boolean') {
                errore("addString", WARNING, "variable name is a number or a boolean, it should be a string");
                this[thisArg] = new _sString({"name": thisArg});
            // if string
            } else if (typeof(thisArg) === 'string') {
                // check if defined also a value to assign
                var doublePointPos = thisArg.search(REGDOUBLEPOINT);
                if (doublePointPos != -1) {
                    // extract name and value
                    var name = thisArg.substring(0, doublePointPos)
                    var value = thisArg.substring(doublePointPos+1, thisArg.length);
                    // if value is a number signals warning, convert to number and assign
                    this[name] = new _sString({"name": name, "value": value.toString()});
                // if not, define only variable's name
                } else {
                    this[thisArg] = new _sString({"name": thisArg});
                }
            // if array or object
            } else {
                // if array signals warning
                if (thisArg.length) {
                    errore("addString", WARNING, "input variable is an array, it's not supported");
                // final case: object
                } else { 
                    // check if at least name property is defined
                    if (thisArg.name) {
                        this[thisArg.name] = new _sString(thisArg);
                    // if name not defined warning
                    } else {
                        errore("addString", WARNING, "input object doesn't have a name property, it's mandatory. It will no be created");
                    }
                }
            }
        }   
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "addString", {enumerable: false});


/** 
 * Creates a new _sBoolean object as item's method to store booleans.
 * 
 * @param objIn   accept the following combination of objects: string (defines a sString
 * name or its name and its value if in the form "name:value"), object (defines any
 * sBoolean's method; name is mandatory).
 * @return Item     Returns this item
 * @example _sBoolean({name: string, value: boolean, modifiable: boolean, binded: string});
 * myItem.addBoolean("squadra1", "squadra2", "inCasa:no", {"name": "risultato", "value": "pareggio"});
 */
Item.prototype.addBoolean = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("addBoolean", NOARGS, "insufficient input arguments, at least 1 is required");
        return this;
    // if at least 1 argument in input
    } else {
        // for every argument
        for (var argIn = arguments.length, i=0; i<argIn; i++) {
            var thisArg = arguments[i];
            // if string or boolean signals warning and parse it to string
            if (typeof(thisArg) === 'number' || typeof(thisArg) === 'boolean') {
                errore("addBoolean", WARNING, "variable name is a number or a boolean, it should be a string");
                this[thisArg] = new _sBoolean({"name": thisArg});
            // if string
            } else if (typeof(thisArg) === 'string') {
                // check if defined also a value to assign
                var doublePointPos = thisArg.search(REGDOUBLEPOINT);
                if (doublePointPos != -1) {
                    // extract name and value
                    var name = thisArg.substring(0, doublePointPos)
                    var value = thisArg.substring(doublePointPos+1, thisArg.length);
                    // if value is not a boolean or is not a string like "true" or "false" signals warning and only define variable
                    if (typeof(value) !== 'boolean' && value != "true" && value != "flase") {
                        errore("addBoolean", WARNING, "value is not parsable to a boolean, it will not be assigned");
                        
                        this[name] = new _sBoolean({"name": name});
                    // if boolean assign also value
                    } else {
                    	if (value == "true") {
                    		value = true;
                    	} else {
                    		value = false;
                    	}
                        this[name] = new _sBoolean({"name": name, "value": value});
                    }
                // if not, define only variable's name
                } else {
                    this[thisArg] = new _sBoolean({"name": thisArg});
                }
            // if array or object
            } else {
                // if array signals warning
                if (thisArg.length) {
                    errore("addBoolean", WARNING, "input variable is an array, it's not supported");
                // final case: object
                } else { 
                    // check if at least name property is defined
                    if (thisArg.name) {
                        this[thisArg.name] = new _sBoolean(thisArg);
                    // if name not defined warning
                    } else {
                        errore("addBoolean", WARNING, "input object doesn't have a name property, it's mandatory. It will no be created");
                    }
                }
            }
        }   
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "addBoolean", {enumerable: false});


/** 
 * Creates a new _sDate object as item's method to store dates.
 * 
 * @param objIn   accept the following combination of objects: string (defines a sDate
 * name or its name and its value if in the form "name:value"), object (defines any
 * sDate's method; name is mandatory).
 * @return Item     Returns this item
 * @example myItem.addDate({name: string, value: "21-06-2012", modifiable: boolean, binded: string});
 * @example myItem.addDate("dataNascita", "giornoMatrimonio", {"name": "battesimo", "value": "10-10-1990"});
 */
Item.prototype.addDate = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("addDate", NOARGS, "insufficient input arguments, at least 1 is required");
        return this;
    // if at least 1 argument in input
    } else {
        // for every argument
        for (var argIn = arguments.length, i=0; i<argIn; i++) {
            var thisArg = arguments[i];
            // if number or boolean signals warning and parse it to string
            if (typeof(thisArg) === 'number' || typeof(thisArg) === 'boolean') {
                errore("addDate", WARNING, "variable name is a number or a boolean, it should be a string");
                this[thisArg] = new _sDate({"name": thisArg});
            // if string
            } else if (typeof(thisArg) === 'string') {
                // check if defined also a value to assign
                var doublePointPos = thisArg.search(REGDOUBLEPOINT);
                if (doublePointPos != -1) {
                    // extract name and value
                    var name = thisArg.substring(0, doublePointPos)
                    var tmpValue = thisArg.substring(doublePointPos+1, thisArg.length);
                    var value = _extractDate(tmpValue);
                    // if value is not a boolean or is not a string like "true" or "false" signals warning and only define variable
                    if (value === false) {
                        errore("addDate", WRONGARGS, "value is not parsable to a date, it will not be assigned");
                    // if date is valido assign value
                    } else {
                        this[name] = new _sDate({"name": name, "value": value});
                    }
                // if not, define only variable's name
                } else {
                    this[thisArg] = new _sDate({"name": thisArg});
                }
            // if array or object
            } else {
                // if array signals warning
                if (thisArg.length) {
                    errore("addDate", WARNING, "input variable is an array, it's not supported");
                // final case: object
                } else { 
                    // check if at least name property is defined
                    if (thisArg.name) {
                        this[thisArg.name] = new _sDate(thisArg);
                    // if name not defined warning
                    } else {
                        errore("addDate", WARNING, "input object doesn't have a name property, it's mandatory. It will no be created");
                    }
                }
            }
        }   
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "addDate", {enumerable: false});



/** 
 * Make this item a copy of input Item
 * 
 * @param toCopy   another Item (different from this) to copy
 * @return Item     Returns this item
 * @example myItem._semideepCopy(anotherItem);
 */
Item.prototype._semideepCopy = function(toCopy){
	// check if toCopy is a valid Item
	if (toCopy instanceof Item && toCopy != this) {
		// for each attribute to copy
		for (var attr in toCopy) {
			// if it's a string, boolean or number
			if (typeof(toCopy[attr]) === 'string' || typeof(toCopy[attr]) === 'number' || typeof(toCopy[attr]) === 'boolean' || typeof(toCopy[attr]) === 'date') {
				// don't copy name attribute
				if (attr != "name") {
					this[attr] = toCopy[attr];
				}
			}
			// if _sNumber, _sString or _sBoolean
			else if (toCopy[attr] instanceof _sNumber || toCopy[attr] instanceof _sString || toCopy[attr] instanceof _sBoolean || toCopy[attr] instanceof _sDate) {
				// create the object
				if (toCopy[attr] instanceof _sNumber) {
					this[attr] = new _sNumber(0);
				} else if (toCopy[attr] instanceof _sString) {
					this[attr] = new _sString(0);
				} else if (toCopy[attr] instanceof _sBoolean) {
					this[attr] = new _sBoolean(0);
				} else if (toCopy[attr] instanceof _sDate) {
					this[attr] = new _sDate(0);
				}
				
				// copy sub attributes. Note that bindings are only referenced
				for (var subAttr in toCopy[attr]) {
					this[attr][subAttr] = toCopy[attr][subAttr];
				}
			}
		}
		
		// create binding array (must be empty)
		this.bindingRef = new Array();
	} else {
		errore("_semideepCopy", INTERNAL_WRONGARGS, "wrong arguments, item not valid");
	}

	return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "_semideepCopy", {enumerable: false});


/**
* save Item data to local storage
* 
* @return itemStorage   Returns an object to store in local storage in order to store values locally.
* @example myItem._toLocalStorage();
*/
Item.prototype._toLocalStorage = function() {
	// create object to save
	var itemStorage = new Object();
	
	// save item name
	// itemStorage["___ItemName"] = this.name;
	
	// save item value of unbinded attributes
	for (var attr in this) {
		var attrToSave = this[attr];
		
		// check if number, booelan or string and eventually save
		if (attrToSave instanceof _sNumber || attrToSave instanceof _sString || attrToSave instanceof _sBoolean || attrToSave instanceof _sDate) {
			// check if not binded
			if (!attrToSave.binded) {
				itemStorage[attrToSave.name] = attrToSave.value;
			}
		}
	}
	
	localStorage[this.name] = JSON.stringify(itemStorage);

    return itemStorage;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "_toLocalStorage", {enumerable: false});

/**
* retrive Item data from local storage
* 
* @return itemStorage   Returns an object stored in local storage in order to retrieve Item data.
* @example myItem._fromLocalStorage();
*/
Item.prototype._fromLocalStorage = function() {
	// create object to save
	var itemStorage = new Object();
	var thisName = this.name;
	
	itemStorage = JSON.parse(localStorage[thisName]);

    return itemStorage;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "_fromLocalStorage", {enumerable: false});


/** 
 * Make this Item a clone of the Item passed as parameter 
 * 
 * @param inputCopy   another Item (different from this) to copy
 * @return Item     Returns this item
 * @example myItem.clone(anotherItem);
 */
Item.prototype.clone = function(inputCopy){
	// check if function is called with at least one argument
	if (arguments.length > 0) {
		// if string, check if item exists
		if (typeof(inputCopy) === 'string') {
			var toCopy = _extractItem(inputCopy);
			
			if (toCopy === false) {
				errore("clone", WRONGARGS, "wrong arguments, string "+inputCopy+" doesn't represente a valid item");
			}
		}
		// if item
		else if (typeof(inputCopy) === 'object' && inputCopy instanceof Item) {
			var toCopy = inputCopy;
		}
		// else signals error
		else {
			errore("clone", WRONGARGS, "wrong arguments, item not valid");
			return this;
		}
			
		// check if toCopy is a valid Item
		if (toCopy instanceof Item && toCopy != this) {
			// clear any actual attribute
			for (var attr in this) {
				delete this[attr];
			}
			
			// copy each attributes
			this._semideepCopy(toCopy);
		} else {
			errore("clone", WRONGARGS, "wrong arguments, item not valid");
		}
	}
	// if no arguments, signals error
	else {
		errore("clone", NOARGS, "no input argument, an Item name to copy from is required");
	}

	return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "clone", {enumerable: false});


/**
* decide if item should be saved to local storage or not
* 
* @param objIn   boolean
* @return Item   Returns this Item.
* @example myItem.localStorage(true/false);
*/
Item.prototype.setLocalStorage = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setLocalStorage", NOARGS, "insufficient input arguments, at least 1 is required");
    // if at least 1 argument in input
    } else {
    	// check if input is boolean
    	if (typeof(objIn) === 'boolean' || objIn === "true" || objIn === "false") {
    		// save true or false
    		if (objIn === true || objIn === "true") {
    			this.localStorage = true;
    		} else {
    			this.localStorage = false;
    		}
    	}
    	// signals error if not boolean
    	else {
    		errore("setLocalStorage", WRONGARGS, "Only boolean value accepted as parameter");
    	}
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "setLocalStorage", {enumerable: false});


/**
* decide if item should be excluded from visualization
* 
* @param objIn   boolean
* @return Item   Returns this Item.
* @example myItem.setInvisible(true/false);
*/
Item.prototype.setInvisible = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setInvisible", NOARGS, "insufficient input arguments, at least 1 is required");
    // if at least 1 argument in input
    } else {
    	// check if input is boolean
    	if (arguments.length === 1 && typeof(objIn) === 'boolean' || objIn === "true" || objIn === "false") {
    		// save true or false
    		if (objIn === true || objIn === "true") {
    			this.invisible = true;
    		} else {
    			this.invisible = false;
    		}
    	}
    	// if input is an object it is a multy-sObject property update
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'object') {
    		// iterate over every couple
    		for (var elem in objIn) {
    			// check if element exists
    			if (_checkSObject(this[elem])) {
    				this[elem].setInvisible(objIn[elem]);
    			}
    			// else signals input error
    			else {
    				errore("setInvisible", WARNING, "sub-object name not valid: '"+ elem + "' doesn't exist.");
    			}
    		}
    	}
    	// if 2 strings in input
    	else if (arguments.length === 2) {
    		// check if sub-element exists
    		var subName = this[arguments[0]];
    		if (_checkSObject(subName)) {
    			subName.setInvisible(arguments[1]);
    		}
    		// else signals error
    		else {
    			errore("setInvisible", WRONGARGS, "wrong input arguments, element "+arguments[0]+" doesn't exists");
    		}
    	}
    	// signals error if not boolean
    	else {
    		errore("setInvisible", WRONGARGS, "Only boolean value accepted as parameter");
    	}
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "setInvisible", {enumerable: false});


/**
* assign a class attribute to item's correspondent HTML element (if argument is a string or an array of strings) 
* or to attributes sObject (if passed 2 string as "name_sObject", "attribute" or 1 object with couples "name sObject": "attribute")
* 
* @param objIn   string or array (item's assignement) OR 2 strings or object (sObject assignment)
* @return Item   Returns this Item.
* @example myItem.setClass("importantItem red");
* @example myItem.setClass(["importantItem", "red"]);
* @example myItem.setClass("mySObject": "red");
* @example myItem.setClass({"sObject1": "attr1", "sObject2": "attr2"});
*/
Item.prototype.setClass = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setClass", NOARGS, "insufficient input arguments, at least 1 is required");
    // if at least 1 argument in input
    } else {
    	// check if input is 1 string
    	if (arguments.length === 1 && typeof(arguments[0]) === 'string') {
    		// save value as classAtribute
    		this.classAttribute = " "+arguments[0];
    		
    	}
    	// if input is an array
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'object' && arguments[0] instanceof Array) {
    		var elemClass = "";
    		// iterate over every element
    		for (var elem in objIn) {
    			var thisStringIn = arguments[elem];
    		
	    		// check if string and eventually add to class string
	    		if (typeof(thisStringIn) === 'string') {
	    			elemClass += " "+thisStringIn;
	    		} else {
	    			errore("setClass", WARNING, thisStringIn+" is not a string and couldn't be used as an HTML class value");
	    		}
    		}
    		
    		// set attribute classAttribute
    		this.classAttribute = elemClass;
    	}
    	// if input is an object it is a multy-sObject property update
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'object' && !(arguments[0] instanceof Array)) {
    		// iterate over every couple
    		for (var elem in objIn) {
    			// check if element exists
    			if (_checkSObject(this[elem])) {
    				this[elem].setClass(objIn[elem]);
    			}
    			// else signals input error
    			else {
    				errore("setClass", WARNING, "sub-object name not valid: '"+ elem + "' doesn't exist.");
    			}
    		}
    	}
    	// if 2 strings in input
    	else if (arguments.length === 2) {
    		// check if sub-element exists
    		var subName = this[arguments[0]];
    		if (_checkSObject(subName)) {
    			subName.setClass(arguments[1]);
    		}
    		// else signals error
    		else {
    			errore("setClass", WRONGARGS, "wrong input arguments, element "+arguments[0]+" doesn't exists");
    		}
    	}
    	// signals error if not boolean
    	else {
    		errore("setClass", WRONGARGS, "1 string or 1 array of strings accepted to manipulate item, 2 string or 1 object accepted to manipulate attribute sObjects");
    	}
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "setClass", {enumerable: false});


/**
* Set attribute value of one or more sub-object (they must be _sString, _sNumber or _sBoolean)
* 
* @param objIn   accept 2 strings or 1 object. 2 Strings are "name", "value"; object is made by
* couple "name":"value"
* @return Item   Returns this item.
* @example myItem.setValue({"squadra": "AC Fiorentina", "annoFondazione": 1929});
* @example myItem.setValue("nomeStadio", "Artemio Franchi");
*/
Item.prototype.setValue = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setValue", NOARGS, "insufficient input arguments, at least 1 is required");
    // if at least 1 argument in input
    } else {
    	// if 2 strings in input
    	if (arguments.length === 2) {
    		// check if sub-element exists
    		var subName = this[arguments[0]];
    		if (_checkSObject(subName)) {
    			subName.setValue(arguments[1]);
    		}
    		// else signals error
    		else {
    			errore("setValue", WRONGARGS, "wrong input arguments, element "+arguments[0]+" doesn't exists");
    		}
    	}
    	// if 1 object in input
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'object') {
    		// iterate over every couple
    		for (var elem in objIn) {
    			// check if element exists
    			if (_checkSObject(this[elem])) {
    				this[elem].setValue(objIn[elem]);
    			}
    			// else signals input error
    			else {
    				errore("setValue", WARNING, "sub-object name not valid: '"+ elem + "' doesn't exist.");
    			}
    		}
    	}
    	// if input is wrong
    	else {
    		errore("setValue", WRONGARGS, "wrong input arguments, 2 strings (name,label) or one object (name1:label1, name2: label2) are accepted");
    	}
    	
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "setValue", {enumerable: false});


/**
* Set attribute label of one or more sub-object (they must be _sString, _sNumber or _sBoolean)
* or set a label to be displayed as item's label
* 
* @param objIn   1 string (an item label) or 2 strings (couple "name" of sObject and "label" to be set)
*  or 1 object (made by couple "name" of sObject to be set: "label")
* @return Item   Returns this item.
* @example myItem.setLabel("albergo");
* @example myItem.setLabel({"squadra": string, "stadio": number});
* @example myItem.setLabel("viaStadio", "Stadio in via");
*/
Item.prototype.setLabel = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setLabel", NOARGS, "insufficient input arguments, at least 1 is required");
    // if at least 1 argument in input
    } else {
    	// if 2 strings in input (no false value)
    	if (arguments.length === 2 && typeof(arguments[0]) === 'string' && typeof(arguments[1]) === 'string' && arguments[1] != "false") {
    		// check if sub-element exists
    		var subName = this[arguments[0]];
    		if (_checkSObject(subName)) {
    			// check if value to assign is a string
    			if (typeof(arguments[1]) === 'string') {
    				subName["label"] = arguments[1];
    			}
    			// check if value is at least parsable to a string
    			else if (typeof(arguments[1]) !== 'string' && typeof(arguments[1]).toString() == 'string') {
    				// signals only a warning
    				errore("setLabel", WARNING, "label is not a string, but it has been parsed");
    				subName["label"] = arguments[1].toString();
    			}
    			// if value not parsable to a string
    			else {
    				errore("setLabel", WRONGARGS, "wrong input arguments, value is not a string and couldn't be parsed");
    			}
    		}
    		// else signals error
    		else {
    			errore("setLabel", WRONGARGS, "wrong input arguments, element "+arguments[0]+" doesn't exists");
    		}
    	}
    	// if 1 string and 'false' value
    	else if (arguments.length === 2 && typeof(arguments[0]) === 'string' && (arguments[1] === false || (typeof(arguments[1]) === 'string' && arguments[1] != "false"))) {
    		// check if sub-element exists
    		var subName = this[arguments[0]];
    		if (_checkSObject(subName)) {
    			subName["label"] = false;
    		}
    	}
    	// if 1 string in input different from false
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'string' && arguments[0] != "false") {
    		this.label = objIn;
    	}
    	// if 1 object in input
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'object') {
    		// iterate over every couple
    		for (var elem in objIn) {
    			// check if element exists
    			if (_checkSObject(this[elem])) {
    				// check if value to assign is a string
	    			if (typeof(objIn[elem]) === 'string' && objIn[elem] != "false") {
	    				this[elem]["label"] = objIn[elem];
	    			}
	    			// check if value to assign is false
	    			else if ((objIn[elem] == false) || (typeof(objIn[elem]) === 'string' && objIn[elem] == "false")) {
	    				
	    			}
	    			// check if value is at least parsable to a string
	    			else if (typeof(objIn[elem]) !== 'string' && typeof(objIn[elem]).toString() == 'string') {
	    				// signals only a warning
	    				errore("setLabel", WARNING, "label is not a string, but it has been parsed");
	    				this[elem]["label"] = objIn[elem].toString();
	    			}
	    			// if value not parsable to a string
	    			else {
	    				errore("setLabel", WRONGARGS, "wrong input arguments, value is not a string and couldn't be parsed");
	    			}
    			}
    			// else signals input error
    			else {
    				errore("setLabel", WARNING, "sub-object name not valid: '"+ elem + "' doesn't exist.");
    			}
    		}
    	}
    	// if boolean false or string 'false'
    	else if (arguments.length === 1 && ((arguments[0] === false) || (typeof(arguments[0]) === 'string' && arguments[0] == "false"))) {
    		this.label = false;
    	}
    	// if input is wrong
    	else {
    		errore("setLabel", WRONGARGS, "wrong input arguments, 2 strings (name,label) or one object (name1:label1, name2: label2) are accepted");
    	}
    	
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "setLabel", {enumerable: false});


/**
* Set attribute modifiable of one or more sub-object (they must be _sString, _sNumber or _sBoolean)
* 
* @param objIn   accept 2 param (1 string + 1 booelan) or 1 object. In first case string is the name, in the second
* object is made by couple "name": value
* @return Item   Returns this item.
* @example myItem.setBoolean({"nuovoGiocatore": true, "italiano": false});
* @example myItem.setBoolean("stadioDiProprieta", false);
*/
Item.prototype.setModifiable = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setModifiable", NOARGS, "insufficient input arguments, at least 1 is required");
    // if at least 1 argument in input
    } else {
    	// if 2 elements in input
    	if (arguments.length === 2) {
    		// check if sub-element exists
    		var subName = this[arguments[0]];
    		if (_checkSObject(subName)) {
    			// check if value to assign is a boolean or a string like "true" or "false"
    			if (typeof(arguments[1]) === 'boolean' || arguments[1] === "true" || arguments[1] == "false") {
    				subName["modifiable"] = arguments[1];
    			}
    			// if not signals error
    			else {
    				errore("setModifiable", WRONGARGS, "wrong input arguments, value is not a boolean");
    			}
    		}
    		// else signals error
    		else {
    			errore("setModifiable", WRONGARGS, "wrong input arguments, element "+arguments[0]+" doesn't exists");
    		}
    	}
    	// if 1 object in input
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'object') {
    		// iterate over every couple
    		for (var elem in objIn) {
    			// check if element exists
    			if (_checkSObject(this[elem])) {
    				// check if value to assign is a boolean or "true"/"false"
	    			if (typeof(objIn[elem]) === 'boolean' || objIn[elem] === "true" || objIn[elem] === "false") {
	    				this[elem]["modifiable"] = objIn[elem];
	    			}
	    			// if value not parsable to a string
	    			else {
	    				errore("setModifiable", WRONGARGS, "wrong input arguments, value is not a boolean");
	    			}
    			}
    			// else signals input error
    			else {
    				errore("setModifiable", WARNING, "sub-object name not valid: '"+ elem + "' doesn't exist.");
    			}
    		}
    	}
    	// if input is wrong
    	else {
    		errore("setModifiable", WRONGARGS, "wrong input arguments, 2 element (name,boolean) or one object (name1: boolean1, name2: boolean2) are accepted");
    	}
    	
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "setModifiable", {enumerable: false});


/**
* Set attribute isInteger of one or more sub-object (they must be _sNumber)
* 
* @param objIn   accept 2 param (1 string + 1 booelan) or 1 object. In first case string is the name, in the second
* object is made by couple "name": value
* @return Item   Returns this item.
* @example myItem.setIsInteger({"numeroMaglia": true, "eta": true});
* @example myItem.setIsInteger("giorni", true);
*/
Item.prototype.setIsInteger = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setIsInteger", NOARGS, "insufficient input arguments, at least 1 is required");
    // if at least 1 argument in input
    } else {
    	// if 2 elements in input
    	if (arguments.length === 2) {
    		// check if sub-element exists
    		var subName = this[arguments[0]];
    		if (subName instanceof _sNumber) {
    			// check if value to assign is a boolean or a string like "true" or "false"
    			if (typeof(arguments[1]) === 'boolean' || arguments[1] === "true" || arguments[1] == "false") {
    				subName["isInteger"] = arguments[1];
    			}
    			// if not signals error
    			else {
    				errore("setIsInteger", WRONGARGS, "wrong input arguments, value is not a boolean");
    			}
    		}
    		// else signals error
    		else {
    			errore("setIsInteger", WRONGARGS, "wrong input arguments, element "+arguments[0]+" doesn't exists");
    		}
    	}
    	// if 1 object in input
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'object') {
    		// iterate over every couple
    		for (var elem in objIn) {
    			// check if element exists
    			if (this[elem] instanceof _sNumber) {
    				// check if value to assign is a boolean or "true"/"false"
	    			if (typeof(objIn[elem]) === 'boolean' || objIn[elem] === "true" || objIn[elem] === "false") {
	    				this[elem]["isInteger"] = objIn[elem];
	    			}
	    			// if value not parsable to a string
	    			else {
	    				errore("setIsInteger", WRONGARGS, "wrong input arguments, value is not a boolean");
	    			}
    			}
    			// else signals input error
    			else {
    				errore("setIsInteger", WARNING, "sub-object name not valid: '"+ elem + "' doesn't exist.");
    			}
    		}
    	}
    	// if input is wrong
    	else {
    		errore("setIsInteger", WRONGARGS, "wrong input arguments, 2 element (name,boolean) or one object (name1: boolean1, name2: boolean2) are accepted");
    	}
    	
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "setIsInteger", {enumerable: false});


/**
* Set attribute min of one or more sub-object (they must be _sNumber)
* 
* @param objIn   accept 2 param (1 string + 1 booelan) or 1 object. In first case string is the name, in the second
* object is made by couple "name": value
* @return Item   Returns this item.
* @example myItem.setMin({"numeroMaglia": 0, "eta": 0});
* @example myItem.setMin("giorni", 7);
*/
Item.prototype.setMin = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setMin", NOARGS, "insufficient input arguments, at least 1 is required");
    // if at least 1 argument in input
    } else {
    	// if 2 elements in input
    	if (arguments.length === 2) {
    		// check if sub-element exists
    		var subName = this[arguments[0]];
    		if (subName instanceof _sNumber) {
    			// check if value to assign is a boolean or a string like "true" or "false"
    			if (typeof(arguments[1]) === 'boolean' || arguments[1] === "true" || arguments[1] == "false") {
    				subName["min"] = arguments[1];
    			}
    			// if not signals error
    			else {
    				errore("setMin", WRONGARGS, "wrong input arguments, value is not a boolean");
    			}
    		}
    		// else signals error
    		else {
    			errore("setMin", WRONGARGS, "wrong input arguments, element "+arguments[0]+" doesn't exists");
    		}
    	}
    	// if 1 object in input
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'object') {
    		// iterate over every couple
    		for (var elem in objIn) {
    			// check if element exists
    			if (this[elem] instanceof _sNumber) {
    				// check if value to assign is a boolean or "true"/"false"
	    			if (typeof(objIn[elem]) === 'boolean' || objIn[elem] === "true" || objIn[elem] === "false") {
	    				this[elem]["min"] = objIn[elem];
	    			}
	    			// if value not parsable to a string
	    			else {
	    				errore("setMin", WRONGARGS, "wrong input arguments, value is not a boolean");
	    			}
    			}
    			// else signals input error
    			else {
    				errore("setMin", WARNING, "sub-object name not valid: '"+ elem + "' doesn't exist.");
    			}
    		}
    	}
    	// if input is wrong
    	else {
    		errore("setMin", WRONGARGS, "wrong input arguments, 2 element (name,boolean) or one object (name1: boolean1, name2: boolean2) are accepted");
    	}
    	
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "setMin", {enumerable: false});


/**
* Set attribute max of one or more sub-object (they must be _sNumber)
* 
* @param objIn   accept 2 param (1 string + 1 booelan) or 1 object. In first case string is the name, in the second
* object is made by couple "name": value
* @return Item   Returns this item.
* @example myItem.setMax({"numeroMaglia": 99, "eta": 199});
* @example myItem.setMax("giorni", 365);
*/
Item.prototype.setMax = function(objIn) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setMax", NOARGS, "insufficient input arguments, at least 1 is required");
    // if at least 1 argument in input
    } else {
    	// if 2 elements in input
    	if (arguments.length === 2) {
    		// check if sub-element exists
    		var subName = this[arguments[0]];
    		if (subName instanceof _sNumber) {
    			// check if value to assign is a boolean or a string like "true" or "false"
    			if (typeof(arguments[1]) === 'boolean' || arguments[1] === "true" || arguments[1] == "false") {
    				subName["max"] = arguments[1];
    			}
    			// if not signals error
    			else {
    				errore("setMax", WRONGARGS, "wrong input arguments, value is not a boolean");
    			}
    		}
    		// else signals error
    		else {
    			errore("setMax", WRONGARGS, "wrong input arguments, element "+arguments[0]+" doesn't exists");
    		}
    	}
    	// if 1 object in input
    	else if (arguments.length === 1 && typeof(arguments[0]) === 'object') {
    		// iterate over every couple
    		for (var elem in objIn) {
    			// check if element exists
    			if (this[elem] instanceof _sNumber) {
    				// check if value to assign is a boolean or "true"/"false"
	    			if (typeof(objIn[elem]) === 'boolean' || objIn[elem] === "true" || objIn[elem] === "false") {
	    				this[elem]["max"] = objIn[elem];
	    			}
	    			// if value not parsable to a string
	    			else {
	    				errore("setMax", WRONGARGS, "wrong input arguments, value is not a boolean");
	    			}
    			}
    			// else signals input error
    			else {
    				errore("setMax", WARNING, "sub-object name not valid: '"+ elem + "' doesn't exist.");
    			}
    		}
    	}
    	// if input is wrong
    	else {
    		errore("setMax", WRONGARGS, "wrong input arguments, 2 element (name,boolean) or one object (name1: boolean1, name2: boolean2) are accepted");
    	}
    	
    }
    
    return this;
}
// Make Item property non enumerable
Object.defineProperty(Item.prototype, "setMax", {enumerable: false});


/**
* Hide update button for the item
* 
* @param hide   boolean to set hidding on/off (default is on)
* @return Item   Returns this item.
* @example myItem.hideUpdate(true);
*/
Item.prototype.hideUpdate = function(hide) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("hideUpdate", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(hide) === 'boolean' || (typeof(hide) === 'string' && (hide === 'true' || hide === 'false') )) {
    		if (typeof(hide) === 'string') {
    			if (hide === 'true') {
    				hide = true;
    			} else if (hide === 'false') {
    				hide = false;
    			}
    		}
    		
    		this.updateHidden = hide;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("hideUpdate", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make setLabel property non enumerable
Object.defineProperty(Item.prototype, "hideUpdate", {enumerable: false});



//*********** sOBJECT **********//

/**
* Creates a new number object, used in Item to store strings.
* 
* @param objIn   accept the following object syntax: new _sNumber({name: string, value: number,
*  label: string, modifiable: boolean, binded: string, max: number, min: number, isInteger: boolean});
*  Name is mandatory.
* @return sNumber   Returns a new sNumber.
*/
function _sNumber(objIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("_sNumber", INTERNAL_NOARGS, "no object to be created");
        return this;
    // if at least 1 argument in input
    } else {
    	// if not a dummy creation
    	if (objIn !== DUMMY) {
	        // check if name is defined
	        if(objIn["name"] === undefined) {
	            errore("_sNumber", INTERNAL_WRONGARGS, "no name in object, it is mandatory");
	            return this;
	        // if at least name is defined
	        } else {
	            this.name = objIn["name"];
	            
	            // define value: the number content
	            if(objIn["value"] !== undefined){
	                this.setValue(objIn["value"]);
	            }
	            
	            // define label: the name to be displayed in HTML. If not present "name" will be used
	            if(objIn["label"] !== undefined){
	                this.setLabel(objIn["label"]);
	            }
	                        
	            // define modifiable: the possibility to modify numbers directly in HTML. Default is true
	            if(objIn["modifiable"] !== undefined){
	                this.setModifiable(objIn["modifiable"]);            
	            } else {
	                this.modifiable = true;
	            }
	            
	            // BINDINGS
	            if(objIn["binding"] !== undefined){
	                this.setBinding(objIn["binding"]);
	            } else {
	                this.binded = false;
	            }
	            
	            // define max: a number that represent maximum value
	            if(objIn["max"] !== undefined){
	                this.setMax(objIn["max"]);
	            }
	            
	            // define min: a number that represent minimum value
	            if(objIn["min"] !== undefined){
	                this.setMin(objIn["min"]);
	            }
	            
	            // define isInteger: decide if number must be integer. Default is false
	            if(objIn["isInteger"] !== undefined){
	                this.setIsInteger(objIn["isInteger"]);
	            } else {
	                this.isInteger = false;
	            }
	            
	            // define invisible
	            if(objIn["invisible"] !== undefined){
	                this.setInvisible(objIn["invisible"]);
	            } else {
	                this.invisible = false;
	            }
	        }
		}
    }
    
    return this;
}


/** 
 * get number stored in value property or binded value (eventually execute binding defined function)
 * 
 * @return number     Returns the stored/binded value
 * @example myItem.myNumber.get();
 */
_sNumber.prototype.get = function() {
	// get the value if no binding defined
	if (this.binded !== true && (this.bindedSocket === undefined ||  this.bindedSocket === false)) {
		if (this.value == undefined) {
			return ""   // needed due to binding method
		}
		else {
			return this.value;
		}
	// return proper value if binded
	} else {
		if ((this.bindedSocket === undefined ||  this.bindedSocket === false)) {
			// if binding is a function, compute value and return
			if (typeof(this.binding) === 'function') {
				// check if value must be integer
				if (this.isInteger) {
					return parseInt(this.binding());
				}
				else {
					return this.binding();
				}
			// else return binded value
			} else {
				if (this.isInteger) {
					return parseInt(this.binding().get());
				}
				else {
					return this.binding.get();
				}
			}
		}
		// if binded to socket
		else if (this.bindedSocket !== undefined && this.bindedSocket === true) {
			return parseFloat(_extractSocketContent(this));
		}
	}
}
// Make get property non enumerable
Object.defineProperty(_sNumber.prototype, "get", {enumerable: false});



/** 
 * return father item if at runtime, else returns false 
 * 
 * @return item     Returns father item
 * @example myItem.myNumber.getFather();
 */
_sNumber.prototype.getFather = function() {
	// check if father is defined
	if (this.fatherName) {
		var tmpItem = _extractItem(this.fatherName);
		
		// return father item or signals error
		if (tmpItem) {
			return tmpItem;
		} else {
			errore("getFather", CRITICALERROR, "Unexpected error: father can't be found");
		}
	}
	// signals wrong call if father name is undefined
	else {
		errore("getFather", CALLTIME, "father is defined only after document is loaded");
		return;
	}
}
// Make get property non enumerable
Object.defineProperty(_sNumber.prototype, "getFather", {enumerable: false});


/** 
 * Set value (number)
 * 
 * @param value accpets only number, and they must be lower than acutal max and higher than actual min
 * @param toInt is a boolean value set to true if number must be integer
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.setValue(25);
 */
_sNumber.prototype.setValue = function(value) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setValue", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // if item not already binded
        if (this.binded !== true) {
            // if value is a number
            if (typeof(value) === 'number' || !isNaN(parseFloat(value))) {
                // check if value should be converted and warning
                if (typeof(value) !== 'number') {
                    errore("setValue", WARNING, "input should be a number. It will be converted to number");
                    value = parseFloat(value);
                }
                // if min is defined, value must be greater or equal
                if (this.min != undefined && this.min !="") {
                    if (this.min > value) {
                        errore("setValue", WRONGARGS, "wrong input argument, input number must be lower than actual min");
                        return this;
                    }
                }
                // if max is defined, value must be lesser or equal
                if (this.max != undefined && this.max !="") {
                    if (this.max < value) {
                        errore("setValue", WRONGARGS, "wrong input argument, input number must be higher than actual max");
                        return this;
                    }
                }
                
                // check if it must be an integer
                if (this.isInteger === true) {
                    this.value = parseInt(value);
                } else {
                    this.value = value;
                }
            // signals wrong input type
            } else {
                errore("setValue", WRONGARGS, "wrong input argument, input must be a number");
                return this;
            }
        // if item is binded
        } else {
            errore("setValue", WRONGARGS, "variable is binded, assignement is impossible");
            return this;
        }
    }
    
    return this;
}
// Make setValue property non enumerable
Object.defineProperty(_sNumber.prototype, "setValue", {enumerable: false});


/** 
 * Set a label to display as HTML label in place of variable name
 * 
 * @param label    a string that indicates variable's content (just 1-2 words not more)
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.setLabel("id Number");
 */
_sNumber.prototype.setLabel = function(label) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setLabel", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // if input is a string
        if (typeof(label) === 'string' && label != "false") {
            this.label = label;
        }
        // if input is false
        else if (typeof(label) === 'boolean' || (typeof(label) === 'string' && label == "false")) {
            this.label = false;
        }
        // signals a warning for for boolean and numbers
        else if (typeof(label) === 'number' || typeof(label) === 'boolean') {
            errore("setLabel", WARNING, "input should be a string or boolean 'false', not a number");
            this.label = label.toString();
        }
        // error if another type (object)
        else {
            errore("setLabel", WRONGARGS, "wrong input argument, it should be a string");
            return this;
        }
    }

    return this;
}
// Make setLabel property non enumerable
Object.defineProperty(_sNumber.prototype, "setLabel", {enumerable: false});


/** 
 * Decide if data is modifiable directly from HTML interface.
 * 
 * @param modif    boolean indicating if value is modifiable
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.setModifiable(true);
 */
_sNumber.prototype.setModifiable = function(modif) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setModifiable", NOARGS, "insufficient input arguments, a boolean is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // check if variable is not binded
        if (this.binded !== true) {
            // check if type is boolean
            if (typeof(modif) === 'boolean' || modif == "true" || modif == "false") {
                if (typeof(modif) === 'string'){
                    if (modif === "true") {
                        modif = true;
                    } else {
                        modif = false;
                    }
                }
                
                this.modifiable = modif;
            // if another type signals error
            } else {
                errore("setModifiable", WRONGARGS, "wrong argument, only true or false are accepted");
                return this;
            }
        // if variable is binded signals error
        } else {
            errore("setModifiable", WRONGARGS, "item is binded, modifiability can't be changed");
            return this;
        }
        
    }

    return this;
}
// Make setModifiable property non enumerable
Object.defineProperty(_sNumber.prototype, "setModifiable", {enumerable: false});


/** 
 * Set data binding to destination
 * 
 * @param binding    string defining a binding to another _nNumber or a pure number or an object
 * defining a complex binding.
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.binding("anotherItem.anotherNumber");
 */
_sNumber.prototype.setBinding = function(binding) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setBinding", NOARGS, "insufficient input arguments, at least one binding is required");
        return this;
    // if at least 1 argument in input
    } else {
        // if input is boolean or number signals error
        if (typeof(binding) === 'boolean' || typeof(binding) === 'number') {
            errore("setBinding", WRONGARGS, "wrong argument, number or boolean could not be accepted as binding");  
            return this; 
        // if string
        } else if (typeof(binding) === 'string') {
            // check if binded object is valid: number or _sNumber are accepted
            // extract the 2 parts of binding
            var pointPos = binding.search(REGPOINT);
            if (pointPos != -1) {
                var first = binding.substring(0, pointPos)
                var second = binding.substring(pointPos+1, binding.length);
           		
           		var thisItem = _extractItem(first);
            	// check if item exists
            	if (thisItem) {
            		if (thisItem[second] instanceof _sNumber) {
	                    // set binded and binding
	                    this.binded = true;
	                    this.binding = thisItem[second];
	                    this.modifiable = false;
	                    this.value = "";
	                    
	                    // save binding path
	                    this.bindingPath = [binding];
	                // signals error if binded data is not valid type
	                } else {
	                    errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sNumber");  
	                    return this;
	                }
            		
            	} else {
            		errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sNumber");  
                return this;
            	}  
            // signals error if binded data is not valid type
            } else  {
                errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sNumber");  
                return this;
            }
        // if function
        } else if (typeof(binding) === 'function') {
        	// check if input function gives a number
    		this.binded = true;
    		this.modifiable = false;
            this.value = "";
            this.binding = binding;          
			
			// find possible sObject referenced
			var retBindingPath = _extractBinding(binding.toString());
			
			// add each possible sObject to bindingPath
			this.bindingPath = new Array();	
			for (var sngBind in retBindingPath) {
				this.bindingPath.push(retBindingPath[sngBind]);
			}
        // if object or array
        } else {
            // if array signals error
            if (binding.length) {
                errore("setBinding", WRONGARGS, "wrong argument, array aren't supported, use object or string");  
                return this; 
            // if object, start complex binding
            } else {
                errore("setBinding", WRONGARGS, "object complex bindings not yet implemented");
            }
        }
        
    }

    return this;
}
// Make setModifiable property non enumerable
Object.defineProperty(_sNumber.prototype, "setBinding", {enumerable: false});


/** 
 * Set data binding to an ItemSocket
 * 
 * @param binding    string defining a binding to an ItemSocket
 * @param subpart    (optional) name of target object if a JSON element is expected from ItemSocket
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.attachSocket("myItemSocket");
 * @example myItem.myNumber.attachSocket("myItemSocket", "subOject.myTargetObject");
 */
_sNumber.prototype.attachSocket = function(binding, subpart) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("attachSocket", NOARGS, "insufficient input arguments, at least one binding is required");
        return this;
    // if at least 1 argument in input
    } else {
    	// if argument a single string
    	if (arguments.length === 1 && typeof(binding) === 'string') {
    		// check if binded object is a valid ItemSocket
    		var thisItemSocket = _extractItemSocket(binding);
    		
    		// if valid item socket
     		if (thisItemSocket) {
     			this.bindingPathSocket = binding;
     			this.bindedSocket = true;
     			this.modifiable = false;
     		}
     		// signals invalid item socket
     		else {
     			errore("attachSocket", WRONGARGS, "wrong argument, '"+binding+"' is not a valid ItemSocket");
     		}
    	}
    	// if arguments are 2 strings
        else if (arguments.length === 2 && typeof(binding) === 'string' && typeof(subpart) === 'string') {
        	// check if binded object is a valid ItemSocket
    		var thisItemSocket = _extractItemSocket(binding);
    		
    		// if valid item socket
     		if (thisItemSocket) {
     			this.bindedSocket = true;
     			this.bindingPathSocket = [binding, subpart];
     			this.modifiable = false;
     		}
     		// signals invalid item socket
     		else {
     			errore("attachSocket", WRONGARGS, "wrong argument, '"+binding+"' is not a valid ItemSocket");
     		}
        // if not string
        } else {
			errore("attachSocket", WRONGARGS, "wrong argument, onl strings are supported");  
        }
    }

    return this;
}
// Make setModifiable property non enumerable
Object.defineProperty(_sNumber.prototype, "attachSocket", {enumerable: false});


/** 
 * Set number's minimum value
 * 
 * @param numMin   accepts only number, and it must be lower than acutal value and acutal maximum value
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.setMin(1);
 */
_sNumber.prototype.setMin = function(numMin) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setMin", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // check if input is a number
        if (typeof(numMin) === 'number' || !isNaN(parseFloat(numMin))) {
            // check if numMin should be converted ad warning
            if (typeof(numMin) !== 'number') {
                errore("setMin", WARNING, "input should be a number. It will be converted to number");
                numMin = parseFloat(numMin);
            }
            // if max is defined, numMin must be lower or equal
            if (this.max != undefined && this.max !="") {
                if (this.max < numMin) {
                    errore("setMin", WRONGARGS, "wrong input argument, it must be lower or equal than actual maximum value");
                    return this;
                }
            }
            // if value is defined, numMin must be lower or equal
            if (this.value != undefined && this.value !="") {
                if (this.value < numMin) {
                    errore("setMin", WRONGARGS, "wrong input argument, it must be lower or equal than actual value");
                    return this;
                }
            }
            this.min = numMin;
        // signals wrong input type
        } else {
            errore("setMin", WRONGARGS, "wrong input argument, it must be a number");
            return this;
        }
    }
    
    return this;
}
// Make setMin property non enumerable
Object.defineProperty(_sNumber.prototype, "setMin", {enumerable: false});



/** 
 * Set number's maximum value
 * 
 * @param numMax   accepts only number, and it must be higher than acutal value and acutal minimum value
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.setMax(55);
 */
_sNumber.prototype.setMax = function(numMax) {
    // check if any arguments has been passed
	if (arguments.length < 1) {
	    errore("setMax", NOARGS, "insufficient input arguments, a number is needed");
        return this;
	// if at least 1 argument in input
	} else {
	    // check if input is a number
        if (typeof(numMax) === 'number' || !isNaN(parseFloat(numMax))) {
            // check if numMax should be converted ad warning
            if (typeof(numMax) !== 'number') {
                errore("setMax", WARNING, "input should be a number. It will be converted to number");
                numMax = parseFloat(numMax);
            }
            // if min is defined, max must be greater or equal
            if (this.min != undefined && this.min !="") {
                if (this.min > numMax) {
                    errore("setMax", WRONGARGS, "wrong input argument, it must be higher or equal than actual minimum value");
                    return this;
                }
            }
            // if value is defined, max must be grater or equal
            if (this.value != undefined && this.value !="") {
                if (this.value > numMax) {
                    errore("setMax", WRONGARGS, "wrong input argument, it must be higher or equal than actual value");
                    return this;
                }
            }
            this.max = numMax;
        // signals wrong input type
        } else {
            errore("setMax", WRONGARGS, "wrong input argument, it must be a number");
            return this;
        }
    }
    
    return this;
}
// Make setMax property non enumerable
Object.defineProperty(_sNumber.prototype, "setMax", {enumerable: false});


/** 
 * Decide if number must be an integer.
 * 
 * @param isInteger    boolean indicating if value is integer
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.setIsInteger(true);
 */
_sNumber.prototype.setIsInteger = function(isInteger) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setIsInteger", NOARGS, "insufficient input arguments, a boolean is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // check if type is boolean
        if (typeof(isInteger) === 'boolean' || isInteger == "true" || isInteger == "false") {
            if (typeof(isInteger) === 'string'){
                if (isInteger === "true") {
                    isInteger = true;
                } else {
                    isInteger = false;
                }
            }
            
            // if value is already defined, make it integer
            if (this.value !== 'undefined' || this.value != "") {
                this.value = parseInt(this.value);
            }
            
            this.isInteger = isInteger;
        // if another type signals error
        } else {
            errore("setIsInteger", WRONGARGS, "wrong argument, only true or false are accepted");
            return this;
        }
        
    }

    return this;
}
// Make setIsInteger property non enumerable
Object.defineProperty(_sNumber.prototype, "setIsInteger", {enumerable: false});


/** 
 * Decide if number must be excluded from visualization
 * 
 * @param invisible    boolean indicating if must be invisible
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.setInvisible(true);
 */
_sNumber.prototype.setInvisible = function(invisible) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setInvisible", NOARGS, "insufficient input arguments, a boolean is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // check if type is boolean
        if (typeof(invisible) === 'boolean' || invisible == "true" || invisible == "false") {
            if (typeof(invisible) === 'string'){
                if (invisible === "true") {
                    invisible = true;
                } else {
                    invisible = false;
                }
            }
            
            this.invisible = invisible;
        // if another type signals error
        } else {
            errore("setInvisible", WRONGARGS, "wrong argument, only true or false are accepted");
            return this;
        }
        
    }

    return this;
}
// Make setIsInteger property non enumerable
Object.defineProperty(_sNumber.prototype, "setInvisible", {enumerable: false});


/** 
 * Set class of corresponding HTML element to style them with css
 * 
 * @param objIn    one or more string that represent a class name
 * @return _sNumber     Returns this _sNumber
 * @example myItem.myNumber.setClass("red");
 */
_sNumber.prototype.setClass = function(objIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setClass", NOARGS, "insufficient input arguments, a boolean is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	var elemClass = "";
    	// iterate for each input string
    	for (var elem in arguments) {
    		var thisStringIn = arguments[elem];
    		
    		// check if string and eventually add to class string
    		if (typeof(thisStringIn) === 'string') {
    			elemClass += " "+thisStringIn;
    		} else {
    			errore("setClass", WARNING, thisStringIn+" is not a string and couldn't be used as an HTML class value");
    		}
    	}
    	
    	// set attribute classAttribute
    	this.classAttribute = elemClass;
    }

    return this;
}
// Make setIsInteger property non enumerable
Object.defineProperty(_sNumber.prototype, "setClass", {enumerable: false});



/**
* Creates a new string object, used in Item to store strings.
* 
* @param objIn   accept the following combination object syntax: new sString({name: string,
* value: string, modifiable: boolean, binded: string, label: string}); Name is mandatory.
* @return _sString   Returns a new _sString.
*/
function _sString(objIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("_sString", INTERNAL_NOARGS, "no object to be created");
        return this;
    // if at least 1 argument in input
    } else {
    	// if not a dummy creation
    	if (objIn !== DUMMY) {
	        // check if name is defined
	        if(objIn["name"] === undefined) {
	            errore("_sString", INTERNAL_WRONGARGS, "no name in object, it is mandatory");
	            return this;
	        // if at least name is defined
	        } else {
	            this.name = objIn["name"];
	            
	            // define value: the string content
	            if(objIn["value"] !== undefined){
	                this.setValue(objIn["value"]);
	            }
	            
	            // define label: the name to be displayed in HTML. If not present "name" will be used
	            if(objIn["label"] !== undefined){
	                this.setLabel(objIn["label"]);
	            }
	                        
	            // define modifiable: the possibility to modify numbers directly in HTML. Default is ture
	            if(objIn["modifiable"] !== undefined){
	                this.setModifiable(objIn["modifiable"]);            
	            } else {
	                this.modifiable = true;
	            }
	            
	            // BINDINGS
	            if(objIn["binding"] !== undefined){
	                this.setBinding(objIn["binding"]);
	            } else {
	                this.binded = false;
	            }
	            
	            // define invisible
	            if(objIn["invisible"] !== undefined){
	                this.setInvisible(objIn["invisible"]);
	            } else {
	                this.invisible = false;
	            }      
	        }
		}
    }
    	
	return this;
}


/** 
 * get string stored in value property or binded value (eventually execute binding defined function)
 * 
 * @return string     Returns the stored/binded value
 * @example myItem.myStringr.get();
 */
_sString.prototype.get = function() {
	// get the value if no binding defined
	if (this.binded !== true && (this.bindedSocket === undefined ||  this.bindedSocket === false)) {
		if (this.value == undefined) {
			return ""   // needed due to binding method
		}
		else {
			return this.value;
		}
	// return proper value if binded
	} else {
		if ((this.bindedSocket === undefined ||  this.bindedSocket === false)) {
			// if binding is a function, compute value and return
			if (typeof(this.binding) === 'function') {
				return this.binding();
			// else return binded value
			} else {
				return this.binding.get();
			}
		}
		// if binded to socket
		else if (this.bindedSocket !== undefined && this.bindedSocket === true) {
			return _extractSocketContent(this);
		}
	}
}
// Make get property non enumerable
Object.defineProperty(_sString.prototype, "get", {enumerable: false});


/** 
 * return father item if at runtime, else returns false 
 * 
 * @return item     Returns father item
 * @example myItem.myString.getFather();
 */
_sString.prototype.getFather = _sNumber.prototype.getFather;
// Make setModifiable property non enumerable
Object.defineProperty(_sString.prototype, "getFather", {enumerable: false});


/** 
 * Set value (string)
 * 
 * @param value    content of string variable
 * @return _sString     Returns this _sString
 * @example myItem.myString.setValue("Mario");
 */
_sString.prototype.setValue = function(value) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setValue", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// if item not already binded
        if (this.binded !== true) {
	        // if value is a number signals warning
	        if (typeof(value) === 'number' || typeof(value) === 'boolean') {
	            errore("setValue", WARNING, "input number is a number or a boolean, it should be a string");
	            this.value = value.toString();
	        // if value is a string assign it
	        } else if  (typeof(value) === 'string') {
	            this.value = value;
	        // if object signals error
	        } else {
	            errore("setValue", WRONGARGS, "input number is an object or array, assignment is impossible");
	            return this;
	        }
        }
        // if item is binded
        else {
            errore("setValue", WRONGARGS, "variable is binded, assignement is impossible");
            return this;
        }
    }
    
    return this;
}
// Make setValue property non enumerable
Object.defineProperty(_sString.prototype, "setValue", {enumerable: false});


/** 
 * Set a label to display as HTML label in place of variable name
 * 
 * @param label    a string that indicates variable's content (just 1-2 words not more)
 * @return _sString     Returns this _sString
 * @example myItem.myString.setLabel("Family Name");
 */
_sString.prototype.setLabel = _sNumber.prototype.setLabel;
// Make setLabel property non enumerable
Object.defineProperty(_sString.prototype, "setLabel", {enumerable: false});


/** 
 * Decide if string is modifiable directly from HTML interface.
 * 
 * @param modif    boolean indicating if value is modifiable
 * @return _sString     Returns this _sString
 * @example myItem.myString.setModifiable(true);
 */
_sString.prototype.setModifiable = _sNumber.prototype.setModifiable;
// Make setModifiable property non enumerable
Object.defineProperty(_sString.prototype, "setModifiable", {enumerable: false});


/** 
 * Set data binding to destination
 * 
 * @param binding    string defining a binding to another _sString
 * @return _sString     Returns this _sString
 * @example myItem.myString.binding("anotherItem.anotherString");
 */
_sString.prototype.setBinding = function(binding) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setBinding", NOARGS, "insufficient input arguments, at least one binding is required");
        return this;
    // if at least 1 argument in input
    } else {
        // if input is boolean or number signals error
        if (typeof(binding) === 'boolean' || typeof(binding) === 'number') {
            errore("setBinding", WRONGARGS, "wrong argument, number or boolean could not be accepted as binding");  
            return this; 
        // if string
        } else if (typeof(binding) === 'string') {
            // check if binded object is valid: _sString are accepted
            var pointPos = binding.search(REGPOINT);
            if (pointPos != -1) {
                var first = binding.substring(0, pointPos)
                var second = binding.substring(pointPos+1, binding.length);
                
                var thisItem = _extractItem(first);
                if (thisItem){    
                    if (thisItem[second] instanceof _sString) {
                        // set binded and binding
                        this.binded = true;
                        this.binding = thisItem[second];
                        this.modifiable = false;
                        this.value = "";
                        
                        // save binding path
                        this.bindingPath = [binding];
                    // signals error if binded data is not valid type
                    } else {
                        errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sString");  
                        return this;
                    }
                } else {
                	errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a valid binding");  
                	return this;
            	}
            // signals error if binded data is not valid type
            } else  {
                errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a valid _sString");  
                return this;
            } 
          
        // if function
        } else if (typeof(binding) === 'function') {
    		this.binded = true;
    		this.modifiable = false;
            this.value = "";
            this.binding = binding;
            
            // find possible sObject referenced
			var retBindingPath = _extractBinding(binding.toString());
			
			// add each possible sObject to bindingPath
			this.bindingPath = new Array();	
			for (var sngBind in retBindingPath) {
				this.bindingPath.push(retBindingPath[sngBind]);
			}
        // if object or array
        } else {
            // if array signals error
            if (binding.length) {
                errore("setBinding", WRONGARGS, "wrong argument, array aren't supported, use object or string");  
                return this; 
            // if object, start complex binding
            } else {
                errore("setBinding", WRONGARGS, "object complex bindings not yet implemented");
            }
        }
        
    }

    return this;
}
// Make setModifiable property non enumerable
Object.defineProperty(_sString.prototype, "setBinding", {enumerable: false});


/** 
 * Set data binding to an ItemSocket
 * 
 * @param binding    string defining a binding to an ItemSocket
 * @param subpart    (optional) name of target object if a JSON element is expected from ItemSocket
 * @return _sString     Returns this _sString
 * @example myItem.myString.attachSocket("myItemSocket");
 * @example myItem.myString.attachSocket("myItemSocket", "subOject.myTargetObject");
 */
_sString.prototype.attachSocket = _sNumber.prototype.attachSocket;
// Make setModifiable property non enumerable
Object.defineProperty(_sString.prototype, "attachSocket", {enumerable: false});


/** 
 * Decide if string must be excluded from visualization
 * 
 * @param invisible    boolean indicating if must be invisible
 * @return _sString     Returns this _sString
 * @example myItem.myString.setInvisible(true);
 */
_sString.prototype.setInvisible = _sNumber.prototype.setInvisible;
// Make setLabel property non enumerable
Object.defineProperty(_sString.prototype, "setInvisible", {enumerable: false});


/** 
 * Set class of corresponding HTML element to style them with css
 * 
 * @param objIn    one or more string that represent a class name
 * @return _sString     Returns this _sString
 * @example myItem.myString.setClass("red");
 */
_sString.prototype.setClass = _sNumber.prototype.setClass;
// Make setLabel property non enumerable
Object.defineProperty(_sString.prototype, "setClass", {enumerable: false});



/**
* Creates a new boolean object, used in Item to store boolean.
* 
* @param objIn   accept the following combination object syntax: new _sBoolean({name: string,
* value: boolean, modifiable: boolean, binded: string, label: string}); Name is mandatory.
* @return _sBoolean   Returns a new _sBoolean.
*/
function _sBoolean(objIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("_sBoolean", INTERNAL_NOARGS, "no object to be created");
        return this;
    // if at least 1 argument in input
    } else {
    	// if not a dummy creation
    	if (objIn !== DUMMY) {
	        // check if name is defined
	        if(objIn["name"] === undefined) {
	            errore("_sBoolean", INTERNAL_WRONGARGS, "no name in object, it is mandatory");
	            return this;
	        // if at least name is defined
	        } else {
	            this.name = objIn["name"];
	            
	            // define value: the boolean content
	            if(objIn["value"] !== undefined){
	                this.setValue(objIn["value"]);
	            }
	            
	            // define label: the name to be displayed in HTML. If not present "name" will be used
	            if(objIn["label"] !== undefined){
	                this.setLabel(objIn["label"]);
	            }
	                        
	            // define modifiable: the possibility to modify numbers directly in HTML. Default is ture
	            if(objIn["modifiable"] !== undefined){
	                this.setModifiable(objIn["modifiable"]);            
	            } else {
	                this.modifiable = true;
	            }
	            
	            // BINDINGS
	            if(objIn["binding"] !== undefined){
	                this.setBinding(objIn["binding"]);
	            } else {
	                this.binded = false;
	            }
	            
	            // define invisible
	            if(objIn["invisible"] !== undefined){
	                this.setInvisible(objIn["invisible"]);
	            } else {
	                this.invisible = false;
	            }       
	        }
        }
    }
    	
	return this;
}


/** 
 * get boolean stored in value property or binded value (eventually execute binding defined function)
 * 
 * @return boolean     Returns the stored/binded value
 * @example myItem.myBoolean.get();
 */
_sBoolean.prototype.get = _sString.prototype.get;
// Make get property non enumerable
Object.defineProperty(_sBoolean.prototype, "get", {enumerable: false});


/** 
 * return father item if at runtime, else returns false 
 * 
 * @return item     Returns father item
 * @example myItem.myBoolean.getFather();
 */
_sBoolean.prototype.getFather = _sNumber.prototype.getFather;
// Make setModifiable property non enumerable
Object.defineProperty(_sBoolean.prototype, "getFather", {enumerable: false});


/** 
 * Set value (boolean)
 * 
 * @param value accpets only boolean
 * @return _sBoolean     Returns this _sBoolean
 * @example myItem.myBoolean.setValue(true);
 */
_sBoolean.prototype.setValue = function(value) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setValue", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // if item not already binded
        if (this.binded !== true) {
            // if value is a boolean
            if (typeof(value) === 'boolean' || value == "true" || value == "false") {
                // check if value should be converted and warning
                if (typeof(value) === 'string') {
                	if (value == "true") {
                		value = true;
                	} else {
                		value = false;
                	}
                }
                
                this.value = value;
            // signals wrong input type
            } else {
                errore("setValue", WRONGARGS, "wrong input argument, input must be a boolean");
                return this;
            }
        // if item is binded
        } else {
            errore("setValue", WRONGARGS, "variable is binded, assignement is impossible");
            return this;
        }
    }
    
    return this;
}
// Make setValue property non enumerable
Object.defineProperty(_sBoolean.prototype, "setValue", {enumerable: false});


/** 
 * Set a label to display as HTML label in place of variable name
 * 
 * @param label    a string that indicates variable's content (just 1-2 words not more)
 * @return _sBoolean     Returns this _sBoolean
 * @example myItem.myBoolean.setLabel("Is discounted");
 */
_sBoolean.prototype.setLabel = _sNumber.prototype.setLabel;
// Make setLabel property non enumerable
Object.defineProperty(_sBoolean.prototype, "setLabel", {enumerable: false});


/** 
 * Decide if data is modifiable directly from HTML interface.
 * 
 * @param modif    boolean indicating if value is modifiable
 * @return _sBoolean     Returns this _sBoolean
 * @example myItem.myBoolean.setModifiable(true);
 */
_sBoolean.prototype.setModifiable = _sNumber.prototype.setModifiable;
// Make setModifiable property non enumerable
Object.defineProperty(_sBoolean.prototype, "setModifiable", {enumerable: false});


/** 
 * Set data binding to destination or to a custom function
 * 
 * @param binding    string defining a binding to another _sBoolean or a function
 * defining a complex binding.
 * @return _sBoolean     Returns this _sBoolean
 * @example myItem.myBoolean.binding("anotherItem.anotherBoolean");
 */
_sBoolean.prototype.setBinding = function(binding) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setBinding", NOARGS, "insufficient input arguments, at least one is required");
        return this;
    // if at least 1 argument in input
    } else {
        // if input is boolean or number signals error
        if (typeof(binding) === 'boolean' || typeof(binding) === 'number') {
            errore("setBinding", WRONGARGS, "wrong argument, number or boolean could not be accepted as binding");  
            return this; 
        // if string
        } else if (typeof(binding) === 'string') {
            // check if binded object is valid: _sBoolean are accepted
            var pointPos = binding.search(REGPOINT);
            if (pointPos != -1) {
                var first = binding.substring(0, pointPos)
                var second = binding.substring(pointPos+1, binding.length);
                
                var thisItem = _extractItem(first);
                if (thisItem) {
	                if (thisItem[second] instanceof _sBoolean) {
	                    // set binded and binding
	                    this.binded = true;
	                    this.binding = thisItem[second];
	                    this.modifiable = false;
	                    this.value = "";
	                    
	                    // save binding path
	                    this.bindingPath = [binding];
	                // signals error if binded data is not valid type
	                } else {
	                    errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sBoolean");  
	                    return this;
	                }
                } else {
                	errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sBoolean");  
	                return this;
                }
            // signals error if binded data is not valid type
            } else  {
                errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a valid _sBoolean");  
                return this;
            } 
        // if function
        } else if (typeof(binding) === 'function') {
    		this.binded = true;
    		this.modifiable = false;
            this.value = "";
            this.binding = binding;
            

			// find possible sObject referenced
			var retBindingPath = _extractBinding(binding.toString());
			
			// add each possible sObject to bindingPath
			this.bindingPath = new Array();	
			for (var sngBind in retBindingPath) {
				this.bindingPath.push(retBindingPath[sngBind]);
			}
        // if object or array
        } else {
            // if array signals error
            if (binding.length) {
                errore("setBinding", WRONGARGS, "wrong argument, array aren't supported, use object or string");  
                return this; 
            // if object, start complex binding
            } else {
                errore("setBinding", WRONGARGS, "object complex bindings not yet implemented");
            }
        }
        
    }

    return this;
}
// Make setModifiable property non enumerable
Object.defineProperty(_sBoolean.prototype, "setBinding", {enumerable: false});


/** 
 * Set data binding to an ItemSocket
 * 
 * @param binding    string defining a binding to an ItemSocket
 * @param subpart    (optional) name of target object if a JSON element is expected from ItemSocket
 * @return _sBoolean     Returns this _sBoolean
 * @example myItem.myBoolean.attachSocket("myItemSocket");
 * @example myItem.myBoolean.attachSocket("myItemSocket", "subOject.myTargetObject");
 */
_sBoolean.prototype.attachSocket = _sNumber.prototype.attachSocket;
// Make setModifiable property non enumerable
Object.defineProperty(_sBoolean.prototype, "attachSocket", {enumerable: false});


/** 
 * Decide if boolean must be excluded from visualization
 * 
 * @param invisible    boolean indicating if must be invisible
 * @return _sBoolean     Returns this _sBoolean
 * @example myItem.myBoolean.setInvisible(true);
 */
_sBoolean.prototype.setInvisible = _sNumber.prototype.setInvisible;
// Make setLabel property non enumerable
Object.defineProperty(_sBoolean.prototype, "setInvisible", {enumerable: false});


/** 
 * Set class of corresponding HTML element to style them with css
 * 
 * @param objIn    one or more string that represent a class name
 * @return _sBoolean     Returns this _sBoolean
 * @example myItem.myBoolean.setClass("red");
 */
_sBoolean.prototype.setClass = _sNumber.prototype.setClass;
// Make setLabel property non enumerable
Object.defineProperty(_sBoolean.prototype, "setClass", {enumerable: false});



/**
* Creates a new date object, used in Item to store dates.
* 
* @param objIn   accept the following combination object syntax: new _sBoolean({name: string,
* value: boolean, modifiable: boolean, binded: string, label: string}); Name is mandatory.
* @return _sBoolean   Returns a new _sBoolean.
*/
function _sDate(objIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("_sDate", INTERNAL_NOARGS, "no object to be created");
        return this;
    // if at least 1 argument in input
    } else {
    	// if not a dummy creation
    	if (objIn !== DUMMY) {
	        // check if name is defined
	        if(objIn["name"] === undefined) {
	            errore("_sDate", INTERNAL_WRONGARGS, "no name in object, it is mandatory");
	            return this;
	        // if at least name is defined
	        } else {
	            this.name = objIn["name"];
	            
	            // define value: the boolean content
	            if(objIn["value"] !== undefined){
	                this.setValue(objIn["value"]);
	            }
	            
	            // define label: the name to be displayed in HTML. If not present "name" will be used
	            if(objIn["label"] !== undefined){
	                this.setLabel(objIn["label"]);
	            }
	                        
	            // define modifiable: the possibility to modify numbers directly in HTML. Default is ture
	            if(objIn["modifiable"] !== undefined){
	                this.setModifiable(objIn["modifiable"]);            
	            } else {
	                this.modifiable = true;
	            }
	            
	            // binding
	            if(objIn["binding"] !== undefined){
	                this.setBinding(objIn["binding"]);
	            } else {
	                this.binded = false;
	            }
	            
	            // define invisible
	            if(objIn["invisible"] !== undefined){
	                this.setInvisible(objIn["invisible"]);
	            } else {
	                this.invisible = false;
	            }
	        }
        }
    }
    	
	return this;
}


/** 
 * get date stored in value property or binded value (eventually execute binding defined function)
 * 
 * @return date     Returns the stored/binded value
 * @example myItem.myDate.get();
 */
_sDate.prototype.get = _sString.prototype.get;
// Make get property non enumerable
Object.defineProperty(_sDate.prototype, "get", {enumerable: false});


/** 
 * return father item if at runtime, else returns false 
 * 
 * @return item     Returns father item
 * @example myItem.myDate.getFather();
 */
_sDate.prototype.getFather = _sNumber.prototype.getFather;
// Make setModifiable property non enumerable
Object.defineProperty(_sDate.prototype, "getFather", {enumerable: false});


/** 
 * Set date value. 
 * 
 * @param value   Only date in the format yyyy-mm-dd or gg-mm-aaaa are accepted (- or / to separate values)
 * @return _sDate     Returns this _sDate
 * @example myItem._sDate.setValue("2012-06-20");
 */
_sDate.prototype.setValue = function(value) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setValue", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // if item not already binded
        if (this.binded !== true) {
            // check if value is a string
            if (typeof(value) === 'string') {
                // check if value is a valid date
                if (typeof(value) === 'string') {
                	var date = _extractDate(value);
                	
                	if (date != false) {
                		this.value = date;
                	} else {
                		// valid date strings are yyyy/mm/dd or yyyy-mm-dd or gg/mm/aaaa or gg-mm-aaaa
                		errore("setValue", WRONGARGS, "wrong input argument, input must be a string representing a valid date");
                	}
                }
            // signals wrong input type
            } else {
                errore("setValue", WRONGARGS, "wrong input argument, input must be a string representing a valid date");
                return this;
            }
        // if item is binded
        } else {
            errore("setValue", WRONGARGS, "variable is binded, assignement is impossible");
            return this;
        }
    }
    
    return this;
}
// Make setValue property non enumerable
Object.defineProperty(_sDate.prototype, "setValue", {enumerable: false});


/** 
 * Set a label to display as HTML label in place of variable name
 * 
 * @param label    a string that indicates variable's content (just 1-3 words)
 * @return _sDate     Returns this _sDate
 * @example myItem._sDate.setLabel("Birthday");
 */
_sDate.prototype.setLabel = _sNumber.prototype.setLabel;
// Make setLabel property non enumerable
Object.defineProperty(_sDate.prototype, "setLabel", {enumerable: false});


/** 
 * Decide if data is modifiable directly from HTML interface.
 * 
 * @param modif    boolean indicating if value is modifiable
 * @return _sDate     Returns this _sDate
 * @example myItem._sDate.setModifiable(true);
 */
_sDate.prototype.setModifiable = _sNumber.prototype.setModifiable;
// Make setModifiable property non enumerable
Object.defineProperty(_sDate.prototype, "setModifiable", {enumerable: false});



/** 
 * Set data binding to destination
 * 
 * @param binding    string defining a binding to another _sDate or to a user-defined function
 * defining a complex binding.
 * @return _sDate     Returns this _sDate
 * @example myItem.myDate.binding("anotherItem.anotherDate");
 */
_sDate.prototype.setBinding = function(binding) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setBinding", NOARGS, "insufficient input arguments, at least one binding is required");
        return this;
    // if at least 1 argument in input
    } else {
        // if input is boolean or number signals error
        if (typeof(binding) === 'boolean' || typeof(binding) === 'number') {
            errore("setBinding", WRONGARGS, "wrong argument, number or boolean could not be accepted as binding");  
            return this; 
        // if string
        } else if (typeof(binding) === 'string') {
            // check if binded object is a valid date
            // extract the 2 parts of binding
            var pointPos = binding.search(REGPOINT);
            if (pointPos != -1) {
                var first = binding.substring(0, pointPos)
                var second = binding.substring(pointPos+1, binding.length);
           		
           		var thisItem = _extractItem(first);
            	// check if item exists
            	if (thisItem) {
            		if (thisItem[second] instanceof _sDate) {
	                    // set binded and binding
	                    this.binded = true;
	                    this.binding = thisItem[second];
	                    this.modifiable = false;
	                    this.value = "";
	                    
	                    // save binding path
	                    this.bindingPath = [binding];
	                // signals error if binded data is not valid type
	                } else {
	                    errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sDate");  
	                    return this;
	                }
            		
            	} else {
            		errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sDate");  
                return this;
            	}  
            // signals error if binded data is not valid type
            } else  {
                errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sDate");  
                return this;
            }
        // if function
        } else if (typeof(binding) === 'function') {
    		this.binded = true;
    		this.modifiable = false;
            this.value = "";
            this.binding = binding;          
			
			// find possible sObject referenced
			var retBindingPath = _extractBinding(binding.toString());
			
			// add each possible sObject to bindingPath
			this.bindingPath = new Array();	
			for (var sngBind in retBindingPath) {
				this.bindingPath.push(retBindingPath[sngBind]);
			}
        // if object or array
        } else {
            // if array signals error
            if (binding.length) {
                errore("setBinding", WRONGARGS, "wrong argument, array aren't supported, use object or string");  
                return this; 
            // if object, start complex binding
            } else {
                errore("setBinding", WRONGARGS, "object complex bindings not yet implemented");
            }
        }
        
    }

    return this;
}
// Make setModifiable property non enumerable
Object.defineProperty(_sNumber.prototype, "setBinding", {enumerable: false});


/** 
 * Set data binding to an ItemSocket
 * 
 * @param binding    string defining a binding to an ItemSocket
 * @param subpart    (optional) name of target object if a JSON element is expected from ItemSocket
 * @return _sDate     Returns this _sDate
 * @example myItem.myDate.attachSocket("myItemSocket");
 * @example myItem.myDate.attachSocket("myItemSocket", "subOject.myTargetObject");
 */
_sDate.prototype.attachSocket = _sNumber.prototype.attachSocket;
// Make setModifiable property non enumerable
Object.defineProperty(_sDate.prototype, "attachSocket", {enumerable: false});


/** 
 * Decide if date must be excluded from visualization
 * 
 * @param invisible    boolean indicating if must be invisible
 * @return _sDate     Returns this _sDate
 * @example myItem.myDate.setInvisible(true);
 */
_sDate.prototype.setInvisible = _sNumber.prototype.setInvisible;
// Make setLabel property non enumerable
Object.defineProperty(_sDate.prototype, "setInvisible", {enumerable: false});


/** 
 * Set class of corresponding HTML element to style them with css
 * 
 * @param objIn    one or more string that represent a class name
 * @return _sDate     Returns this _sDate
 * @example myItem.myDate.setClass("red");
 */
_sDate.prototype.setClass = _sNumber.prototype.setClass;
// Make setLabel property non enumerable
Object.defineProperty(_sDate.prototype, "setClass", {enumerable: false});




//*********** PUBLIC FUNCTIONS **********//
/** 
 * It assigns name to elements that must be drawed on HTML page, fill item and itemAdvanced array
 * to auto update related binding and display errors
 * 
 * @return none
 */
function _apply() {
	// add css style
	_addStyle();
	
	// find all available items, advancedItems and itemSocket
	_findAllItemNames();
	
    // iterate for every item
    for (var item in itemNames) {
	 	var thisItemName = itemNames[item];
	 	
	 	// exctract the item
	 	var thisItem = _extractItem(thisItemName);
	 	
	 	// check if item exists
	 	if (thisItem) {
		 	// assign its name
		 	thisItem.name = thisItemName;
	 	
    		// if item has local storage, save a reset copy
		    if (thisItem.localStorage) {
		    	// save a reset copy
		    	var tmpItem = new Item(thisItemName);
		    	tmpItem.name = thisItemName;
		    	itemsReset[thisItemName] = tmpItem;
		    }

			// define bindings for each item
			_defineBindings(thisItem);
    		
    		// eventually draw item
    		if (itemsToDraw.indexOf(thisItem.name) !== -1) {
        		_draw(thisItem);
        	}
        }
    	// else signals error
    	else {
    		errore("_apply", WRONGITEMNAME, "wrong item name: "+thisItemName+" not exists");
    	}
    }
    
    // iterate for every ItemAdvanced
    for (var itemAdv in itemsAdvancedNames) {
    	var thisItemAdvName = itemsAdvancedNames[itemAdv];
    	
    	var thisItemAdv = _extractItemAdvanced(thisItemAdvName);
    	
    	// check if item exists
	 	if (thisItemAdv) {
		 	// assign its name
		 	thisItemAdv.name = thisItemAdvName;
		 	
		 	// define bindings
		 	_defineBindingsAdvanced(thisItemAdv);
		 	
		 	// eventually draw item
    		if (itemsToDraw.indexOf(thisItemAdv.name) !== -1) {
        		_drawAdvanced(thisItemAdv);
        	}
		}
    	// else signals error
    	else {
    		errore("_apply", WRONGITEMNAME, "wrong ItemAdvanced name: "+thisItemAdvName+" not exists");
    	}
    }
    
    // iterate for every itemSocket
    for (var itemSoc in itemSocketNames) {
    	var thisItemSocketName = itemSocketNames[itemSoc];
    	
    	var thisItemSocket = _extractItemSocket(thisItemSocketName);
    	
    	// check if item exists
	 	if (thisItemSocket) {
		 	// assign its name
		 	thisItemSocket.name = thisItemSocketName;
		}
    	// else signals error
    	else {
    		errore("_apply", WRONGITEMNAME, "wrong ItemSocket name: "+thisItemSocketName+" not exists");
    	}
    }
    
    // set HTML as live, so also not displayed item
    ISRUNTIME = true;
    
    // manage position
    _managePosition();
       
    // display errors
    _displayErrors();
}
window._apply = _apply;

/** 
 * reposition item's element according to their order
 */
function _managePosition() {
	for (var elem in elementsAfter) {
		var thisCouple = elementsAfter[elem];
		
		// get the HTML element and check if it exists
		var HTMLitem = document.getElementById(thisCouple[0]);
		if (HTMLitem !== null) {
			// try to extract parent Item
			var HTMLfather = HTMLitem.parentNode;
			var fatherId = HTMLfather.getAttribute("id");
			if (HTMLfather !== null) {
				// try to extract second element
				var HTMLsibling = document.getElementById(thisCouple[1]);
				// check if found, in this case second element is another item
				if (HTMLsibling !== null) {
					// check if father is the same
					var checkFatherId = HTMLsibling.parentNode.getAttribute("id");
					if (fatherId !== checkFatherId) {
						HTMLsibling = document.getElementById(fatherId+"_"+thisCouple[1]).parentNode;
					}
				}
				// in other cases second element should be a sObject
				else {
					HTMLsibling = document.getElementById(fatherId+"_"+thisCouple[1]).parentNode;
				}
				
				// if HTMLsibling have been found correctly
				if (HTMLsibling !== null) {
					if (HTMLsibling.nextSibling) {
						HTMLfather.insertBefore(HTMLitem, HTMLsibling.nextSibling);
					}
					else {
						HTMLfather.appendChild(HTMLitem);
					}
				}
			} else {
				errore("_managePosition", WRONGARGS, thisCouple[0]+" is not inside another item");
			}
		} else {
			errore("_managePosition", WRONGITEMNAME, "wrong Item name: "+thisCouple[0]+" not exists");
		}
	}
}



/** 
 * Decide where Item's content should be displayed in HTML page.
 * 
 * @param itemName   name or names or array on names of item to display
 * @return none
 * @example here("myItem1", ["myItem3", "myItem4"]);
 */
function here(itemName) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("here", NOARGS, "insufficient input arguments, at least 1 is required");
        return;
    // if at least 1 argument in input
    } else {
    	for (var elem in arguments) {
    		thisElem = arguments[elem];
    		
    		// control if string
    		if (typeof(thisElem) === 'string') {
    			document.write("<section id="+thisElem+"></section>");
    			// add a reference to drawable item name.
        		itemsToDraw.push(thisElem);
    		}
    		// if array
    		else if (typeof(thisElem) === 'object' && thisElem.length) {
    			for (var subElem in thisElem) {
    				// check if string
    				if (typeof(thisElem[subElem]) === 'string') {
    					document.write("<section id="+thisElem[subElem]+"></section>");
    					// add a reference to drawable item name.
        				itemsToDraw.push(thisElem);
    				}
    				// else signals wrong input
    				errore("here", WARNING, thisElem[subElem]+ " is not a string");
    			}
    		}
    		// signals wrong type
    		else {
    			errore("here", WARNING, thisElem+ " is not a string");
    		}
    	}  
    }
}


/** 
 * Attach one or more items inside another item
 * 
 * @param partentItemName   name of item where other item(s) must be placed
 * @param sonItems   name of item where other item(s) must be placed
 * @return none
 * @example here(myItem);
 */
function inside(sonItems, partentItemName) {
    // check if any arguments has been passed
    if (arguments.length < 2) {
        errore("inside", NOARGS, "insufficient input arguments, at least 2 is required");
        return false;
    // if at least 1 argument in input
    } else {
    	// search parent item HTML section
    	var HTMLparent = document.getElementById(partentItemName);
    	
    	// create son
    	var HTMLson = document.createElement("section");
    	HTMLson.setAttribute("id", sonItems);
    	
    	// append code
    	HTMLparent.appendChild(HTMLson);
        
        // add item name to array of items to draw .
        itemsToDraw.push(sonItems);
    }
}


/** 
 * takes a well formatted date string ("yyyy-mm-dd") and returns a 3 object array
 * made by [dd, mm, yyyy]. Returns false if input is wrong
 * 
 * @param inputRawDate   a well formatted date string "yyyy-mm-dd"
 * @return   array [dd, mm, yyyy] or false
 * @example _extractNumberFromDate("2012/26/25");
 */
function extractNumberFromDate(inputRawDate) {
	// check if date is well formatted 
	var inputDate = _extractDate(inputRawDate);
	if (inputDate) {
		var year = inputDate.substring(0, 4);
		var month = inputDate.substring(5, 7);
		var day = inputDate.substring(8, 10);
		
		return [parseInt(day), parseInt(month), parseInt(year)];
	} else {
		return false;
	}
}


//*********** PRIVATE FUNCTIONS **********//



//****** DRAWING FUNCTIONS *******//

/** 
 * draw item's element in HTML
 * 
 * @param item to draw
 * @return none
 * @example _draw(myItem);
 */
function _draw(item){
	// check if item has a position
	if (itemsToDraw.indexOf(item.name) !== -1) {
	    // extract corresponding HTML node
	    var HTMLitem = document.getElementById(item.name);
	    
	    // eventually draw label
	    if (item.label) {
	    	 //var HTMLelem = document.createElement("li");
	    	 var HTMLlabel = document.createElement("p");
	    	 
	    	 HTMLlabel.innerHTML = item.label;
	    	 HTMLlabel.setAttribute("id", HTMLitem.getAttribute("id")+"_"+item.name+"_label");
	    	 HTMLlabel.className = HTMLlabel.className + " itemLabel";
	    	 HTMLlabel.className = HTMLlabel.className + " prova";
	    	 
	    	 //HTMLelem.appendChild(HTMLlabel);
	    	 HTMLitem.appendChild(HTMLlabel);
	    }

	    // eventually add element attributes
	    if (item.classAttribute && !_hasClass(HTMLitem, HTMLitem.className)) {
	    	HTMLitem.className += item.classAttribute;
	    }
	    
	    // create item to store local saved data
	    var localStorageObj;
	    
	    // check if something already stored in localStorage and eventually retrieve saved values  
	    if (item.localStorage) {
		    // recover local values if available
		    if (localStorage[item.name] != undefined) {
		    	var localObject = item._fromLocalStorage();
		    	
		    	// ******************************************* setValue should be used? Or is it exactly the cose where it should be avoid?
		    	for (var attr in localObject) {
					item[attr].value = localObject[attr];
				}
		    }
			// update local storage and save archieved data
			localStorageObj = item._toLocalStorage();
		}
	    
	    // for each element in Item
	    for (var el in item) {
	        var elem = item[el];
	        
	        // if element is an sObject, draw it
			if (_checkSObject(elem)) {
	        	_drawSObject(HTMLitem, elem, localStorageObj);
	       }
	    }
	    
	    // create updateButton and event handler
	    _setUpdate(HTMLitem, item);    
	    
	    // create a reset button if stored locally
	    if (item.localStorage) {
	    	_setReset(HTMLitem, item);
	    }
	    
		// eventually make item invisible
		if (item.invisible === true && !_hasClass(HTMLitem, "H5_invisible")) {
			HTMLitem.className += " H5_invisible";
		} else if (item.invisible === false && _hasClass(HTMLitem, "H5_invisible")) {
			_removeClass(HTMLitem, "H5_invisible");
		}
		
	}
	
	else {
		errore("_draw", INTERNAL_WRONGARGS, "input item doesn't has a position to be placed");
	}
}


/** 
 * memorize items ordering
 * 
 * @param item    the item to put after
 * @param otherObject    the object tha comes before (an sObject or Item or ItemAdvanced)
 * @return boolean that signals if assignemt was correct or wrong
 * @example otherObject(myItem, anotherItem.anyString);
 */
function putItemAfter (item, otherObject) {
	// check if any arguments has been passed
	if (arguments.length < 2) {
    	errore("putItemAfter", NOARGS, "insufficient input arguments: a drawed item and another object are required");
    	return false;
 	}
 	// if number of argument is correct
 	else {
 		// check if input types are correct
 		if (typeof(item) === 'string' || typeof(otherObject) === 'string') {
 			// check fi element already listed in any order
 			if (elementsAfter.indexOf([item, otherObject]) === -1 && elementsAfter.indexOf([otherObject, item]) === -1) {
 				elementsAfter.push([item, otherObject]);
 				return true;
 			}
 			// signals warning if elements already in array
 			else {
 				errore("putItemAfter", WRONGARGS, "elemnts hal already an order");
 				return false;
 			}
 		}
 		// eventually signals wrong input type
 		else {
 			errore("putItemAfter", WRONGARGS, "wrong input arguments: only strings accepted");
    		return false;
 		}
 	}
}




/** 
 * redraw item's element by removing old HTML and generating new code, eventually
 * redrawing also binding dependances
 * 
 * @param item to redraw
 * @return none
 * @example _reDraw(myItem);
 */
function _reDraw(item){
	// find items to redraw
	var arrayItemsSearch = [item.name];
	var arrayItemsExplored = [];
	var itemsRedrawName = [];
	var itemsAdvancedRedrawName = [];
	
	var thisItemName;
	while (thisItemName = arrayItemsSearch.pop()) {
		// check if must be draw
		if (itemsToDraw.indexOf(thisItemName) !== -1) {
			itemsRedrawName.push(thisItemName);
		}	
		// add item in already explored array
		arrayItemsExplored.push(thisItemName);
		// extract item
		var thisItem = _extractItem(thisItemName);
		// eventually extract itemAdvanced
		// if item has some bindings
		if (thisItem && thisItem.bindingRef.length > 0) {
			// for each binding
			for (var refItem in thisItem.bindingRef) {
				var newItemName = thisItem.bindingRef[refItem];
				// if not already expanded and not already in array of items to explore
 				if (arrayItemsExplored.indexOf(newItemName) === -1 && arrayItemsSearch.indexOf(newItemName) === -1) {
 					// put in array of items already to explore
 					arrayItemsSearch.push(newItemName);
 					// if item ha a drawing position put also in array of items to draw
 				}
			}
		}
		if (thisItem && thisItem.bindingRefAdvanced.length > 0) {
			// for each binding
			for (var refItemAdvanced in thisItem.bindingRefAdvanced) {
				var newItemAdvancedName = thisItem.bindingRefAdvanced[refItemAdvanced];
				// if not already expanded and not already in array of items to explore
 				if (itemsAdvancedRedrawName.indexOf(newItemAdvancedName) === -1) {
 					// put in array of items already to explore
 					itemsAdvancedRedrawName.push(newItemAdvancedName);
 					// if item ha a drawing position put also in array of items to draw
 				}
			}
		}
	}
	
	// for each item to redraw
	for (var sngItem in itemsRedrawName) {
		var sngItemName = itemsRedrawName[sngItem];
		// find HTML corresponding element
		var HTMLitem = document.getElementById(sngItemName);
		
		// cancell HTML element different from sections
		_cancelHTMLElements(HTMLitem);
		
		// extract item and call _draw() function
		 _draw(_extractItem(sngItemName));
	}
	
	// for each itemAdvanced to redraw
	if (itemsAdvancedRedrawName.length > 0) {
		for (var sngItemAdv in itemsAdvancedRedrawName) {
			var sngItemAdvancedName = itemsAdvancedRedrawName[sngItemAdv];
			// find HTML corresponding element
			var HTMLitem = document.getElementById(sngItemAdvancedName);
			
			// cancell HTML element different from sections
			_cancelHTMLElements(HTMLitem);
			
			// extract item and call _draw() function
			 _drawAdvanced(_extractItemAdvanced(sngItemAdvancedName));
		}
	}
	
	// adjust element position
	_managePosition();
}


/** 
 * remove an HTML element
 * 
 * @param HTMLitem    HTML item to remove
 * @return none
 * @example _cancelHTMLElements(myHTMLItem);
 */
function _cancelHTMLElements(HTMLitem) {
	var saveSection = [];
	// iterate until each child node has been removed
	while (HTMLitem.hasChildNodes()) {
		// if it's a section, save it
		if (HTMLitem.lastChild.nodeName === 'SECTION') {
    		saveSection.push(HTMLitem.lastChild);
    	}
		
		// remove child
    	HTMLitem.removeChild(HTMLitem.lastChild);
	}
	// eventually re append section elements
	if (saveSection.length > 0) {
		for (var elem in saveSection) {
			HTMLitem.appendChild(saveSection[elem]);
		}
	}
}


/** 
 * Draw _sObject common HTML elements
 * 
 * @param HTMLitem   HTML corresponding item to be manipulated
 * @param elem   _sObject to be displayed
 * @param localStorageObj   contains local storage info
 * @return none
 * @example _drawSNumber(myItem.mySNumber, false);
 */
function _drawSObject(HTMLitem, elem, localStorageObj) {
	// check if any arguments has been passed
	if (arguments.length < 3) {
    	errore("_drawSObject", INTERNAL_NOARGS, "insufficient input arguments: HTMLitem, elem and localStorage are required");
    	return;
 	}
 	// if number of argument is correct
 	else {
 		// check arguments type
 		if (HTMLitem instanceof HTMLElement &&  _checkSObject(elem)) {
 			// check if something in localStorage
        	var storedLocally = false;
        	if (localStorageObj != undefined) {
        		storedLocally = localStorageObj;
        	}
        	
        	// build element to display
            var fragment = document.createDocumentFragment();
            var HTMLelem = document.createElement("li");
            fragment.appendChild(HTMLelem);
            
            var HTMLsObject;
            // call proper function to draw elements
            if (elem instanceof _sNumber) {
            	HTMLsObject = _drawSNumber(elem, storedLocally);
            } else if (elem instanceof _sString) {
            	HTMLsObject = _drawSString(elem, storedLocally);
            } else if (elem instanceof _sBoolean) {
            	HTMLsObject = _drawSBoolean(elem, storedLocally);
            } else if (elem instanceof _sDate) {
            	HTMLsObject = _drawSDate(elem, storedLocally);
            }
            var HTMLvalue = HTMLsObject[0];
            var HTMLlabel = HTMLsObject[1];
            
            // set id and attributes and append
            //HTMLvalue.setAttribute("id", HTMLitem.getAttribute("id")+"_"+elem.name);
            HTMLvalue.setAttribute("id", elem.fatherName+"_"+elem.name);
            if (elem.classAttribute) {
            	HTMLvalue.className += elem.classAttribute;
            }
            
            // set invisibility
            if (elem.invisible) {
            	HTMLelem.className += " H5_invisible";
            }
            
            // append elements
            if (elem.label != false) {
            	HTMLelem.appendChild(HTMLlabel);
            }
            HTMLelem.appendChild(HTMLvalue);
            
            HTMLitem.appendChild(fragment);	
 		}
 		// signals wrong arguments type
 		else {
 			errore("_drawSObject", INTERNAL_WRONGARGS, "wrong input arguments, an HTMLElement and a _sObject are required");
            return;
        }
 	}
}


/** 
 * Draw _sNumber HTML elements
 * 
 * @param elem   _sNumber to be deisplayed
 * @param storedLocally   scontains local storage info
 * @return none
 * @example _drawSNumber(myItem.mySNumber, false);
 */
function _drawSNumber(elem, storedLocally) {
    // check if any arguments has been passed
    if (arguments.length < 2) {
        errore("_drawSNumber", INTERNAL_NOARGS, "insufficient input arguments: an sNumer and and localStorage reference required");
    // if number of argument is correct, check its type
    } else {
        // if arguments are correct
        if (elem instanceof _sNumber) {    
            // if value is undefined, draw label and input            
            if (elem.binded === false && (elem.bindedSocket === false || elem.bindedSocket === undefined) && (   (!storedLocally && (elem.value === "" || elem.value === undefined)) || (storedLocally && storedLocally[elem.name] == undefined))) {
            	var HTMLvalue = document.createElement("input");
            	var HTMLlabel = document.createElement("label");
            	// if label is defined use that
            	if (elem.label !== "" && elem.label !== undefined) {
            		HTMLlabel.innerHTML = elem.label;
            	} else {
            		HTMLlabel.innerHTML = elem.name;
            	}
            }
            // if element has a value, draw span label and span value
            else {
            	var HTMLvalue = document.createElement("span");
            	var HTMLlabel = document.createElement("span");
            	
            	// if label is defined use that
            	if (elem.label !== "" && elem.label !== undefined) {
            		HTMLlabel.innerHTML = elem.label+": ";
            	} else {
            		HTMLlabel.innerHTML = elem.name+": ";
            	}
            	
				// if value in losalStorage, use that values
				if (storedLocally && elem.binded === false && (elem.bindedSocket === false || elem.bindedSocket === undefined)) {
					HTMLvalue.innerHTML = storedLocally[elem.name];
				} else {
            		HTMLvalue.innerHTML = elem.get();
            	}
            	
            	// define socketItem and JSON element
            	if (elem.bindedSocket) {
            		if (typeof(elem.bindingPathSocket) === 'string') {
            			var itemSocket = _extractItemSocket(elem.bindingPathSocket);
            			var JSONitem = false;
            		} else {
            			var itemSocket = _extractItemSocket(elem.bindingPathSocket[0]);
            			var JSONitem = elem.bindingPathSocket[1];
            		}
            		
            		// if not binded to JSON element
            		var outputValue = false;
            		if (JSONitem === false) {
            			// define content
            			if (itemSocket.message !== undefined) {
            				//HTMLvalue.innerHTML = itemSocket.message;
            				outputValue = itemSocket.message;
            			} else {
            				HTMLvalue.innerHTML = "nothing from server";
            			}
            		}
            		// if binded to JSON element
            		else {
            			// check if something received
            			if (itemSocket.message !== undefined) {
            				// check if valid JSON received
            				if (itemSocket.isMessageJSON === true) {
            					// check if content exists
            					var displayString = eval(itemSocket.name+".messageJSON."+JSONitem);
            					if (displayString !== undefined) {
            						outputValue = displayString;
            						//OLD: HTMLvalue.innerHTML = itemSocket.messageJSON[JSONitem];
            					} else {
            						HTMLvalue.innerHTML = "JSON value not received from server";
            					}
            				} else {
            					HTMLvalue.innerHTML = "invalid JSON response from server";
            				}
            			} else {
            				HTMLvalue.innerHTML = "nothing from server";
            			}
            		}
            		
            		// eventually show content 
            		if (outputValue !== false) {
            			if (!isNaN(parseFloat(outputValue))) {
            				HTMLvalue.innerHTML = parseFloat(outputValue);
            			} else {
            				HTMLvalue.innerHTML = "value from server not numeric";
            			}
            		}
            	}
            	
            	// check if editable
            	if (elem.modifiable === true) {
            		HTMLvalue.setAttribute("contenteditable", "true");
            	}
            }
            
            return [HTMLvalue, HTMLlabel];
        } else {
            errore("_drawSNumber", INTERNAL_WRONGARGS, "wrong input arguments, a _sNumber is required");
            return;
        }
    }
}



/** 
 * Draw _sString HTML elements
 * 
 * @param elem   _sString to be deisplayed
 * @param storedLocally   scontains local storage info
 * @return none
 * @example _drawSString(myItem.mySString, false);
 */
function _drawSString(elem, storedLocally) {
    // check if any arguments has been passed
    if (arguments.length < 2) {
        errore("_drawSString", INTERNAL_NOARGS, "insufficient input arguments: a sString and and localStorage reference required");
    // if number of argument is correct, check its type
    } else {
        // if arguments are correct
        if (elem instanceof _sString) { 
            // if value is undefined, draw label and input
            if (elem.binded === false && (elem.bindedSocket === false || elem.bindedSocket === undefined) && ( (!storedLocally && (elem.value === "" || elem.value === undefined)) || (storedLocally && storedLocally[elem.name] == undefined))) {
            	var HTMLvalue = document.createElement("input");
            	var HTMLlabel = document.createElement("label");
            	// if label is defined use that
            	if (elem.label !== "" && elem.label !== undefined) {
            		HTMLlabel.innerHTML = elem.label;
            	} else {
            		HTMLlabel.innerHTML = elem.name;
            	}
            }
            // if element has a value, draw span label and san value
            else {
            	var content = false;
            	var HTMLvalue = document.createElement("span");
            	var HTMLlabel = document.createElement("span");
            	
            	// if label is defined use that
            	if (elem.label !== "" && elem.label !== undefined) {
            		HTMLlabel.innerHTML = elem.label+": ";
            	} else {
            		HTMLlabel.innerHTML = elem.name+": ";
            	}

            	// if value in localStorage, use that values
				if (storedLocally && elem.binded === false && (elem.bindedSocket === false || elem.bindedSocket === undefined)) {
					//HTMLvalue.innerHTML = storedLocally[elem.name];
					content = storedLocally[elem.name];
				} else {
            		//HTMLvalue.innerHTML = elem.get();
            		content = elem.get();
            	}
            	
            	// define socketItem and JSON element
            	if (elem.bindedSocket) {
            		if (typeof(elem.bindingPathSocket) === 'string') {
            			var itemSocket = _extractItemSocket(elem.bindingPathSocket);
            			var JSONitem = false;
            		} else {
            			var itemSocket = _extractItemSocket(elem.bindingPathSocket[0]);
            			var JSONitem = elem.bindingPathSocket[1];
            		}
            		
            		// if not binded to JSON element
            		if (JSONitem === false) {
            			// define content
            			if (itemSocket.message !== undefined) {
            				content = itemSocket.message;
            			} else {
            				content = "nothing from server";
            			}
            		}
            		// if binded to JSON element
            		else {
            			// check if something received
            			if (itemSocket.message !== undefined) {
            				// check if valid JSON received
            				if (itemSocket.isMessageJSON === true) {
            					// check if content exists
            					var displayString = eval(itemSocket.name+".messageJSON."+JSONitem);
            					if (displayString !== undefined) {
            						content =L = displayString;
            						//OLD: HTMLvalue.innerHTML = itemSocket.messageJSON[JSONitem];
            					} else {
            						content = "JSON value not received from server";
            					}
            				} else {
            					content = "invalid JSON response from server";
            				}
            			} else {
            				content = "nothing from server";
            			}
            		}
            	}
            	
            	if (content) {
            		HTMLvalue.innerHTML = content;
            	}
            	
            	// check if editable
            	if (elem.modifiable === true) {
            		HTMLvalue.setAttribute("contenteditable", "true");
            	}
            }
            
            return [HTMLvalue, HTMLlabel];
        } else {
            errore("_drawSString", INTERNAL_WRONGARGS, "wrong input arguments, a _sString is required");
            return;
        }
    }
}


/** 
 * Draw _sBoolean HTML elements
 * 
 * @param elem   _sBoolean to be deisplayed
 * @param storedLocally   scontains local storage info
 * @return none
 * @example _drawSNumber(myItem.mySString, false);
 */
function _drawSBoolean(elem, storedLocally) {
    // check if any arguments has been passed
    if (arguments.length < 2) {
        errore("_drawSBoolean", INTERNAL_NOARGS, "insufficient input arguments: a _sBoolean and and localStorage reference required");
    // if number of argument is correct, check its type
    } else {
        // if arguments are correct
        if (elem instanceof _sBoolean) {    
            var HTMLvalue = document.createElement("input");
           	HTMLvalue.setAttribute("type", "checkbox")
           	var HTMLlabel = document.createElement("span");
           	// if label is defined use that
           	if (elem.label !== "" && elem.label !== undefined) {
           		HTMLlabel.innerHTML = elem.label+": ";
           	} else {
           		HTMLlabel.innerHTML = elem.name+": ";
           	}
           	
           	// if locally stored use that value
           	if (storedLocally && elem.binded === false && (elem.bindedSocket === false || elem.bindedSocket === undefined)) {
           		var valueOut = localStorageObj[elem.name];
           	} else {
           		// if not socket binded
           		if ((elem.bindedSocket === false || elem.bindedSocket === undefined)) {
           			var valueOut = elem.get();
           		}
           		// if socket binded
           		else {
           			var valueOut = false;
           			// define socketItem and JSON element
	            	if (elem.bindedSocket) {
	            		if (typeof(elem.bindingPathSocket) === 'string') {
	            			var itemSocket = _extractItemSocket(elem.bindingPathSocket);
	            			var JSONitem = false;
	            		} else {
	            			var itemSocket = _extractItemSocket(elem.bindingPathSocket[0]);
	            			var JSONitem = elem.bindingPathSocket[1];
	            		}
	            		
	            		// if not binded to JSON element
	            		var outputValue = false;
	            		if (JSONitem === false) {
	            			// define content
	            			if (itemSocket.message !== undefined) {
	            				//HTMLvalue.innerHTML = itemSocket.message;
	            				if (itemSocket.message === true || itemSocket.message === "true") {
	            					outputValue = "true";
	            				} else if (itemSocket.message === false || itemSocket.message === "false") {
	            					outputValue = "false";
	            				}
	            			} else {
	            				HTMLvalue.innerHTML = "nothing from server";
	            			}
	            		}
	            		// if binded to JSON element
	            		else {
	            			// check if something received
	            			if (itemSocket.message !== undefined) {
	            				// check if valid JSON received
	            				if (itemSocket.isMessageJSON === true) {
	            					// check if content exists
	            					var displayString = eval(itemSocket.name+".messageJSON."+JSONitem);
	            					if (displayString !== undefined) {
	            						if (displayString === true || displayString === "true") {
			            					outputValue = "true";
			            				} else if (displayString === false || displayString === "false") {
			            					outputValue = "false";
			            				}
	            						//OLD: HTMLvalue.innerHTML = itemSocket.messageJSON[JSONitem];
	            					} else {
	            						HTMLvalue.innerHTML = "JSON value not received from server";
	            					}
	            				} else {
	            					HTMLvalue.innerHTML = "invalid JSON response from server";
	            				}
	            			} else {
	            				HTMLvalue.innerHTML = "nothing from server";
	            			}
	            		}
	            		// eventually show content 
	            		if (outputValue === "true" || outputValue === "false") {
	            			if (outputValue === "true") {
	            				HTMLvalue.setAttribute("checked", "checked");
	            			} 
	            		} else {
	            			HTMLvalue = document.createElement("span");
	            			HTMLvalue.innerHTML = "wrong server response";
	            		}
	            	}
            	
            	
           		}
           	}
           	
           	// if true, make it checked
           	if (valueOut) {
           		HTMLvalue.setAttribute("checked", "checked");
           	}
           	
           	// check if editable
           	if (elem.modifiable === false) {
           		HTMLvalue.setAttribute("disabled", "disabled");
           	}
            
            return [HTMLvalue, HTMLlabel];
        } else {
            errore("_drawSBoolean", INTERNAL_WRONGARGS, "wrong input arguments, a _sBoolean is required");
            return;
        }
    }
}


/** 
 * Draw _sDate HTML elements
 * 
 * @param elem   _sDate to be deisplayed
 * @param storedLocally   scontains local storage info
 * @return none
 * @example _drawSDate(myItem.mySDate, false);
 */
function _drawSDate(elem, storedLocally) {
    // check if any arguments has been passed
    if (arguments.length < 2) {
        errore("_drawSDate", INTERNAL_NOARGS, "insufficient input arguments: a _sDate and and localStorage reference required");
    // if number of argument is correct, check its type
    } else {
        // if arguments are correct
        if (elem instanceof _sDate) {    
            // draw label and input
            var HTMLvalue = document.createElement("input");
            var HTMLlabel = document.createElement("label");
            HTMLvalue.setAttribute("type", "date");
            
            // if label is defined use that
        	if (elem.label !== "" && elem.label !== undefined) {
        		HTMLlabel.innerHTML = elem.label + ": ";
        	} else {
        		HTMLlabel.innerHTML = elem.name + ": ";
        	}
            
            // if value in localStorage, use that values
			if (storedLocally && elem.binded === false && elem.bindedSocket === false) {
				HTMLvalue.innerHTML = localStorageObj[elem.name];
			} else {
				// if value is defined, visualyze that value
				if (elem.get() != undefined) {
        			HTMLvalue.value = elem.get();
        		}
        	}
        	
        	// define socketItem and JSON element
        	if (elem.bindedSocket) {
        		if (typeof(elem.bindingPathSocket) === 'string') {
        			var itemSocket = _extractItemSocket(elem.bindingPathSocket);
        			var JSONitem = false;
        		} else {
        			var itemSocket = _extractItemSocket(elem.bindingPathSocket[0]);
        			var JSONitem = elem.bindingPathSocket[1];
        		}
        		
        		// if not binded to JSON element
        		var outputValue = false;
        		if (JSONitem === false) {
        			// define content
        			if (itemSocket.message !== undefined) {
        				//HTMLvalue.innerHTML = itemSocket.message;
        				outputValue = itemSocket.message;
        			} else {
        				HTMLvalue.innerHTML = "nothing from server";
        			}
        		}
        		// if binded to JSON element
        		else {
        			// check if something received
        			if (itemSocket.message !== undefined) {
        				// check if valid JSON received
        				if (itemSocket.isMessageJSON === true) {
        					// check if content exists
        					var displayString = eval(itemSocket.name+".messageJSON."+JSONitem);
        					if (displayString !== undefined) {
        						outputValue = displayString;
        						//OLD: HTMLvalue.innerHTML = itemSocket.messageJSON[JSONitem];
        					} else {
        						HTMLvalue.innerHTML = "JSON value not received from server";
        					}
        				} else {
        					HTMLvalue.innerHTML = "invalid JSON response from server";
        				}
        			} else {
        				HTMLvalue.innerHTML = "nothing from server";
        			}
        		}
        		
        		// eventually show content 
        		if (outputValue !== false) {
        			var possibleDate = _extractDate(outputValue);
        			if (possibleDate) {
        				HTMLvalue.value = possibleDate;
        			} else {
        				HTMLvalue = document.createElement("span");
        				HTMLvalue.innerHTML = "invalid date from server";
        			}
        		} else {
        			HTMLvalue = document.createElement("span");
        			HTMLvalue.innerHTML = "invalid value from server";
        		}
        	}
        	
        	// check if editable
        	if (elem.modifiable === false) {
        		HTMLvalue.setAttribute("readonly", "readonly");
        	}
            
            return [HTMLvalue, HTMLlabel];
        } else {
            errore("_drawSDate", INTERNAL_WRONGARGS, "wrong input arguments, a _sDate is required");
            return;
        }
    }
}


/** 
 * Set and draw the update button for an item
 * 
 * @param HTMLitem   HTML element corresponding to item to manipulate
 * @param item   an item to manipulate
 * @return none
 * @example _setUpdate(myHTMLItem, myItem);
 */
function _setUpdate(HTMLitem, item) {
	// create button
	var HTMLbutton = document.createElement("button");
	HTMLbutton.setAttribute("type", "button");
	HTMLbutton.setAttribute("id", item.name + "_updateButton");
	HTMLbutton.setAttribute("class", "updateButton");
	HTMLbutton.innerHTML = "update";
	
	// insert it
	HTMLitem.appendChild(HTMLbutton);
	// eventually make update invisible
	if (item.updateHidden !== undefined && item.updateHidden === true && !_hasClass(HTMLbutton, "H5_invisible")) {
		HTMLbutton.className += " H5_invisible";
	} else if ((item.updateHidden === undefined || item.updateHidden === false) && _hasClass(HTMLbutton, "H5_invisible")) {
		_removeClass(HTMLbutton, "H5_invisible");
	}
	
	// create event handler
	HTMLbutton.onclick = function(){
		// for each element in item
		for (var el in item) {
			var elem = item[el];
			
			var HTMLelem = document.getElementById(item.name+"_"+elem.name);
			// check its instance and eventually update
			if (elem instanceof _sNumber) {
				// update cases
				if ((elem.value === "" || elem.value === undefined) && HTMLelem.value != "" && elem.binded === false) {
					elem.setValue(HTMLelem.value);
				} else if (elem.value !== "" && HTMLelem.innerHTML != elem.value && elem.binded === false) {
					elem.setValue(HTMLelem.innerHTML);
				}
			} else if (elem instanceof _sString && elem != null) {
				// update cases
				if ((elem.value === "" || elem.value === undefined) && HTMLelem.value != "" && elem.binded === false) {
					elem.setValue(HTMLelem.value);
				} else if (elem.value !== "" && HTMLelem.innerHTML != elem.value && elem.binded === false) {
					elem.setValue(HTMLelem.innerHTML);
				}
			} else if (elem instanceof _sBoolean) {
				// if checked set value to true, else false
				if (HTMLelem.checked === true) {
					elem.setValue(true);
				} else {
					elem.setValue(false);
				}
			} else if (elem instanceof _sDate) {
				// check if date is correct (it should be, but consider also browser with uncomplete date support)
				var testDate = _extractDate(HTMLelem.value);
				if (testDate !== false) {
					elem.setValue(testDate);
				}
			}
		}
		
		// eventually store locally
		if (item.localStorage) {
			item._toLocalStorage();
		}
		
		// cancel old element and draw again, considering also dependances
		_reDraw(item);
	}
}


/** 
 * Set and draw the reset button for an item that has localStorage
 * 
 * @param HTMLitem   HTML element corresponding to item to manipulate
 * @param item   an item to manipulate
 * @return none
 * @example _setReset(myHTMLItem, myItem);
 */
function _setReset(HTMLitem, item) {
	// create button
	var HTMLbutton = document.createElement("button");
	HTMLbutton.setAttribute("type", "button");
	HTMLbutton.setAttribute("id", item.name + "_resetButton");
	HTMLbutton.setAttribute("class", "resetButton");
	HTMLbutton.innerHTML = "reset";
	
	// insert it
	HTMLitem.appendChild(HTMLbutton);
	
	HTMLbutton.onclick = function(){ 
		// retrieve original item
		var tmpItem = itemsReset[item.name];
		
		// update values
		for (var attr in tmpItem) {
			var thisAttr = tmpItem[attr];
			
			if (thisAttr instanceof _sNumber || thisAttr instanceof _sString || thisAttr instanceof _sBoolean || thisAttr instanceof _sDate) {
				item[attr].value = thisAttr.value;
			}
		}
		
		item._toLocalStorage();
		
		_reDraw(item);
	}
}


//******* RUNTIME FUNCTIONS ********//
/** 
 * redraw every Item and ItemAdvanced at runtime
 * 
 * @return boolean to signal if error appended
 * @example redraw();
 */
function redraw() {
	// check if already at runtime
	if (ISRUNTIME) {
		// redraw each item
		for (var elem in items) {
			var item = items[elem];
			if (itemsToDraw.indexOf(item.name) !== -1) {
				_reDraw(item);
			}
		}
		
		// redraw each itemAdvanced
		for (var elem in itemsAdvanced) {
			var itemAdvance = itemsAdvanced[elem];
			if (itemsToDraw.indexOf(itemAdvance.name) !== -1) {
				_reDrawAdvanced(itemAdvance);
			}
		}
		
		return true;
	}	
	// if not at runtime signals error
	else {
		errore("redraw", CALLTIME, "this function could be used only at runtime, no need to be used before");
		return false;
	}
}


/** 
 * redraw a specific Item or ItemAdvanced at runtime
 * 
 * @param name    name of an item or itemAdvanced to redraw
 * @return boolean to signal if error appended
 * @example redrawItem(myItemAdvancedName);
 */
function redrawItem(name) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if item is already drawn
		if (itemsToDraw.indexOf(name) !== -1) {
			// check if item exists and eventually redraw
			var thisItem = _extractItem(name);
			
			if (thisItem) {
				_reDraw(thisItem);
				return true;
			}
			// check if itemAdvanced exists
			else {
				var thisItemAdvanced = _extractItemAdvanced(name);
				if (thisItemAdvanced) {
					_reDrawAdvanced(thisItemAdvanced);
					return true;
				}
				// ventually signals error
				else {
					errore("redraw", WRONGARGS, "input item is not valid");
					return false
				}
			}
			
		}
		else {
			errore("redraw", WRONGARGS, "only already drawn item could be re-drawn");
			return false;
		}
	}	
	// if not at runtime signals error
	else {
		errore("redraw", CALLTIME, "this function could be used only at runtime, no need to be used before");
		return false;
	}
}



/** 
 * If at runtime, attach one or more item inside an already placed HTML element with a given id
 * 
 * @param idIn   id of an HTML element
 * @param itemsNew   item/items names to attach after HTML element
 * @return   boolean to signals if assignement failed or not 
 * @example   attachItemAfterId("HTMLid", "item1toDraw", "item2toDraw");
 */
function attachItemInsideId(idIn, itemsNew) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 2) {
	        errore("attachItemInsideId", NOARGS, "insufficient input arguments, at least old item and one new item are required");
	        return false;
        }
        // if at least 2 input arguments
        else {
        	// extract array of new item
        	delete arguments[0];
			var arraySons = _attachExtractNamesToArray(arguments);
        	
        	// if any valid
        	if (arraySons) {
        		var arrayExtracted = _extractItemsToAppend(arraySons);
        		
        		// if any valid
        		if (arrayExtracted) {
        			return _attachItemAndId("inside", idIn, arrayExtracted);
        		} else {
        			errore("attachItemInsideId", WRONGARGS, "no valid item to attach");
					return false;
        		}
        	} else {
        		errore("attachItemInsideId", WRONGARGS, "no valid strings found");
				return false;
        	}
        	
        	// set attributes to pass to _attachItemAndItem function   	
			var verifyAttachment = _attachItemAndItem("after", arguments);
			
			return verifyAttachment;
		}
	}
	// if not at runtime signals error
	else {
		errore("attachItemInsideId", CALLTIME, "this function could be used only at runtime. Use here() instead");
		return false;
	}
}


/** 
 * If at runtime, attach one or more item before an already placed HTML element with a given id
 * 
 * @param idIn   id of an HTML element
 * @param itemsNew   item/items names to attach after HTML element
 * @return   boolean to signals if assignement failed or not 
 * @example   attachItemAfterId("HTMLid", "item1toDraw", "item2toDraw");
 */
function attachItemAfterId(idIn, itemsNew) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 2) {
	        errore("attachItemAfterId", NOARGS, "insufficient input arguments, at least old item and one new item are required");
	        return false;
        }
        // if at least 2 input arguments
        else {
        	// extract array of new item
        	delete arguments[0];
			var arraySons = _attachExtractNamesToArray(arguments);
        	
        	// if any valid
        	if (arraySons) {
        		var arrayExtracted = _extractItemsToAppend(arraySons);
        		
        		// if any valid
        		if (arrayExtracted) {
        			return _attachItemAndId("after", idIn, arrayExtracted);
        		} else {
        			errore("attachItemAfterId", WRONGARGS, "no valid item to attach");
					return false;
        		}
        	} else {
        		errore("attachItemAfterId", WRONGARGS, "no valid strings found");
				return false;
        	}
        	
        	// set attributes to pass to _attachItemAndItem function   	
			var verifyAttachment = _attachItemAndItem("after", arguments);
			
			return verifyAttachment;
		}
	}
	// if not at runtime signals error
	else {
		errore("attachItemAfterId", CALLTIME, "this function could be used only at runtime. Use here() instead");
		return false;
	}
}


/** 
 * If at runtime, attach one or more item before an already placed HTML element with a given id
 * 
 * @param idIn   id of an HTML element
 * @param itemsNew   item/items names to attach before HTML element
 * @return   boolean to signals if assignement failed or not 
 * @example   attachItemBeforeId("HTMLid", "item1toDraw", "item2toDraw");
 */
function attachItemBeforeId(idIn, itemsNew) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 2) {
	        errore("attachItemBeforeId", NOARGS, "insufficient input arguments, at least old item and one new item are required");
	        return false;
        }
        // if at least 2 input arguments
        else {
        	// extract array of new item
        	delete arguments[0];
			var arraySons = _attachExtractNamesToArray(arguments);
        	
        	// if any valid
        	if (arraySons) {
        		var arrayExtracted = _extractItemsToAppend(arraySons);
        		
        		// if any valid
        		if (arrayExtracted) {
        			return _attachItemAndId("before", idIn, arrayExtracted);
        		} else {
        			errore("attachItemBeforeId", WRONGARGS, "no valid item to attach");
					return false;
        		}
        	} else {
        		errore("attachItemBeforeId", WRONGARGS, "no valid strings found");
				return false;
        	}
        	
        	// set attributes to pass to _attachItemAndItem function   	
			var verifyAttachment = _attachItemAndItem("after", arguments);
			
			return verifyAttachment;
		}
	}
	// if not at runtime signals error
	else {
		errore("attachItemBeforeId", CALLTIME, "this function could be used only at runtime. Use here() instead");
		return false;
	}
}


/** 
 * If at runtime, attach one or more item before an already placed item
 * 
 * @param itemOld   item (or name of item) already placed in HTML
 * @param itemsNew   item/items names to attach after old item
 * @return   boolean to signals if assignement failed or not 
 * @example   attachItemBeforeItem(myItemAlreadyDrawn, item1toDraw, "item2toDraw");
 */
function attachItemBeforeItem(itemOld, itemsNew) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 2) {
	        errore("attachItemBeforeItem", NOARGS, "insufficient input arguments, at least old item and one new item are required");
	        return false;
        }
        // if at least 2 input arguments
        else {
        	// extract array of new item
        	delete arguments[0];
			var arraySons = _attachExtractNamesToArray(arguments);
        	
        	// if any valid
        	if (arraySons) {
        		var arrayExtracted = _extractItemsToAppend(arraySons);
        		
        		// if any valid
        		if (arrayExtracted) {
        			return _attachItemAndItem("before", itemOld, arrayExtracted);
        		} else {
        			errore("attachItemBeforeItem", WRONGARGS, "no valid item to attach");
					return false;
        		}
        	} else {
        		errore("attachItemBeforeItem", WRONGARGS, "no valid strings found");
				return false;
        	}
        	
        	// set attributes to pass to _attachItemAndItem function   	
			var verifyAttachment = _attachItemAndItem("after", arguments);
			
			return verifyAttachment;
		}
	}
	// if not at runtime signals error
	else {
		errore("attachItemBeforeItem", CALLTIME, "this function could be used only at runtime. Use here() instead");
		return false;
	}
}


/** 
 * If at runtime, attach one or more item after an already placed item
 * 
 * @param itemOld   item (or name of item) already placed in HTML
 * @param itemsNew   item/items names to attach after old item
 * @return   boolean to signals if assignement failed or not 
 * @example   attachItemAfterItem(myItemAlreadyDrawn, item1toDraw, "item2toDraw");
 */
function attachItemAfterItem(itemOld, itemsNew) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 2) {
	        errore("attachItemAfterItem", NOARGS, "insufficient input arguments, at least old item and one new item are required");
	        return false;
        }
        // if at least 2 input arguments
        else {
        	// extract array of new item
        	delete arguments[0];
			var arraySons = _attachExtractNamesToArray(arguments);
        	
        	// if any valid
        	if (arraySons) {
        		var arrayExtracted = _extractItemsToAppend(arraySons);
        		
        		// if any valid
        		if (arrayExtracted) {
        			return _attachItemAndItem("after", itemOld, arrayExtracted);
        		} else {
        			errore("attachItemAfterItem", WRONGARGS, "no valid item to attach");
					return false;
        		}
        	} else {
        		errore("attachItemAfterItem", WRONGARGS, "no valid strings found");
				return false;
        	}
        	
        	// set attributes to pass to _attachItemAndItem function   	
			var verifyAttachment = _attachItemAndItem("after", arguments);
			
			return verifyAttachment;
		}
	}
	// if not at runtime signals error
	else {
		errore("attachItemAfterItem", CALLTIME, "this function could be used only at runtime. Use here() instead");
		return false;
	}
}


/** 
 * If at runtime, attach one or more item inside an already placed item
 * 
 * @param itemOld   item (or name of item) already placed in HTML
 * @param itemsNew   item/items names to attach after old item
 * @return   boolean to signals if assignement failed or not 
 * @example   attachItemInsideItem(myItemAlreadyDrawn, item1toDraw, "item2toDraw");
 */
function attachItemInsideItem(itemOld, itemsNew) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 2) {
	        errore("attachItemInsideItem", NOARGS, "insufficient input arguments, at least old item and one new item are required");
	        return false;
        }
        // if at least 2 input arguments
        else {
        	// extract array of new item
        	delete arguments[0];
			var arraySons = _attachExtractNamesToArray(arguments);
        	
        	// if any valid
        	if (arraySons) {
        		var arrayExtracted = _extractItemsToAppend(arraySons);
        		
        		// if any valid
        		if (arrayExtracted) {
        			return _attachItemAndItem("inside", itemOld, arrayExtracted);
        		} else {
        			errore("attachItemInsideItem", WRONGARGS, "no valid item to attach");
					return false;
        		}
        	} else {
        		errore("attachItemInsideItem", WRONGARGS, "no valid strings found");
				return false;
        	}
        	
        	// set attributes to pass to _attachItemAndItem function   	
			var verifyAttachment = _attachItemAndItem("after", arguments);
			
			return verifyAttachment;
		}
	}
	// if not at runtime signals error
	else {
		errore("attachItemInsideItem", CALLTIME, "this function could be used only at runtime. Use here() instead");
		return false;
	}
}




//****** SUPPORT FUNCTIONS *******//

/** 
 * check if object is an instance of any sObject
 * 
 * @param object   an object to check
 * @return boolean    true if object is a valid sObject
 * @example _checkSObject(myObject);
 */
function _checkSObject(object) {
	if (object instanceof _sNumber || object instanceof _sString || object instanceof _sBoolean || object instanceof _sDate) {
		return true;
	} else {
		return false;
	}
}


/** 
 * extract content of attached ItemSocket
 * 
 * @param elem   the element binded to socket
 * @return outputValue    return the binded value or false if nothing a available
 * @example _extractSocketContent(myObject);
 */
function _extractSocketContent(elem) {
	// define socketItem and JSON element
	if (elem.bindedSocket) {
		if (typeof(elem.bindingPathSocket) === 'string') {
			var itemSocket = _extractItemSocket(elem.bindingPathSocket);
			var JSONitem = false;
		} else {
			var itemSocket = _extractItemSocket(elem.bindingPathSocket[0]);
			var JSONitem = elem.bindingPathSocket[1];
		}
		
		// if not binded to JSON element
		var outputValue = false;
		if (JSONitem === false) {
			// define content
			if (itemSocket.message !== undefined) {
				//HTMLvalue.innerHTML = itemSocket.message;
				outputValue = itemSocket.message;
			} else {
				;
			}
		}
		// if binded to JSON element
		else {
			// check if something received
			if (itemSocket.message !== undefined) {
				// check if valid JSON received
				if (itemSocket.isMessageJSON === true) {
					// check if content exists
					var displayString = eval(itemSocket.name+".messageJSON."+JSONitem);
					if (displayString !== undefined) {
						outputValue = displayString;
						//OLD: HTMLvalue.innerHTML = itemSocket.messageJSON[JSONitem];
					} else {
						;
					}
				} else {
					;
				}
			} else {
				;
			}
		}
		
		// eventually show content 
		if (outputValue !== false) {
			return outputValue;
		}
	}
}


/** 
 * Scan a function to find any possibile binding to another sObject and save it to an array to be returned
 * 
 * @param binding   a user defined function already parsed to string
 * @return bindingPath    array of possible sObject found in binding function
 * @example _extractBinding(bindingFunction.toString());
 */
function _extractBinding(binding) {
	// check if something similar to subBinding is found
	var subBindings = binding.match(REGSUBBINDING);
	
	var bindingPath = new Array();		
	// for each possible _sObject
	for (var str in subBindings) {
		// remove .get()
		var tmpBinding = subBindings[str].replace(REGGET, "");
		
		// put possible _sObject in array in not already contained
		if (bindingPath.indexOf(tmpBinding) === -1) {
			bindingPath.push(tmpBinding);
		}
	}
	
	return bindingPath;
}


/** 
 * Scan the global object and save the name of each Item and ItemAdvanced found. Only Item accessible directly from 
 * global object or contained in an array accessible from global object are found. This function MUST be called only
 * after page has been loaded
 * 
 * @param none
 * @return none
 * @example _findAllItemNames();
 */
function _findAllItemNames() {
	var allItemNames = [];
	var allItemAdvancedNames = [];
	// search through window items
	// TIME: 40ms with chrome 22beta on 4year old notebook; 350ms with android 2.3.6 on HTC Google Nexus One
	for (var object in window) {
		// if an instance of item is found save its name
		if (window[object] instanceof Item) {
			var thisItem = window[object];

			if (items.indexOf(thisItem) !== -1) {
				allItemNames.push(object);
			}
		}
		// if an instance of ItemAdvanced is found save its name
		else if (_checkItemAdvanced(window[object])) {
			var thisItemAdvanced = window[object];

			if (itemsAdvanced.indexOf(thisItemAdvanced) !== -1) {
				allItemAdvancedNames.push(object);
			}
		}
		// if an instance of ItemSocket is found save its name
		else if (window[object] instanceof ItemSocket) {
			var thisItemSocket = window[object];
			
			if (itemSocket.indexOf(thisItemSocket) !== -1) {
				itemSocketNames.push(object);
			}
		}
		// if an array containing items is found save each element's name
		else if (window[object] instanceof Array && window[object].length > 0 && window[object] !== items && window[object][0] instanceof Item) {
			var thisArrayOfItem = window[object];
			
			for (var elem in thisArrayOfItem) {
				var thisItemArray = thisArrayOfItem[elem];
				
				if (items.indexOf(thisItemArray) !== -1) {
					allItemNames.push(object+"["+elem+"]");
				}
			}
				
		}
		// if an array containing ItemAdvanced is found save each element's name
		else if (window[object] instanceof Array && window[object].length > 0 && window[object] !== itemsAdvanced && _checkItemAdvanced(window[object][0])) {
			var thisArrayOfItemAdvanced = window[object];
			
			for (var elem in thisArrayOfItemAdvanced) {
				var thisItemAdvanceArray = thisArrayOfItemAdvanced[elem];
				
				if (itemsAdvanced.indexOf(thisItemAdvanceArray) !== -1) {
					allItemAdvancedNames.push(object+"["+elem+"]");
				}
			}
				
		}
		// if an array containing ItemSocket is found save each element's name
		else if (window[object] instanceof Array && window[object].length > 0 && window[object] !== itemSocket && window[object][0] instanceof ItemSocket) {
			var thisArrayOfItemSocket = window[object];
			
			for (var elem in thisArrayOfItemSocket) {
				var thisItemSocketArray = thisArrayOfItemSocket[elem];
				
				if (itemSocket.indexOf(thisItemSocketArray) !== -1) {
					itemSocketNames.push(object+"["+elem+"]");
				}
			}
				
		}
	}
	
	itemsAdvancedNames = allItemAdvancedNames;
	itemNames = allItemNames;
	
	return;
}


/** 
 * scan each sObject of an item adds binding dependencies to item used by any binding used in this item
 * 
 * @param thisItem   an item
 * @return none
 * @example _defineBindings(myItem);
 */
function _defineBindings(thisItem) {
	var checkedItems = new Array();
	// for each attribute
	for (var attr in thisItem) {
		var thisSubItem = thisItem[attr];
		// check if it's a sObject
		if (_checkSObject(thisSubItem)) {
			// assign name of the parent
			thisSubItem.fatherName = thisItem.name;			
			// if item is binded
			if (thisSubItem.binded === true) {
				// for each binding path
				for (var tarit in thisSubItem.bindingPath) {
					var target = thisSubItem.bindingPath[tarit];
					// extract referenced item name
					var pointPos = target.search(REGPOINT);
	            	if (pointPos != -1) {
	                    var refItemName = target.substring(0, pointPos);
	                    
	                    // check if item is in array
	                    var isArray = (target.search(REGLONGARRAY) !== -1);
	                    var arrayRefItemName = new Array();
	                    // if in array
	                    if (isArray) {
	                    	// extract array
	                    	var arrayNameEnd = target.search(REGOPENSB);
	                    	var arrayName = target.substring(0, arrayNameEnd);
	                    	                   	
	                    	// check if a valid array
	                    	if (checkedItems.indexOf(arrayName) === -1 && typeof(window[arrayName]) === 'object') {
	                    		var thisArray = window[arrayName];
	                    		// signals array has been checked
	                    		checkedItems.push(arrayName); 
	                    		// for every object in array
	                    		for (var elem in thisArray) {
	                    			var thisReferencedItem = thisArray[elem];
	                    			// if it's an Item
	                    			if (thisReferencedItem instanceof Item){
	                    				if (thisReferencedItem.bindingRef.indexOf(thisItem.name) === -1) {
				                    		thisReferencedItem.bindingRef.push(thisItem.name);
				                    	}
	             	      			}
	                    		}
	                    	}
	                    }
	                    // if not in array
	                    else {
	                    	// extract item
	                    	var thisReferencedItem = _extractItem(refItemName);
	                    	
	                    	// check if it's a valid item
		                    if (checkedItems.indexOf(refItemName) === -1 && thisReferencedItem) {
		                    	// signals array has been checked
		                    	checkedItems.push(refItemName); 
		                    	// check if item is already in bindingRef array and eventually add it
		                    	if (thisReferencedItem.bindingRef.indexOf(thisItem.name) === -1) {
		                    		thisReferencedItem.bindingRef.push(thisItem.name);
		                    	}
		                    	
		                    }
	                    }
	                }
	            }
	        }
	        
	        // else if item has binding to ItemSocket
			else if (thisSubItem.bindedSocket === true) {
				// if binded simply to itemsocket
				if (typeof(thisSubItem.bindingPathSocket) === 'string') {
					// extract itemSocket
					var itemSocket = _extractItemSocket(thisSubItem.bindingPathSocket);
				}
				// if binded to a JSON object from itemsocket
				else {
					// extract itemSocket
					var itemSocket = _extractItemSocket(thisSubItem.bindingPathSocket[0]);
				}
				
				// if itemSocket exists set bindingRef
				if (itemSocket && itemSocket.bindingRef.indexOf(thisItem.name) === -1) {
					itemSocket.bindingRef.push(thisItem.name);
				}
			}
	        
	    }
	}
}


/** 
 * _extractItem check if exists a valid item with that name; retur corresponding item or false if it doesn't exists 
 * 
 * @param itemName to manipulate
 * @return an array made by array name and array position/location
 * @example _reDraw(myItem.name);
 */
function _extractItem(itemName){
	// extract item
	var thisItem = false;
	
	if (typeof(window[itemName]) !== 'undefined' && window[itemName] instanceof Item) {
		thisItem = window[itemName];
	}
	else {
		
		var findOpenSb = itemName.search(REGOPENSB);
	 	if (findOpenSb !== -1 && itemName.search(REGCLOSESB) !== -1) {
	 		// find array name and array position
	 		var findCloseSb = itemName.search(REGCLOSESB);
	 		var itemArrayName = itemName.substring(0, findOpenSb);
			var itemArrayPos = itemName.substring(findOpenSb+1, findCloseSb);
			
			if (typeof(window[itemArrayName][itemArrayPos]) !== 'undefined' && window[itemArrayName][itemArrayPos] instanceof Item) {
				thisItem = window[itemArrayName][itemArrayPos];
			}			
		}
	}
	
	return thisItem;
}


/** 
 * _extractDate check if rawDate is a valid date and return false if not, date formatted as yyyy-mm-dd if valid
 * 
 * @param rawDate to check
 * @return false or string yyyy-mm-dd
 * @example _extractDate("20/06/2012");
 */
function _extractDate(rawDate){
	// check if input date is a string
	if (typeof(rawDate) == 'string') {
		// check if a valid year is present
		var validYearPos = rawDate.search(REGDATE);
		if (validYearPos !== -1) {
			// separate cases where year is in first position between year in last position 
			if (validYearPos === 0 && ( (rawDate.search(REGDATEBACKSLASH1) !== -1) || (rawDate.search(REGDATEMINUS1) !== -1) )) {
				var year = rawDate.substring(0, 4);
				var month = rawDate.substring(5, 7);
				var day = rawDate.substring(8, 10);
			} else if (validYearPos === 6 && ( (rawDate.search(REGDATEBACKSLASH2) !== -1) || (rawDate.search(REGDATEMINUS2) !== -1) )) {
				var year = rawDate.substring(6, 10);
				var month = rawDate.substring(3, 5);
				var day = rawDate.substring(0, 2);
			} else {
				return false;
			}
			var monthNum = parseInt(month);
			var yearNum = parseInt(year);
			// if month is correct
			if (monthNum>0 && monthNum<13) {
				// define max day number
				var maxDay = 31;
				if (monthNum === 4 || monthNum === 6 || monthNum === 9 || monthNum === 11) {
					maxDay = 30;
				} else if  (monthNum === 2) {
					// check if "bisestile"
					if ( ((yearNum % 4 === 0) && !(yearNum % 100 === 0) ) || (   (yearNum % 100 === 0) && (yearNum % 400 === 0)  ) ) {
						maxDay = 29;
					} else {
						maxDay = 28;
					}
				}
				// check if day is correct
				if (parseInt(day) < maxDay) {
					return year+"-"+month+"-"+day;
				}
			}
		}
	}
	
	return false;
}


/** 
 * Extract strings from an object made by
 * 
 * @param objIn   a number of strings and arrays containtg strings or an object made by a number of strings and arrays containtg strings
 * @return   boolean to signals if assignement failed or not 
 * @example   _attachExtractNamesToArray("myItemName1", ["myItemName2", "myItemName3"], "myItemName4");
 */
function _attachExtractNamesToArray(objIn) {
	// check if arguments has been passed
    if (arguments.length < 1) {
        errore("_attachExtractNamesToArray", INTERNAL_NOARGS, "insufficient input arguments");
        return false;
    }
    // if at least 1 input arguments
    else {
    	// if only an array is passed, transform it to default arguments
    	if (arguments.length === 1 && typeof(objIn) === 'object') {
    		arguments = objIn;
    	}
    	
    	var arrayToReturn = [];
    	// extract each string
    	for (var elem in arguments) {
    		var thisElem = arguments[elem];
    		if (typeof(thisElem) === 'string') {
    			arrayToReturn.push(thisElem)
    		} else if (typeof(thisElem) === 'object' && thisElem.length > 0) {
    			for (var selem in thisElem) {
    				var subElem = thisElem[selem];
    				
    				if (typeof(subElem) === 'string') {
    					arrayToReturn.push(subElem);
    				} else {
    					errore("_attachExtractNamesToArray", WARNING, subElem+" is not a valid string");
    				}
    			}
    			
    		} else {
    			errore("_attachExtractNamesToArray", WARNING, thisElem+" is not a valid string");
    		}
    	}
    	
    	// check if something has been found
    	if (arrayToReturn.length > 0) {
    		return arrayToReturn;
    	} else {
    		return false;
    	}
    	
    }
}


/** 
 * If at runtime, manage attachment of one or more item to another existing item
 * 
 * @param commandIn   type of attachment: after, before, ... 
 * @param itemParent   an item (or its name) of an already displayed item
 * @param arrayItemsSon   array made by valid items to attach
 * @return   boolean to signals if assignement failed or not 
 * @example   _attachItemAndItem("after", myItemAlreadyDisplayed, [myItem2Draw1, myItem2Draw2]);
 */
function _attachItemAndItem(commandIn, itemParent, arrayItemsSon) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 3) {
	        errore("_attachItemAndItem", INTERNAL_NOARGS, "insufficient input arguments");
	        return false;
        }
        // if at least 3 input arguments
        else {
        	// if itemParent is a string extract it
        	if (typeof(itemParent) === 'string') {
        		// extract item
        		itemParent = _extractItem(itemParent);
        	}
        	
        	// check if itemParent is a valid item and is already drawn
        	if ((typeof(itemParent) === 'object') && (itemParent instanceof Item) && (itemsToDraw.indexOf(itemParent.name) !== -1)) {
        		return _attachItemAndId(commandIn, itemParent.name, arrayItemsSon);
        	} else {
        		return false;
        	}
        }
	}
	// if not at runtime signals error
	else {
		errore("_attachItemAndItem", CALLTIME, "this function could be used only at runtime.");
		return false;
	}
}


/** 
 * If at runtime, manage attachment of one or more item to an HTML element
 * 
 * @param commandIn   type of attachment: after, before, ... 
 * @param idParent   id of a valid HTML element
 * @param arrayItemsSon   array made by valid items to attach
 * @return   boolean to signals if assignement failed or not 
 * @example   _attachItemAndId("after", "elementId", [myItem2Draw1, myItem2Draw2]);
 */
function _attachItemAndId(commandIn, idParent, arrayItemsSon) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 3) {
	        errore("_attachItemAndId", INTERNAL_NOARGS, "insufficient input arguments");
	        return false;
        }
        // if at least 3 input arguments
        else {
        	// check input values
        	if (typeof(commandIn) === 'string' && (commandIn === "after" || commandIn === "before" || commandIn === "inside")) {
				// check idParent type
				if (typeof(idParent) === 'string') {
					// extract HTML element with this id exists
					var HTMLparent = document.getElementById(idParent);	
					// iterate over every element to draw
					for (var elem in arrayItemsSon){
						var thisItem = arrayItemsSon[elem];
						
						// create HTML element
						var HTMLnewItem = document.createElement("section");
						HTMLnewItem.setAttribute("id", thisItem.name);
						
						// attach element depending on commandIn
						if (commandIn == "after") {
							// attach element
							if (HTMLparent.nextSibling) {
								HTMLparent.parentNode.insertBefore(HTMLnewItem, HTMLparent.nextSibling);
							}
							else {
								HTMLparent.parentNode.appendChild(HTMLnewItem);
							}
						} else if (commandIn == "before") {
							HTMLparent.parentNode.insertBefore(HTMLnewItem, HTMLparent);
						} else if (commandIn == "inside") {
							HTMLparent.appendChild(HTMLnewItem);
						}
						
				        // add item name to array of item to draw
				        itemsToDraw.push(thisItem.name);
				        
				        // add a reference to items created at runtime
				        itemsLive.push(thisItem);
				        
				        // verify and redefine binding
				        for (var it in items) {
				        	_defineBindings(items[it]);
				        }

				        // draw item
				        _reDraw(thisItem);				        
					}
					
					return true;
					
				}
				// signals wrong id type
				else {
					errore("_attachItemAndId", INTERNAL_WRONGARGS, "wrong HTML element id, it's not a string");
	        		return false;
				}
				
			}
			// signals wrong command
			else {
				errore("_attachItemAndId", INTERNAL_WRONGARGS, "wrong comand, "+commandIn+" is not a valid command");
		        return false;
			}
		}
	}
	// if not at runtime signals error
	else {
		errore("_attachItemAndId", CALLTIME, "this function could be used only at runtime.");
		return false;
	}
}




/** 
 * If at runtime, check if strings passed are item's name
 * 
 * @param arrayItems   an array of item's names
 * @return   array of extracted item or false if no valid has been found
 * @example   _extractItemsToAppend(["itemName1", "itemName2"]);
 */
function _extractItemsToAppend(arrayItems) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 1) {
	        errore("_extractItemsToAppend", INTERNAL_NOARGS, "insufficient input arguments, an array of item's name is required");
	        return false;
        }
        // if arguments are good
        else {
        	// check if input argument is an array
        	if (typeof(arrayItems) === 'object' && arrayItems.length) {
        		var arrayValidItems = [];
        		// iterate over each element to extract item, assign its name and return an array of valid items
        		for (var elem in arrayItems) {
   					var stringItem = arrayItems[elem];
   					
   					// check if element is a string
   					if (typeof(stringItem) === 'string') {
   						var thisItem = _extractItem(stringItem);
   						
       					// check if thisItem is a valid item
       					if (thisItem instanceof Item) {
       						// assign to item its name
       						thisItem.name = stringItem;
       						
       						// check if it has already a corresponding HTML elem, else add it to valid items
       						if (itemsToDraw.indexOf(stringItem) === -1) {
       							arrayValidItems.push(thisItem);
       						} else {
       							errore("_extractItemsToAppend", WARNING, stringItem+" has already been drawn");
       						}	
       					}
       					// if not instance of item signals warning
       					else {
       						errore("_extractItemsToAppend", WARNING, stringItem+" could not be attached because it appears not to be an item");
       					}
   					}
   					// signals that stringItem is not a string
   					else {
   						errore("_extractItemsToAppend", WARNING, stringItem+" is not a string representing an Item reacheable from window");
   					}
       			}
       			
       			// check if something valid to return has been found, else return false
       			if (arrayValidItems.length > 0) {
       				return arrayValidItems;
       			} else {
       				errore("_extractItemsToAppend", INTERNAL_WRONGARGS, "no valid item(s) to draw");
       				return false;
       			}
        	}
        	// signals wrong input type
        	else {
        		errore("_extractItemsToAppend", INTERNAL_WRONGARGS, "input must be an array of item's names");
        		return false;
        	}
        }
	}
	// if not at runtime signals error
	else {
		errore("_extractItemsToAppend", CALLTIME, "this function could be used only at runtime");
		return false;
	}
}


/**
 * creates and appends default styles to HTML page
 */
function _addStyle() {
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = '.H5_invisible { display: none; }';
	// style.innerHTML = '.H5_invisible { visibility: hidden; width: 0; height: 0; margin: 0; padding: 0; border: 0; }';
	document.getElementsByTagName('head')[0].appendChild(style);
}


/**
 * remove a class ftom an HTML element
 */
function _removeClass(ele,cls) {
	if (_hasClass(ele,cls)) {
    	var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		ele.className=ele.className.replace(reg,' ');
	}
}


/**
 * verify if an HTML element has a class
 */
function _hasClass(ele,cls) {
	return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}


/**
* Calculate the distance in days from 2 dates.
* 
* @param dateFirst   the first date
* @param dateLast   the second date
* @return number of days that represent the distance between first and second date
* @example _dateDistance("12-03-2011", "24-07-2012");
*/
function _dateDistance(dateFirst, dateLast) {
	// check if arguments has been passed
    if (arguments.length < 2) {
        errore("_dateDistance", NOARGS, "insufficient input arguments");
        return false;
    }
    // if at least 1 input arguments
    else {
    	// check if argument types is correct
    	if (typeof(dateFirst) === "string" && typeof(dateLast) === "string") {
    		var data1 = _extractDate(dateFirst);
    		var data2 = _extractDate(dateLast);
    		
    		// check if dates are ok
    		if (data1 && data2) {
    			var data1Array = extractNumberFromDate(data1);
    			var data2Array = extractNumberFromDate(data2);
    			
    			var diffDay = data2Array[0] - data1Array[0];
    			var diffMonth = data2Array[1] - data1Array[1];
    			var diffYear = data2Array[2] - data1Array[2];
    			
    			if (diffMonth > 0) {
    				diffDay += diffMonth*30;
    			}
    			
    			if (diffYear > 0) {
    				diffDay += diffMonth*365;
    			}
    			
    			return diffDay;
    		}
    		// eventually signals wrong dates
	    	else {
	    		errore("_dateDistance", WRONGARGS, "dates are wrong");
	        	return false;
	    	}
    	}
    	// eventually signals wrong input type
    	else {
    		errore("_dateDistance", WRONGARGS, "wrong arguments type");
        	return false;
    	}
    }
}


/**
* Calculate the date i get by taking a date and summing up a number of days
* 
* @param date   the date to wich summing up days
* @param days   number of days to sum
* @return a new date that is the sum between old day and number of days
* @example _dateSumDay("12-03-2011", 54);
*/
function _dateSumDay(date, days) {
	// check if arguments has been passed
    if (arguments.length < 2) {
        errore("_dateSumDay", NOARGS, "insufficient input arguments");
        return false;
    }
    // if at least 1 input arguments
    else {
    	// check if argument types is correct
    	if (typeof(date) === "string" && typeof(days) === "number") {
    		var dataChecked = _extractDate(date);
    		
    		// check if date is ok
    		if (dataChecked) {
    			var dataArray = extractNumberFromDate(dataChecked);
    			
    			dataArray[0] += days;
    			if (dataArray[0] / 365 >= 1) {
    				dataArray[2] += parseInt(dataArray[0] / 365);
    				dataArray[0] = dataArray[0] % 365;
    			}
    			
    			if (dataArray[0] / 30 >= 1) {
    				dataArray[1] += parseInt(dataArray[0] / 30);
    				dataArray[0] = dataArray[0] % 30;
    			}
    			
    			dataArray[1] = dataArray[1].toString();
    			dataArray[0] = dataArray[0].toString();
    			
    			if (dataArray[1].length < 2) {
    				dataArray[1] = "0" + dataArray[1];
    			}
    			
    			if (dataArray[0].length < 2) {
    				dataArray[0] = "0" + dataArray[0];
    			}
    			
    			return dataArray[2]+"-"+dataArray[1]+"-"+dataArray[1];
    		}
    		// eventually signals wrong date
	    	else {
	    		errore("_dateSumDay", WRONGARGS, "date is wrong");
	        	return false;
	    	}
    	}
    	// eventually signals wrong input type
    	else {
    		errore("_dateSumDay", WRONGARGS, "wrong arguments type");
        	return false;
    	}
    }
}



// *********** ADVANCED ITEMS MANAGING ********** //
// XXX: segnaposto per aptana

var ADVANCEDITEMS = true;
var itemsAdvanced = [];
var itemsAdvancedNames = [];
var itemsAdvancedLive = [];

var itemSocket = [];
var itemSocketNames = [];


/**
* ItemMap is the map element of this library.
* 
* @return ItemMap   Returns a new ItemMap.
*/
function ItemMap(objIn) {
	// create array of referenced binding
	this.bindingRef = [];
	
	// add attribute to signal that it's an advanced item
	this.classAttribute = "ItemAdvanced ItemMap";
	
	// check if something passed as initialization argument
	if (objIn !== undefined){
		// set type
		if (objIn['type'] !== undefined) {
			this.setType(objIn['type']);
		} else {
			this.setType('coordinates');
		}
		
		// set coordinates
		if (objIn['coordinates'] !== undefined) {
			this.setCoordinates(objIn['coordinates'][0], objIn['coordinates'][1]);
		}
		
		// set position
		if (objIn['position'] !== undefined) {
			this.setPosition(objIn['position']);
		}
		
		// set latitude
		if (objIn['latitude'] !== undefined) {
			this.setLatitude(objIn['longitude']);
		} else {
			if (objIn['coordinates'] !== undefined) {
				this.setLatitude(45.477835);
			}
		}
		
		// set longitude
		if (objIn['longitude'] !== undefined) {
			this.setLongitude(objIn['longitude']);
		} else {
			if (objIn['coordinates'] !== undefined) {
				this.setLongitude(9.234774);
			}
		}
		
		// set zoom
		if (objIn['zoom'] !== undefined) {
			this.setZoom(objIn['zoom']);
		}
		
		// set showCommand
		if (objIn['command'] !== undefined) {
			this.setCommand(objIn['command']);
		} else {
			this.setCommand(false);
		}
		
		// set modifiable
		if (objIn['modifiable'] !== undefined) {
			this.setModifiable(objIn['modifiable']);
		} else {
			this.setModifiable(true);
		}
		
		// set hide update
		if (objIn['hideUpdate'] !== undefined) {
			this.hideUpdate(objIn['modifiable']);
		}
		
		// set dimension
		if (objIn['width'] !== undefined) {
			this.setWidth(objIn['width']);
		} else {
			this.setWidth(300);
		}
		if (objIn['height'] !== undefined) {
			this.setHeight(objIn['height']);
		} else {
			this.setHeight(300);
		}
		if (objIn['dimension'] !== undefined) {
			this.setDimension(objIn['dimension']);
		}
		
		// set multi points
		
	}
	// if no objInt
	else {
		this.setType('coordinates');
		this.setCoordinates(45.477835, 9.234774);
		this.setCommand(false);
		this.setModifiable(true);
		this.setDimension(300, 230);
	}
	
	// save a reference to this object in a global variable
	itemsAdvanced.push(this);
		
	return this; 	
}


/**
* Hide update button for the itemMap
* 
* @param hide   boolean to set hidding on/off (default is on)
* @return ItemMap   Returns this itemMap.
* @example myItemMap.hideUpdate(true);
*/
ItemMap.prototype.hideUpdate = function(hide) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("hideUpdate", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(hide) === 'boolean' || (typeof(hide) === 'string' && (hide === 'true' || hide === 'false') )) {
    		if (typeof(hide) === 'string') {
    			if (hide === 'true') {
    				hide = true;
    			} else if (hide === 'false') {
    				hide = false;
    			}
    		}
    		
    		this.updateHidden = hide;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("hideUpdate", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make hideUpdate property non enumerable
Object.defineProperty(ItemMap.prototype, "hideUpdate", {enumerable: false});


/**
* add a new position for an itemMap of type "multi"
* 
* @param address   position to be added (name, not coordinates)
* @return ItemMap   Returns this itemMap.
* @example myItemMap.addPosition("via Golgi 20, Milano");
*/
ItemMap.prototype.addPosition = function(address) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("addPosition", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(address) === 'string') {
    		// check item type and eventually set it up
    		if (this.type !== 'multi') {
    			this.type = 'multi';
    			if (this.addresses === undefined) {
    				this.addresses = [];
    			}
    		}
    		
    		this.addresses.push(address);
    		
    		// check if multiple arguments
    		if (arguments.length > 1) {
    			delete arguments[0];
    			
    			for (var elem in arguments) {
    				var thisAddress = arguments[elem];
    				
    				if (typeof(thisAddress) === 'string') {
    					this.addresses.push(thisAddress);
    				}
    			}
    		}
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("addPosition", WRONGARGS, "wrong input argument");
        }
    }

    return this;
}
// Make addPosition property non enumerable
Object.defineProperty(ItemMap.prototype, "addPosition", {enumerable: false});


/**
* remove a position for an itemMap of type "multi"
* 
* @param numberIn    (optionl) number of positions to remove
* @return this itemMap.
* @example removePosition.addPosition();
* @example removePosition.addPosition(3);
*/
ItemMap.prototype.removePosition = function(numberIn) {
	// check input
	if (this.type === 'multi') {
		if (this.addresses.length > 0) {
			// if input arguments
			if (numberIn !== undefined && typeof(parseInt(numberIn)) === 'number') {
				var number = parseInt(numberIn);
				// remove the specified number of elements if possible
				if (this.addresses.length >= number) {
					for (var i = 0; i<number; i++) {
						this.addresses.pop();
					}
				} else {
					errore("removePosition", WARNING, "can't remove "+number+" elements, all available are removed");
					this.addresses = [];
				}
			}
			// if no input arguments
			else {
				this.addresses.pop();
			}
		} else {
			errore("removePosition", WARNING, "itemMap has no location to remove");
		}
	}
    // signals error if wrong input type or unknown string
    else {
        errore("removePosition", WARNING, "removePosition can't be called on this type of ItemMap");
        return this;
    }
        
    return this;
}
// Make removePosition property non enumerable
Object.defineProperty(ItemMap.prototype, "removePosition", {enumerable: false});


/**
* set type of itemMap
* 
* @param type    type of itemMap
* @return this itemMap.
* @example ItemMap.setType('coordinates');
*/
ItemMap.prototype.setType = function(type) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setType", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(type) === 'string' && (type === 'map' || type === 'position' || type === 'coordinates' || type === 'coord' || type === 'multi')) {
    		this.type = type;
    		
    		if (type === 'multi') {
    			this.addresses = [];
    		}
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setType", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make setType property non enumerable
Object.defineProperty(ItemMap.prototype, "setType", {enumerable: false});


/** 
 * Decide if ItemMap is modifiable directly from HTML interface.
 * 
 * @param editable    boolean indicating if value is modifiable
 * @return itemMap     Returns this itemMap
 * @example myItemMap.setModifiable(true);
 */
ItemMap.prototype.setModifiable = function(editable) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setModifiable", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(editable) === 'boolean' || (typeof(editable) === 'string' && (editable === 'true' || editable === 'false') )) {
    		if (typeof(editable) === 'string') {
    			if (editable === 'true') {
    				editable = true;
    			} else if (editable === 'false') {
    				editable = false;
    			}
    		}
    		this.modifiable = editable;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setModifiable", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make setModifiable property non enumerable
Object.defineProperty(ItemMap.prototype, "setEditable", {enumerable: false});


/** 
 * set width property of HTML iframe.
 * 
 * @param width    new width
 * @return itemMap     Returns this itemMap
 * @example myItemMap.setWitdh(300);
 */
ItemMap.prototype.setWitdh = function(width) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setWitdh", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(width) === 'number') {
    		this.width = width;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setWitdh", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
Object.defineProperty(ItemMap.prototype, "setWitdh", {enumerable: false});



/** 
 * set height property of HTML iframe.
 * 
 * @param height    new height
 * @return itemMap     Returns this itemMap
 * @example myItemMap.setHeight(200);
 */
ItemMap.prototype.setHeight = function(height) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setHeight", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(height) === 'number') {
    		this.height = height;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setHeight", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
Object.defineProperty(ItemMap.prototype, "setHeight", {enumerable: false});


/** 
 * set height an width property property of HTML iframe.
 * 
 * @param width    new width
 * @param height    new height
 * @return itemMap     Returns this itemMap
 * @example myItemMap.setDimension(300, 200);
 */
ItemMap.prototype.setDimension = function(width, height) {
    // check if any arguments has been passed
    if (arguments.length < 2) {
        errore("setDimension", NOARGS, "insufficient input arguments, 2 numbers are needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(height) === 'number' && typeof(width) === 'number') {
    		this.height = height;
    		this.width = width;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setDimension", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
Object.defineProperty(ItemMap.prototype, "setDimension", {enumerable: false});


/**
* set position for an itemMap of type "map" or "position"
* 
* @param position   position to be set (name, not coordinates)
* @return ItemMap   Returns this itemMap.
* @example myItemMap.setPosition("via Golgi 20, Milano");
*/
ItemMap.prototype.setPosition = function(position) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setPosition", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(position) === 'string') {
    		this.position = position;
    		
    		// eventually set correct type
	    	if (this.type !== 'map' && this.type !== 'position') {
	    		this.type = 'map';
	    	}
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setPosition", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
Object.defineProperty(ItemMap.prototype, "setPosition", {enumerable: false});
// add also name setLon as equivalent
ItemMap.prototype.setPos = ItemMap.prototype.setPosition;
Object.defineProperty(ItemMap.prototype, "setPos", {enumerable: false});


/** 
 * set latitude for ItemMap with type "multi".
 * 
 * @param latitude    new latitude
 * @return itemMap     Returns this itemMap
 * @example myItemMap.setLatitude(42.554822);
 */
ItemMap.prototype.setLatitude = function(latitude) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setLatitude", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(latitude) === 'number') {
    		this.latitude = latitude;
    		// eventually set correct type
	    	if (this.type !== 'coordinates' && this.type !== 'coord') {
	    		this.type = 'coordinates';
	    	}
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setLatitude", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
Object.defineProperty(ItemMap.prototype, "setLatitude", {enumerable: false});
// add also name setLat as equivalent
ItemMap.prototype.setLat = ItemMap.prototype.setLatitude;
Object.defineProperty(ItemMap.prototype, "setLat", {enumerable: false});


/** 
 * set longitude property for ItemMap with type "multi".
 * 
 * @param longitude    new longitude
 * @return itemMap     Returns this itemMap
 * @example myItemMap.setLongitude(42.554822);
 */
ItemMap.prototype.setLongitude = function(longitude) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setLongitude", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(longitude) === 'number') {
    		this.longitude = longitude;
    		// eventually set correct type
	    	if (this.type !== 'coordinates' && this.type !== 'coord') {
	    		this.type = 'coordinates';
	    	}
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setLongitude", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
Object.defineProperty(ItemMap.prototype, "setLongitude", {enumerable: false});
// add also name setLon as equivalent
ItemMap.prototype.setLon = ItemMap.prototype.setLongitude;
Object.defineProperty(ItemMap.prototype, "setLon", {enumerable: false});


/** 
 * set latitude and longitude for ItemMap with type "multi".
 * 
 * @param lat    new latitude
 * @param lon    new longitude
 * @return itemMap     Returns this itemMap
 * @example myItemMap.setCoordinates(12.554822, 42.554822);
 */
ItemMap.prototype.setCoordinates = function(lat, lon) {
    // check if any arguments has been passed
    if (arguments.length < 2) {
        errore("setCoordinates", NOARGS, "insufficient input arguments, 2 numbers are required");
        return this;
    // if at least 2 argument in input
    } else {
    	// check input
    	if (typeof(lat) === 'number' && typeof(lon) === 'number') {
    		this.setLatitude(lat);
    		this.setLongitude(lon);
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setCoordinates", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
Object.defineProperty(ItemMap.prototype, "setCoordinates", {enumerable: false});
// add also name setCoord as equivalent
ItemMap.prototype.setCoord = ItemMap.prototype.setCoordinates;
Object.defineProperty(ItemMap.prototype, "setCoord", {enumerable: false});


/** 
 * set zoom of an ItemMap.
 * 
 * @param zoom    zoom level (1-19)
 * @return itemMap     Returns this itemMap
 * @example myItemMap.setZoom(12);
 */
ItemMap.prototype.setZoom = function(zoom) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setZoom", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(zoom) === 'number') {
    		this.zoom = zoom;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setZoom", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
Object.defineProperty(ItemMap.prototype, "setZoom", {enumerable: false});


/** 
 * define if HTML element corresponding to ItemMap must show command or not.
 * 
 * @param commandBoolen    true/false to show/not show command (default is false)
 * @return itemMap     Returns this itemMap
 * @example myItemMap.setCommand(true);
 */
ItemMap.prototype.setCommand = function(commandBoolen) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("commandBoolen", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(commandBoolen) === 'boolean' || (typeof(commandBoolen) === 'string' && (commandBoolen === 'true' || commandBoolen === 'false') )) {
    		if (typeof(commandBoolen) === 'string') {
    			if (commandBoolen === 'true') {
    				commandBoolen = true;
    			} else if (commandBoolen === 'false') {
    				commandBoolen = false;
    			}
    		}
    		this.showCommand = commandBoolen;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("commandBoolen", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
Object.defineProperty(ItemMap.prototype, "commandBoolen", {enumerable: false});


/** 
 * Decide if ItemMap must be excluded from visualization
 * 
 * @param invisible    boolean indicating if must be invisible
 * @return ItemMap     Returns this ItemMap
 * @example myItemMap.setInvisible(true);
 */
ItemMap.prototype.setInvisible = function(invisible) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setInvisible", NOARGS, "insufficient input arguments, a boolean is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // check if type is boolean
        if (typeof(invisible) === 'boolean' || invisible == "true" || invisible == "false") {
            if (typeof(invisible) === 'string'){
                if (invisible === "true") {
                    invisible = true;
                } else {
                    invisible = false;
                }
            }
            
            this.invisible = invisible;
        // if another type signals error
        } else {
            errore("setInvisible", WRONGARGS, "wrong argument, only true or false are accepted");
            return this;
        }
        
    }

    return this;
}
// Make setIsInteger property non enumerable
Object.defineProperty(ItemMap.prototype, "setInvisible", {enumerable: false});


/** 
 * Set data binding to destination
 * 
 * @param binding    string defining a binding to a _sString or string representing a position
 * @return ItemMap     Returns this ItemMap
 * @example myItemMap.binding("anotherItem.aString");
 */
ItemMap.prototype.setBinding = function(binding) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setBinding", NOARGS, "insufficient input arguments, at least one binding is required");
        return this;
    // if at least 1 argument in input
    } else {
    	//for (var elem in arguments) 
        // if input is boolean or number signals error
        if (typeof(binding) === 'boolean' || typeof(binding) === 'number') {
            errore("setBinding", WRONGARGS, "wrong argument, number or boolean could not be accepted as binding");  
            return this; 
        // if string
        } else if (typeof(binding) === 'string') {
            // check if binded object is valid: _sString are accepted
            var pointPos = binding.search(REGPOINT);
            if (pointPos != -1) {
                var first = binding.substring(0, pointPos)
                var second = binding.substring(pointPos+1, binding.length);
                
                var thisItem = _extractItem(first);
                if (thisItem){    
                    if (thisItem[second] instanceof _sString) {
                        // set binded and binding
                        this.binded = true;
                        this.binding = thisItem[second];
                        this.modifiable = false;
                        
                        // save binding path
                        this.bindingPath = [binding];
                    // signals error if binded data is not valid type
                    } else {
                        errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a _sString");  
                        return this;
                    }
                } else {
                	errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a valid binding");  
                	return this;
            	}
            // signals error if binded data is not valid type
            } else  {
                errore("setBinding", WRONGARGS, "wrong binding, '"+binding+"' is not a valid _sString");  
                return this;
            } 
          
        // if function
        } else if (typeof(binding) === 'function') {
    		this.binded = true;
    		this.modifiable = false;
            this.binding = binding;
            
            // find possible sObject referenced
			var retBindingPath = _extractBinding(binding.toString());
			
			// add each possible sObject to bindingPath
			this.bindingPath = new Array();	
			for (var sngBind in retBindingPath) {
				this.bindingPath.push(retBindingPath[sngBind]);
			}
        // if object or array
        } else {
            // if array signals error
            if (binding.length) {
                errore("setBinding", WRONGARGS, "wrong argument, array aren't supported, use object or string");  
                return this; 
            // if object, start complex binding
            } else {
                errore("setBinding", WRONGARGS, "object complex bindings not yet implemented");
            }
        }
        
    }

    return this;
}
// Make setBinding property non enumerable
Object.defineProperty(ItemMap.prototype, "setBinding", {enumerable: false});


/** 
 * Set class of corresponding HTML element to style them with css
 * 
 * @param objIn    one or more string that represent a class name
 * @return ItemMap     Returns this ItemMap
 * @example myItemMap.setClass("red");
 */
ItemMap.prototype.setClass = function(objIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setClass", NOARGS, "insufficient input arguments, one or more strings are needed");
        return this;
    // if at least 1 argument in input
    } else {
    	var elemClass = "";
    	// iterate for each input string
    	for (var elem in arguments) {
    		var thisStringIn = arguments[elem];
    		
    		// check if string and eventually add to class string
    		if (typeof(thisStringIn) === 'string') {
    			elemClass += " "+thisStringIn;
    		} else {
    			errore("setClass", WARNING, thisStringIn+" is not a string and couldn't be used as an HTML class value");
    		}
    	}
    	
    	// set attribute classAttribute
    	this.classAttribute = elemClass;
    }

    return this;
}
// Make setIsInteger property non enumerable
Object.defineProperty(ItemMap.prototype, "setClass", {enumerable: false});


/** 
 * Set a label to display in the top of HTML corresponding element
 * 
 * @param label    a string to show as title
 * @return ItemMap     Returns this ItemMap
 * @example myItemMap.setLabel("My tour in Europe");
 */
ItemMap.prototype.setLabel = function(label) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setLabel", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // if input is a string
        if (typeof(label) === 'string' && label != "false") {
            this.label = label;
        }
        // if input is false
        else if (typeof(label) === 'boolean' || (typeof(label) === 'string' && label == "false")) {
            this.label = false;
        }
        // signals a warning for for boolean and numbers
        else if (typeof(label) === 'number' || typeof(label) === 'boolean') {
            errore("setLabel", WARNING, "input should be a string or boolean 'false', not a number");
            this.label = label.toString();
        }
        // error if another type (object)
        else {
            errore("setLabel", WRONGARGS, "wrong input argument, it should be a string");
            return this;
        }
    }

    return this;
}
// Make setLabel property non enumerable
Object.defineProperty(ItemMap.prototype, "setLabel", {enumerable: false});



/**
* ItemImage is the image element of this library. It could represent a single image, multimple images or 
* a carousel of images
* 
* @return ItemImage   Returns a new ItemImage.
*/
function ItemImage(objIn) {
	// create array of referenced binding
	this.bindingRef = [];
	
	// add attribute to signal that it's an advanced item
	this.classAttribute = "ItemAdvanced ItemImage";
	
	// check if something passed as initialization argument
	if (objIn !== undefined){
		// set type
		if (objIn['type'] !== undefined) {
			this.setType(objIn['type']);
		} else {
			this.setType('single');
		}

		// set update visibility
		if (objIn['updateHidden'] !== undefined) {
			this.hideUpdate(objIn['updateHidden']);
		}
	}
	
	// if no objInt
	else {
		this.setType('single');
	}
	
	// save a reference to this object in a global variable
	itemsAdvanced.push(this);
		
	return this; 	
}


/**
* set type of ItemImage
* 
* @param type    type of ItemImage (default is single)
* @return this ItemImage.
* @example myItemImage.setType('multiple');
*/
ItemImage.prototype.setType = function(type) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setType", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(type) === 'string' && (type === 'single' || type === 'multiple' || type === 'carousel')) {
    		this.type = type;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setType", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make setType property non enumerable
Object.defineProperty(ItemImage.prototype, "setType", {enumerable: false});


/**
* set URL of image
* 
* @param urlIn    UTL of image
* @return this ItemImage.
* @example ItemImage.setURL('/img/img12.png');
*/
ItemImage.prototype.setURL = function(urlIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setURL", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(urlIn) === 'string') {
    		this.URL = urlIn;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setURL", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make setURL property non enumerable
Object.defineProperty(ItemImage.prototype, "setURL", {enumerable: false});


/**
* and a new URL of an image to ItemImage of type "multiple" or "carousel"
* 
* @param urlIn    UTL of a new image
* @return this ItemImage.
* @example ItemImage.addURL('/img/img12.png');
*/
ItemImage.prototype.addURL = function(urlIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("addURL", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(urlIn) === 'string') {
    		// check image type
    		if (this.type !== 'carousel') {
    			this.type = 'carousel';
    		}
    		
    		// eventually add array to contain images
    		if (this.URLs === undefined) {
    			this.URLs = [];
    		}
    		
    		for (var elem in arguments) {
    			var thisURL = arguments[elem];
    			
    			if (typeof(thisURL) === 'string') {
    				this.URLs.push(thisURL);
    			} else {
    				errore("addURL", WRONGARGS, "only string URL are accepted");
    			}
    		}
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("addURL", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make addURL property non enumerable
Object.defineProperty(ItemImage.prototype, "addURL", {enumerable: false});


/**
* remove one or more image from ItemImage of type "multiple" or "carousel"
* 
* @param urlIn    (optional) number of image to be removed
* @return this ItemImage.
* @example ItemImage.removeURL();
* @example ItemImage.removeURL(4);
*/
ItemImage.prototype.removeURL = function(urlIn) {
	// check item type
	if (this.type === 'carousel' && this.URLs !== undefined) {
		// check if any element in list of URLs
		if (this.URLs.length > 0) {
			// check if a number in input
			if (urlIn !== undefined && typeof(urlIn) === 'number') {
				if (this.URLs.length < urlIn) {
					for (var i = 0; i < urlIn; i++) {
						this.URLs.pop();
					}
				} else {
					errore("removeURL", WARNING, "only "+this.URLs.length+" URLs, can't delete "+urlIn);
					this.URLs = [];
				}
			}
			// if no input arguments
			else {
				this.URLs.pop();
			}
		}
		// signals empty URLs
		else {
			errore("removeURL", WARNING, "no remaining URLs to remove");
		}
	}
	// signals wrong item type
	else {
		errore("removeURL", WARNING, "function could be called only on carousel itemimage");
	}
	
    return this;
}
// Make removeURL property non enumerable
Object.defineProperty(ItemImage.prototype, "removeURL", {enumerable: false});


/**
* set delay time in ItemImage of type "carousel"
* 
* @param delay    seconds between an image and another
* @return this ItemImage.
* @example ItemImage.setDelay(4);
*/
ItemImage.prototype.setDelay = function(delay) {
	// check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setDelay", NOARGS, "insufficient input arguments, a number is needed");
        return this;
    }
    // if at least 1 argument in input
    else {
    	// check input type
    	if (typeof(delay) === 'number') {
    		this.delay = delay;
    	}
    	// signals wrong input type
    	else {
    		errore("setDelay", WRONGARGS, "wrong input argument, a number is needed");
    	}
    }
}
// Make setDelay property non enumerable
Object.defineProperty(ItemImage.prototype, "setDelay", {enumerable: false});


/**
* Hide update button for the itemImage
* 
* @param invisible   boolean to set hidding on/off (default is on)
* @return ItemImage   Returns this itemImage.
* @example myItemImage.hideUpdate(true);
*/
ItemImage.prototype.hideUpdate = function(invisible) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("hideUpdate", NOARGS, "insufficient input arguments, a boolean is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // check if type is boolean
        if (typeof(invisible) === 'boolean' || invisible == "true" || invisible == "false") {
            if (typeof(invisible) === 'string'){
                if (invisible === "true") {
                    invisible = true;
                } else {
                    invisible = false;
                }
            }
            
            this.updateHidden = invisible;
        // if another type signals error
        } else {
            errore("hideUpdate", WRONGARGS, "wrong argument, only true or false are accepted");
            return this;
        }
        
    }

    return this;
}
// Make hideUpdate property non enumerable
Object.defineProperty(ItemImage.prototype, "hideUpdate", {enumerable: false});


/** 
 * Decide if ItemImage must be excluded from visualization
 * 
 * @param invisible    boolean indicating if must be invisible
 * @return ItemImage     Returns this ItemImage
 * @example myItem.myItemImage.setInvisible(true);
 */
ItemImage.prototype.setInvisible = function(invisible) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setInvisible", NOARGS, "insufficient input arguments, a boolean is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // check if type is boolean
        if (typeof(invisible) === 'boolean' || invisible == "true" || invisible == "false") {
            if (typeof(invisible) === 'string'){
                if (invisible === "true") {
                    invisible = true;
                } else {
                    invisible = false;
                }
            }
            
            this.invisible = invisible;
        // if another type signals error
        } else {
            errore("setInvisible", WRONGARGS, "wrong argument, only true or false are accepted");
            return this;
        }
        
    }

    return this;
}
// Make setInvisible property non enumerable
Object.defineProperty(ItemImage.prototype, "setInvisible", {enumerable: false});


/** 
 * Set class of corresponding HTML element to style them with css
 * 
 * @param objIn    one or more string that represent a class name
 * @return ItemImage     Returns this ItemImage
 * @example myItemImage.setClass("red");
 */
ItemImage.prototype.setClass = function(objIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setClass", NOARGS, "insufficient input arguments, one or more strings are needed");
        return this;
    // if at least 1 argument in input
    } else {
    	var elemClass = "";
    	// iterate for each input string
    	for (var elem in arguments) {
    		var thisStringIn = arguments[elem];
    		
    		// check if string and eventually add to class string
    		if (typeof(thisStringIn) === 'string') {
    			elemClass += " "+thisStringIn;
    		} else {
    			errore("setClass", WARNING, thisStringIn+" is not a string and couldn't be used as an HTML class value");
    		}
    	}
    	
    	// set attribute classAttribute
    	this.classAttribute = elemClass;
    }

    return this;
}
// Make setClass property non enumerable
Object.defineProperty(ItemImage.prototype, "setClass", {enumerable: false});


/** 
 * Set a label to display in the top of HTML corresponding element
 * 
 * @param label    a string to show as title
 * @return ItemImage     Returns this ItemImage
 * @example myItemImage.setLabel("My tour in Europe");
 */
ItemImage.prototype.setLabel = function(label) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setLabel", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // if input is a string
        if (typeof(label) === 'string' && label != "false") {
            this.label = label;
        }
        // if input is false
        else if (typeof(label) === 'boolean' || (typeof(label) === 'string' && label == "false")) {
            this.label = false;
        }
        // signals a warning for for boolean and numbers
        else if (typeof(label) === 'number' || typeof(label) === 'boolean') {
            errore("setLabel", WARNING, "input should be a string or boolean 'false', not a number");
            this.label = label.toString();
        }
        // error if another type (object)
        else {
            errore("setLabel", WRONGARGS, "wrong input argument, it should be a string");
            return this;
        }
    }

    return this;
}
// Make setLabel property non enumerable
Object.defineProperty(ItemImage.prototype, "setLabel", {enumerable: false});




/**
* ItemMultimedia is the multimedia element of this library. It could be an audio or a video element
* 
* @return ItemMultimedia   Returns a new ItemMultimedia.
*/
function ItemMultimedia(objIn) {
	// create array of referenced binding
	this.bindingRef = [];
	
	// add attribute to signal that it's an advanced item
	this.classAttribute = "ItemAdvanced ItemImage";
	
	// check if something passed as initialization argument
	if (objIn !== undefined){
		// set type
		if (objIn['type'] !== undefined) {
			this.setType(objIn['type']);
		} else {
			this.setType('video');
		}

		// set update visibility
		if (objIn['updateHidden'] !== undefined) {
			this.hideUpdate(objIn['updateHidden']);
		}
	}
	
	// if no objInt
	else {
		this.setType('video');
	}
	
	// save a reference to this object in a global variable
	itemsAdvanced.push(this);
		
	return this; 	
}


/**
* Hide update button for the itemMultimedia
* 
* @param invisible   boolean to set hidding on/off (default is on)
* @return ItemMultimedia   Returns this itemMultimedia.
* @example myItemMultimedia.hideUpdate(true);
*/
ItemMultimedia.prototype.hideUpdate = function(invisible) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("hideUpdate", NOARGS, "insufficient input arguments, a boolean is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // check if type is boolean
        if (typeof(invisible) === 'boolean' || invisible == "true" || invisible == "false") {
            if (typeof(invisible) === 'string'){
                if (invisible === "true") {
                    invisible = true;
                } else {
                    invisible = false;
                }
            }
            
            this.updateHidden = invisible;
        // if another type signals error
        } else {
            errore("hideUpdate", WRONGARGS, "wrong argument, only true or false are accepted");
            return this;
        }
        
    }

    return this;
}
// Make hideUpdate property non enumerable
Object.defineProperty(ItemMultimedia.prototype, "hideUpdate", {enumerable: false});


/**
* set type of itemMap
* 
* @param type    type of ItemMultimedia (default is video)
* @return this ItemMultimedia.
* @example myItemMultimedia.setType('video');
*/
ItemMultimedia.prototype.setType = function(type) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setType", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(type) === 'string' && (type === 'video' || type === 'audio')) {
    		this.type = type;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setType", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make setType property non enumerable
Object.defineProperty(ItemMultimedia.prototype, "setType", {enumerable: false});


/** 
 * Decide if ItemMultimedia must be excluded from visualization
 * 
 * @param invisible    boolean indicating if must be invisible
 * @return ItemMultimedia     Returns this ItemMultimedia
 * @example myItem.myItemMultimedia.setInvisible(true);
 */
ItemMultimedia.prototype.setInvisible = function(invisible) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setInvisible", NOARGS, "insufficient input arguments, a boolean is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // check if type is boolean
        if (typeof(invisible) === 'boolean' || invisible == "true" || invisible == "false") {
            if (typeof(invisible) === 'string'){
                if (invisible === "true") {
                    invisible = true;
                } else {
                    invisible = false;
                }
            }
            
            this.invisible = invisible;
        // if another type signals error
        } else {
            errore("setInvisible", WRONGARGS, "wrong argument, only true or false are accepted");
            return this;
        }
        
    }

    return this;
}
// Make setInvisible property non enumerable
Object.defineProperty(ItemMultimedia.prototype, "setInvisible", {enumerable: false});


/**
* set URL of video or audio
* 
* @param urlIn    UTL of video or audio
* @return this ItemImage.
* @example setURL.setType('/video/vid12.ogg');
*/
ItemMultimedia.prototype.setURL = function(urlIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setURL", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(urlIn) === 'string') {
    		this.URL = urlIn;
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setURL", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make setURL property non enumerable
Object.defineProperty(ItemMultimedia.prototype, "setURL", {enumerable: false});


/** 
 * Set class of corresponding HTML element to style them with css
 * 
 * @param objIn    one or more string that represent a class name
 * @return ItemMultimedia     Returns this ItemMultimedia
 * @example myItemMultimedia.setClass("red");
 */
ItemMultimedia.prototype.setClass = function(objIn) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setClass", NOARGS, "insufficient input arguments, one or more strings are needed");
        return this;
    // if at least 1 argument in input
    } else {
    	var elemClass = "";
    	// iterate for each input string
    	for (var elem in arguments) {
    		var thisStringIn = arguments[elem];
    		
    		// check if string and eventually add to class string
    		if (typeof(thisStringIn) === 'string') {
    			elemClass += " "+thisStringIn;
    		} else {
    			errore("setClass", WARNING, thisStringIn+" is not a string and couldn't be used as an HTML class value");
    		}
    	}
    	
    	// set attribute classAttribute
    	this.classAttribute = elemClass;
    }

    return this;
}
// Make setClass property non enumerable
Object.defineProperty(ItemMultimedia.prototype, "setClass", {enumerable: false});


/** 
 * Set a label to display in the top of HTML corresponding element
 * 
 * @param label    a string to show as title
 * @return ItemMultimedia     Returns this ItemMultimedia
 * @example myItemMultimedia.setLabel("My tour in Europe");
 */
ItemMultimedia.prototype.setLabel = function(label) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setLabel", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
        // if input is a string
        if (typeof(label) === 'string' && label != "false") {
            this.label = label;
        }
        // if input is false
        else if (typeof(label) === 'boolean' || (typeof(label) === 'string' && label == "false")) {
            this.label = false;
        }
        // signals a warning for for boolean and numbers
        else if (typeof(label) === 'number' || typeof(label) === 'boolean') {
            errore("setLabel", WARNING, "input should be a string or boolean 'false', not a number");
            this.label = label.toString();
        }
        // error if another type (object)
        else {
            errore("setLabel", WRONGARGS, "wrong input argument, it should be a string");
            return this;
        }
    }

    return this;
}
// Make setLabel property non enumerable
Object.defineProperty(ItemMultimedia.prototype, "setLabel", {enumerable: false});



/** 
 * _extractItemAdvanced check if exists a valid itemAdvanced with that name; return corresponding itemAdvanced or false 
 * if it doesn't exists 
 * 
 * @param itemAdvancedName to manipulate
 * @return an itemAdvanced or false
 * @example _extractItemAdvanced("myItemAdvancedName");
 */
function _extractItemAdvanced(itemAdvancedName){
	// extract item
	var thisItemAdv = false;
	
	if (typeof(window[itemAdvancedName]) !== 'undefined' && _checkItemAdvanced(window[itemAdvancedName])) {
		thisItemAdv = window[itemAdvancedName];
	}
	else {
		var findOpenSb = itemAdvancedName.search(REGOPENSB);
	 	if (findOpenSb !== -1 && itemAdvancedName.search(REGCLOSESB) !== -1) {
	 		// find array name and array position
	 		var findCloseSb = itemAdvancedName.search(REGCLOSESB);
	 		var itemAdvArrayName = itemAdvancedName.substring(0, findOpenSb);
			var itemAdvArrayPos = itemAdvancedName.substring(findOpenSb+1, findCloseSb);
			
			if (typeof(window[itemAdvArrayName][itemAdvArrayPos]) !== 'undefined' && _checkItemAdvanced(window[itemAdvArrayName][itemAdvArrayPos])) {
				thisItemAdv = window[itemAdvArrayName][itemAdvArrayPos];
			}			
		}
	}
	
	return thisItemAdv;
}


/** 
 * check if object is an instance of any ItemAdvanced
 * 
 * @param object   an object to check
 * @return boolean    true if object is a valid ItemAdvanced
 * @example _checkItemAdvanced(myObject);
 */
function _checkItemAdvanced(object) {
	if (object instanceof ItemMap || object instanceof ItemImage || object instanceof ItemMultimedia) {
		return true;
	} else {
		return false;
	}
}


/** 
 * draw an ItemAdvanced object in HTML
 * 
 * @param itemAdvanced to draw
 * @return none
 * @example _drawAdvanced(myItemAdvanced);
 */
function _drawAdvanced(itemAdvanced){
	// check if item has a position
	if (itemsToDraw.indexOf(itemAdvanced.name) !== -1) {
	    // extract corresponding HTML node
	    var HTMLitem = document.getElementById(itemAdvanced.name);
	    
	    // eventually draw label
	    if (itemAdvanced.label) {
	    	 var HTMLlabel = document.createElement("p");
	    	 
	    	 HTMLlabel.innerHTML = itemAdvanced.label;
	    	 HTMLlabel.setAttribute("id", HTMLitem.getAttribute("id")+"_"+itemAdvanced.name+"_label");
	    	 HTMLlabel.className = HTMLlabel.className + " itemLabel";
	    	 HTMLlabel.className = HTMLlabel.className + " prova";
	    	 HTMLitem.appendChild(HTMLlabel);
	    }
	    
	    // eventually add element attributes
	    if (HTMLitem.className && !_hasClass(HTMLitem, HTMLitem.className)) {
	    	HTMLitem.className += itemAdvanced.classAttribute;
	    }
	    
	    // TBA: localStorage fot advanced elements
	    // create item to store local saved data
	    // var localStorageObj;
	    // // check if something already stored in localStorage and eventually retrieve saved values  
	    // if (itemAdvanced.localStorage) {
		    // // recover local values if available
		    // if (localStorage[itemAdvanced.name] != undefined) {
		    	// var localObject = itemAdvanced._fromLocalStorage();
		    	// // ******************************************* setValue should be used? Or is it exactly the cose where it should be avoid?
		    	// for (var attr in localObject) {
					// itemAdvanced[attr].value = localObject[attr];
				// }
		    // }
			// // update local storage and save archieved data
			// localStorageObj = itemAdvanced._toLocalStorage();
		// }
	    
	    // call proper draw function
	    if (itemAdvanced instanceof ItemMap) {
	    	_drawItemMap(itemAdvanced);
	    } else if (itemAdvanced instanceof ItemImage) {
	    	_drawItemImage(itemAdvanced);
	    } else if (itemAdvanced instanceof ItemMultimedia) {
	    	_drawItemMultimedia(itemAdvanced);
	    }
	    
	    // create updateButton and event handler
	    _setUpdateAdvanced(HTMLitem, itemAdvanced);    
	    
	    // create a reset button if stored locally
	    // if (itemAdvanced.localStorage) {
	    	// _setReset(HTMLitem, itemAdvanced);
	    // }
	    
		// eventually make item invisible
		if (itemAdvanced.invisible === true && !_hasClass(HTMLitem, "H5_invisible")) {
			HTMLitem.className += " H5_invisible";
		} else if (itemAdvanced.invisible === false && _hasClass(HTMLitem, "H5_invisible")) {
			_removeClass(HTMLitem, "H5_invisible");
		}
	}
	
	else {
		errore("_drawAdvanced", INTERNAL_WRONGARGS, "input itemAdvanced doesn't has a position to be placed");
	}
}


/** 
 * Draw ItemMap HTML elements
 * 
 * @param itemMap   an ItemMap to be deisplayed
 * @return none
 * @example _drawItemMap(myItemMap);
 */
function _drawItemMap(itemMap) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("_drawItemMap", INTERNAL_NOARGS, "insufficient input arguments, an ItemMap is required");
    // if number of argument is correct, check its type
    } else {
        // if arguments are correct
        if (itemMap instanceof ItemMap) {
        	// create fragment
        	var fragment = document.createDocumentFragment();
        	// add iframe
        	var HTMLelemFather = document.getElementById(itemMap.name);
        	var HTMLiframe = document.createElement("iframe");
        	fragment.appendChild(HTMLiframe);
        	HTMLiframe.setAttribute("id", itemMap.name + "_map");
        	HTMLiframe.setAttribute("width", itemMap.width);
        	HTMLiframe.setAttribute("height", itemMap.height);
			
            // create src code
            var code = "http://maps.google.it/?ie=UTF8";
            
            // if type is multi
            if (itemMap.type === 'multi' && itemMap.addresses.length > 1) {
            	code += "&saddr="+itemMap.addresses[0];
            	code += "&daddr="+itemMap.addresses[1];
            	
            	if (itemMap.addresses.length > 2) {
            		for (var i = 2; i < itemMap.addresses.length; i++) {
            			code += "+to:"+itemMap.addresses[i];
            		}
            	}
            }
            // if type is not multi or multi with 1 address
            else {
            	// check if binded
	            if (itemMap.binded) {
	            	// if direct binding
	            	if (typeof(itemMap.binding) === 'object' && itemMap.binding instanceof _sString) {
	            		code += "&q="+itemMap.binding.get();
	            	}
	            	// if binding is a function
	            	else {
	            		var returned = itemMap.binding();
	            		
	            		if (typeof(returned) === 'string') {
	            			code += "&q="+itemMap.binding();
	            		} else if (typeof(returned) === 'object' && returned.length) {
	            			if (returned.length < 2) {
	            				code += "&q="+returned[0];
	            			} else {
	            				code += "&saddr="+returned[0];
            					code += "&daddr="+returned[1];
            					
            					if (returned.length > 2) {
				            		for (var i = 2; i < returned.length; i++) {
				            			code += "+to:"+returned[i];
				            		}
				            	}
	            			}
	            		} else {
	            			errore("_drawItemMap", WARNING, "returned value from binding not handled correctly");
	            		}	
	            	}
	            	// &iwloc=near&addr remove bubbles
	            	code += "&iwloc=near&addr";
	            }
	            // if not binded
	            else {
	            	// add coordinates
		            if (itemMap.type === 'coordinates' || itemMap.type === 'coord') {
		            	if (  itemMap.latitude && itemMap.longitude) {
		            		code += "&ll=" + itemMap.latitude + "," + itemMap.longitude + "&t=w";
		            		// add red dot / green arrow
	            			code += "&q="+itemMap.latitude + "," + itemMap.longitude;
		            	}
		            } 
		            // add query
		            else if (itemMap.type === 'map' || itemMap.type === 'position') {
		            	code += "&q="+ itemMap.position +"&iwloc=near&addr";
		            }
		            // add query if single position found in multi map
		            else if (itemMap.type === 'multi') {
		            	code += "&q="+ itemMap.addresses[0] +"&iwloc=near&addr";
		            }
	            }
            }
               
            // add zoom
            if (itemMap.zoom) {
            	code += "&z=" + itemMap.zoom;
            }
            // add embed option. &iwloc=near adds bubble
            code += "&output=embed";
            // attach src attribute
            if (!(itemMap.invisible === true)) {
            	HTMLiframe.setAttribute("src", code);
            }
			 //code = "http://maps.google.it/?ie=UTF8&ll=41.442726,12.392578&spn=9.467274,19.753418&t=w&z=6&output=embed";
            
            // set attribute
            if (itemMap.classAttribute) {
            	HTMLiframe.className += itemMap.classAttribute;
            }  
		    
			// set invisibility
			if (itemMap.invisible === true && !_hasClass(HTMLelemFather, "H5_invisible")) {
				HTMLelemFather.className += " H5_invisible";
			} else if (itemMap.invisible === false && _hasClass(HTMLelemFather, "H5_invisible")) {
				_removeClass(HTMLelemFather, "H5_invisible");
			}
			
			// eventually add command
			if (itemMap.showCommand) {
				// if binded show a label of position
				if (itemMap.binded) {
					var HTMLli = document.createElement("li");
					var HTMLspan = document.createElement("span");
					HTMLli.appendChild(HTMLspan);
					if (typeof(itemMap.binding) === 'function') {
						HTMLspan.innerHTML = itemMap.binding();
					} else {
						HTMLspan.innerHTML = itemMap.binding.get();
					}
					
					fragment.appendChild(HTMLli);
				}
				// if type is position
				else if (!itemMap.binded && (itemMap.type === 'map' || itemMap.type === 'position')) {
					var HTMLli = document.createElement("li");
					var HTMLspan1 = document.createElement("span");
					var HTMLspan2 = document.createElement("span");
					HTMLli.appendChild(HTMLspan1);
					HTMLli.appendChild(HTMLspan2);
					fragment.appendChild(HTMLli);
					HTMLspan1.innerHTML = "position: ";
					HTMLspan2.innerHTML = itemMap.position;
					HTMLspan2.setAttribute("id", itemMap.name + "_position");
					
					// eventually make span modifiable
					if (itemMap.modifiable === true) {
						HTMLspan2.setAttribute("contenteditable", "true");
					}
				}
				// if type is coord
				else if (!itemMap.binded && (itemMap.type === 'coordinates' || itemMap.type === 'coord')){
					var HTMLli = document.createElement("li"); var HTMLli2 = document.createElement("li");
					var HTMLspan1 = document.createElement("span"); var HTMLspan3 = document.createElement("span");
					var HTMLspan2 = document.createElement("span"); var HTMLspan4 = document.createElement("span");
					HTMLli.appendChild(HTMLspan1); HTMLli2.appendChild(HTMLspan3);
					HTMLli.appendChild(HTMLspan2); HTMLli2.appendChild(HTMLspan4);
					fragment.appendChild(HTMLli); fragment.appendChild(HTMLli2);
					HTMLspan1.innerHTML = "latitude: "; HTMLspan3.innerHTML = "longitude: ";
					HTMLspan2.innerHTML = itemMap.latitude; HTMLspan4.innerHTML = itemMap.longitude;
					HTMLspan2.setAttribute("id", itemMap.name + "_latitude");
					HTMLspan4.setAttribute("id", itemMap.name + "_longitude");
					
					// eventually make span modifiable
					if (itemMap.modifiable === true) {
						HTMLspan2.setAttribute("contenteditable", "true"); HTMLspan4.setAttribute("contenteditable", "true");
					}
				}
			}
            
            // append elements           
            HTMLelemFather.appendChild(fragment);	

        } else {
            errore("_drawItemMap", INTERNAL_WRONGARGS, "wrong input arguments, an ItemMaps is required");
            return false;
        }
    }
}


/** 
 * Draw ItemImage HTML elements
 * 
 * @param itemImage   an itemImage to be deisplayed
 * @return none
 * @example _drawItemImage(myItemImage);
 */
function _drawItemImage(itemImage) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("_drawItemImage", INTERNAL_NOARGS, "insufficient input arguments, an itemImage is required");
    // if number of argument is correct, check its type
    } else {
        // if arguments are correct
        if (itemImage instanceof ItemImage) {
        	// create fragment
        	var fragment = document.createDocumentFragment();
        	// add image
        	var HTMLelemFather = document.getElementById(itemImage.name);
        	var HTMLimg = document.createElement("img");
        	fragment.appendChild(HTMLimg);
        	HTMLimg.setAttribute("id", itemImage.name + "_img");
            
            // attach src attribute
            if (!(itemImage.invisible === true)) {
            	// if normale image
            	if (itemImage.type === 'single' || itemImage.type === 'multiple') {
            		HTMLimg.setAttribute("src", itemImage.URL);
            	}
            	// if carousel
            	else if (itemImage.type === 'carousel') {
            		// check number of images
            		if (itemImage.URLs.length < 2) {
            			HTMLimg.setAttribute("src", itemImage.URL);
            		} else {
	            		// define delay
	            		if (itemImage.delay !== undefined && typeof(itemImage.delay) === 'number') {
	            			var delay = itemImage.delay;
	            		} else {
	            			var delay = 3;
	            		}
	            		
	            		HTMLimg.setAttribute("src", itemImage.URLs[0]);
	            		var dimension = itemImage.URLs.length;
	            		var num = 1;
	            		
	            		setInterval(function(){
	            			HTMLimg.setAttribute("src", itemImage.URLs[num]);
	            			num++;
	            			if (num >= dimension) {
	            				num = 0;
	            			}
	            		}, delay*1000);
	            		
            		}
            	}
            }
            
            // set attribute
            if (itemImage.classAttribute) {
            	HTMLimg.className += itemImage.classAttribute;
            }  
		    
			// set invisibility
			if (itemImage.invisible === true && !_hasClass(HTMLelemFather, "H5_invisible")) {
				HTMLelemFather.className += " H5_invisible";
			} else if (itemImage.invisible === false && _hasClass(HTMLelemFather, "H5_invisible")) {
				_removeClass(HTMLelemFather, "H5_invisible");
			}
			
            // append elements           
            HTMLelemFather.appendChild(fragment);	

        } else {
            errore("_drawItemImage", INTERNAL_WRONGARGS, "wrong input arguments, an ItemMaps is required");
            return false;
        }
    }
}


/** 
 * Draw itemMultimedia HTML elements
 * 
 * @param itemMultimedia   an itemMultimedia to be deisplayed
 * @return none
 * @example _drawItemMultimedia(myItemMultimedia);
 */
function _drawItemMultimedia(itemMultimedia) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("_drawItemMultimedia", INTERNAL_NOARGS, "insufficient input arguments, an ItemMultimedia is required");
    // if number of argument is correct, check its type
    } else {
        // if arguments are correct
        if (itemMultimedia instanceof ItemMultimedia) {
        	// create fragment
        	var fragment = document.createDocumentFragment();
        	
        	// create and add multimedia lement
        	var HTMLelemFather = document.getElementById(itemMultimedia.name);
        	if (itemMultimedia.type === 'video') {
        		var HTMLmultimedia =  document.createElement("video");
        	} else if (itemMultimedia.type === 'audio') {
        		var HTMLmultimedia =  document.createElement("audio");
        	}
        	
        	fragment.appendChild(HTMLmultimedia);
        	HTMLmultimedia.setAttribute("id", itemMultimedia.name + "_multimedia");
            
            // attach src attribute
            if (!(itemMultimedia.invisible === true)) {
            	HTMLmultimedia.setAttribute("src", itemMultimedia.URL);
            }
            
            // add controls
            HTMLmultimedia.setAttribute("controls", "controls");
            
            // set attribute
            if (itemMultimedia.classAttribute) {
            	HTMLmultimedia.className += itemMultimedia.classAttribute;
            }  
		    
			// set invisibility
			if (itemMultimedia.invisible === true && !_hasClass(HTMLelemFather, "H5_invisible")) {
				HTMLelemFather.className += " H5_invisible";
			} else if (itemMultimedia.invisible === false && _hasClass(HTMLelemFather, "H5_invisible")) {
				_removeClass(HTMLelemFather, "H5_invisible");
			}
			
            // append elements           
            HTMLelemFather.appendChild(fragment);	

        } else {
            errore("_drawItemMultimedia", INTERNAL_WRONGARGS, "wrong input arguments, an ItemMultimedia is required");
            return false;
        }
    }
}


/** 
 * Set and draw the update button for an itemAdvanced
 * 
 * @param HTMLitemAdvanced   HTML element corresponding to itemAdvanced to manipulate
 * @param itemAdvanced   an itemAdvanced to manipulate
 * @return none
 * @example _setUpdateAdvanced(myHTMLItemAdvanced, myItemAdvanced);
 */
function _setUpdateAdvanced(HTMLitemAdvanced, itemAdvanced) {
	// create button
	var HTMLbutton = document.createElement("button");
	HTMLbutton.setAttribute("type", "button");
	HTMLbutton.setAttribute("id", itemAdvanced.name + "_updateButton");
	HTMLbutton.setAttribute("class", "updateButton");
	HTMLbutton.innerHTML = "update";
	
	// insert it
	HTMLitemAdvanced.appendChild(HTMLbutton);
	// eventually make update invisible
	if (itemAdvanced.updateHidden !== undefined && itemAdvanced.updateHidden === true && !_hasClass(HTMLbutton, "H5_invisible")) {
		HTMLbutton.className += " H5_invisible";
	} else if ((itemAdvanced.updateHidden === undefined || itemAdvanced.updateHidden === false) && _hasClass(HTMLbutton, "H5_invisible")) {
		_removeClass(HTMLbutton, "H5_invisible");
	}
	
	// create event handler
	HTMLbutton.onclick = function(){
		// // eventually store locally
		// if (itemAdvanced.localStorage) {
			// itemAdvanced._toLocalStorage();
		// }
		
		// update for ItemMap
		if (itemAdvanced instanceof ItemMap) {
			// if editable
			if (itemAdvanced.binded !== true && itemAdvanced.modifiable && itemAdvanced.showCommand) {
				// if type is position
				if (itemAdvanced.type === 'position' || itemAdvanced.type === 'map') {
					var HTMLposition = document.getElementById(itemAdvanced.name + "_position");
					
					itemAdvanced.setPosition(HTMLposition.innerHTML);
				}
				// if type is coordinates
				else if (itemAdvanced.type === 'coordinates' || itemAdvanced.type === 'coord') {
					var HTMLposition = document.getElementById(itemAdvanced.name + "_latitude");
					var HTMLposition2 = document.getElementById(itemAdvanced.name + "_longitude");
					
					itemAdvanced.setLatitude(parseFloat(HTMLposition.innerHTML));
					itemAdvanced.setLongitude(parseFloat(HTMLposition2.innerHTML));
				}
			}
		}
		// update for ItemImage
		else if (itemAdvanced instanceof ItemImage) {
			// NONE
		}
		
		// cancel old element and draw again, considering also dependances
		_reDrawAdvanced(itemAdvanced);
	}
}


/** 
 * scan each sObject of an item and adds binding dependencies to item used by any binding in this itemAdvanced
 * 
 * @param thisItemAdv   an itemAdvanced
 * @return none
 * @example _defineBindingsAdvanced(myItemAdvanced);
 */
function _defineBindingsAdvanced(thisItemAdv) {
	// check input
	if (typeof(thisItemAdv) === 'object' && _checkItemAdvanced(thisItemAdv)) {
		// check if item is binded
		if (thisItemAdv.binded) {
			var checkedItems = new Array();
			
			// for each binding path
			for (var tarit in thisItemAdv.bindingPath) {
				var target = thisItemAdv.bindingPath[tarit];
				
				// extract referenced item name
				var pointPos = target.search(REGPOINT);
            	if (pointPos != -1) {
                    var refItemName = target.substring(0, pointPos);
                    
                    // check if item is in array
                    var isArray = (target.search(REGLONGARRAY) !== -1);
                    var arrayRefItemName = new Array();
                    // if in array
                    if (isArray) {
                    	// extract array
                    	var arrayNameEnd = target.search(REGOPENSB);
                    	var arrayName = target.substring(0, arrayNameEnd);
                    	                   	
                    	// check if a valid array
                    	if (typeof(window[arrayName]) === 'object') {
                    		var thisArray = window[arrayName];
                    		// for every object in array
                    		for (var elem in thisArray) {
                    			var thisReferencedItem = thisArray[elem];
                    			// if it's an Item
                    			if (thisReferencedItem instanceof Item){
                    				if (thisReferencedItem.bindingRefAdvanced.indexOf(thisItemAdv.name) === -1) {
			                    		thisReferencedItem.bindingRefAdvanced.push(thisItemAdv.name);
			                    	}
             	      			}
                    		}
                    	}
                    }
                    // if not in array
                    else {
                    	// extract item
                    	var thisReferencedItem = _extractItem(refItemName);
                    	// check if it's a valid item
	                    if (thisReferencedItem) {
	                    	// check if item is already in bindingRef array and eventually add it
	                    	if (thisReferencedItem.bindingRefAdvanced.indexOf(thisItemAdv.name) === -1) {
	                    		thisReferencedItem.bindingRefAdvanced.push(thisItemAdv.name);
	                    	}
	                    	
	                    }
                    }
                }
				
			}
		}
	}
	// eventually signals wrong input
	else {
		errore("_defineBindingsAdvanced", WRONGARGS, "input is not an ItemAdvanced");
		return false;
	}
}


/** 
 * redraw itemAdvaced HTML element by removing old HTML and generating new code, eventually
 * redrawing also binding dependencies
 * 
 * @param itemAdvanced    hte itemAdvanced to redraw
 * @return none
 * @example _reDrawAdvanced(myItemAdvanced);
 */
function _reDrawAdvanced(itemAdvanced){
	// find HTML corresponding element
	var HTMLitemAdvanced = document.getElementById(itemAdvanced.name);
	
	// cancell HTML element different from sections
	_cancelHTMLElements(HTMLitemAdvanced);

	// extract itemAdvanced and call _draw() function
	_drawAdvanced(itemAdvanced);
}


/** 
 * If at runtime, attach one or more itemMap inside an already placed HTML element with a given id
 * 
 * @param itemAdvancedName   name of itemAdvanced to attach to HTML element
 * @param idName   id of an HTML element
 * @param command   type of attachmnet ("inside", "before", "after")
 * @return   boolean to signals if assignement failed or not 
 * @example   _attachItemAdvancedAndId("myNewMap", "anOldItem", "attach");
 */
function _attachItemMapAndId(itemAdvancedName, idName, command) {
	_attachItemAdvancedAndId(itemAdvancedName, idName, command, "map");
}
/** 
 * If at runtime, attach one or more itemMap inside an already placed HTML element with a given id
 * 
 * @param itemAdvancedName   name of itemAdvanced to attach to HTML element
 * @param idName   name of an item
 * @param command   type of attachmnet ("inside", "before", "after")
 * @return   boolean to signals if assignement failed or not 
 * @example   _attachItemMapAndItem("myNewMap", "anOldItem", "attach");
 */
function _attachItemMapAndItem(itemAdvancedName, idName, command) {
	if (idName !== undefined) {
		var item = _extractItem(idName);
		if (item) {
			var name = item.name;
		}
	}
	_attachItemAdvancedAndId(itemAdvancedName, name, command, "map");
}


/** 
 * If at runtime, attach one or more itemMap inside an already placed HTML element with a given id
 * 
 * @param itemAdvancedName   name of itemAdvanced to attach to HTML element
 * @param idName   id of an HTML element
 * @param command   type of attachmnet ("inside", "before", "after")
 * @return   boolean to signals if assignement failed or not 
 * @example   _attachItemImageAndId("myNewImage", "anOldItem", "attach");
 */
function _attachItemImageAndId(itemAdvancedName, idName, command) {
	_attachItemAdvancedAndId(itemAdvancedName, idName, command, "image");
}
/** 
 * If at runtime, attach one or more itemMap inside an already placed HTML element with a given id
 * 
 * @param itemAdvancedName   name of itemAdvanced to attach to HTML element
 * @param idName   name of an item
 * @param command   type of attachmnet ("inside", "before", "after")
 * @return   boolean to signals if assignement failed or not 
 * @example   _attachItemImageAndItem("myNewImage", "anOldItem", "attach");
 */
function _attachItemImageAndItem(itemAdvancedName, idName, command) {
	if (idName !== undefined) {
		var item = _extractItem(idName);
		if (item) {
			var name = item.name;
		}
	}
	_attachItemAdvancedAndId(itemAdvancedName, name, command, "image");
}


/** 
 * If at runtime, attach one or more itemMap inside an already placed HTML element with a given id
 * 
 * @param itemAdvancedName   name of itemAdvanced to attach to HTML element
 * @param idName   id of an HTML element
 * @param command   type of attachmnet ("inside", "before", "after")
 * @return   boolean to signals if assignement failed or not 
 * @example   _attachItemMultimediaAndId("myNewMultimedia", "anOldItem", "attach");
 */
function _attachItemMultimediaAndId(itemAdvancedName, idName, command) {
	_attachItemAdvancedAndId(itemAdvancedName, idName, command, "multimedia");
}
/** 
 * If at runtime, attach one or more itemMap inside an already placed HTML element with a given id
 * 
 * @param itemAdvancedName   name of itemAdvanced to attach to HTML element
 * @param idName   name of an item

 * @return   boolean to signals if assignement failed or not 
 * @example   _attachItemMultimediaAndId("myNewMultimedia", "anOldItem", "attach");
 */
function _attachItemMultimediaAndItem(itemAdvancedName, idName, command) {
	if (idName !== undefined) {
		var item = _extractItem(idName);
		if (item) {
			var name = item.name;
		}
	}
	_attachItemAdvancedAndId(itemAdvancedName, name, command, "multimedia");
}


/** 
 * If at runtime, manage attachment of one or more itemAdvanced to an HTML element
 * 
 * @param itemAdvancedName   name of itemAdvanced to be attached
 * @param idName   id of a valid HTML element
 * @param commandIn   type of attachmnet ("inside", "before", "after")
 * @param type   type of itemAdvanced to attach
 * @return   boolean to signals if assignement failed or not 
 * @example   _attachItemAdvancedAndId("myItemAdvanced", "HTMLid", "after", "image");
 */
function _attachItemAdvancedAndId(itemAdvancedName, idName, commandIn, type) {
	// check if already at runtime
	if (ISRUNTIME) {
		// check if arguments has been passed
	    if (arguments.length < 4) {
	        errore("_attachItemAdvancedAndId", NOARGS, "insufficient input arguments");
	        return false;
        }
        // if at least 4 input arguments
        else {
        	var itemAdvanced = _extractItemAdvanced(itemAdvancedName);
        	var HTMLparent = document.getElementById(idName);
        	var commandOk = (commandIn === 'after' || commandIn === 'before' || commandIn === 'inside');
        	var typeOk = (type === 'map' || 'image' || 'multimedia' || 'audio' || 'video');
        	
        	// check if input are good
        	if (itemAdvanced && HTMLparent && commandOk && typeOk) {
        		// assign name to new advancedItem
        		itemAdvanced.name = itemAdvancedName;
        		
        		// create HTML element
				var HTMLnewItemAdvanced = document.createElement("section");
				HTMLnewItemAdvanced.setAttribute("id", itemAdvancedName);
						
				// attach element depending on commandIn
				if (commandIn == "after") {
					// attach element
					if (HTMLparent.nextSibling) {
						HTMLparent.parentNode.insertBefore(HTMLnewItemAdvanced, HTMLparent.nextSibling);
					}
					else {
						HTMLparent.parentNode.appendChild(HTMLnewItemAdvanced);
					}
				} else if (commandIn == "before") {
					HTMLparent.parentNode.insertBefore(HTMLnewItemAdvanced, HTMLparent);
				} else if (commandIn == "inside") {
					HTMLparent.appendChild(HTMLnewItemAdvanced);
				}
				
				// add item name to array of item to draw
				itemsToDraw.push(itemAdvancedName);
				        
				// add a reference to items created at runtime
				itemsAdvancedLive.push(itemAdvanced);
				        
				// verify and redefine binding
				_defineBindingsAdvanced(itemAdvanced);

				// draw item
				_reDrawAdvanced(itemAdvanced);
				        
        	}
        	// signals wrong input
        	else {
        		errore("_attachItemAdvancedAndId", WRONGARGS, "wrong input arguments");
        		return false;
        	}
		}
	}
	// if not at runtime signals error
	else {
		errore("_attachItemAdvancedAndId", CALLTIME, "this function could be used only at runtime. Use here() instead");
		return false;
	}
}




// XXX: segnaposto per Aptana
//********************* EXTERNAL SOURCES **************************//
/**
* ItemSocket is the element that manage asynchronous data transfert. It uses socket mechanism.
* 
* @return ItemSocket   Returns a new ItemSocket.
*/
function ItemSocket() {
	// create array of referenced binding
	this.bindingRef = [];
	
	// save a reference to this object in a global variable
	itemSocket.push(this);
	
	return this; 	
}


/** 
 * Extract the ItemSocket element corresponding to its name
 * 
 * @param itemSocketName   name of ItemSocket to be extracted
 * @return    extracted element or false to signals error
 * @example   _extractItemSocket("myItemSocketName");
 */
function _extractItemSocket(itemSocketName){
	// extract item
	var thisItemSocket = false;
	
	if (typeof(window[itemSocketName]) !== 'undefined' && window[itemSocketName] instanceof ItemSocket) {
		thisItemSocket = window[itemSocketName];
	}
	else {
		var findOpenSb = itemSocketName.search(REGOPENSB);
	 	if (findOpenSb !== -1 && itemSocketName.search(REGCLOSESB) !== -1) {
	 		// find array name and array position
	 		var findCloseSb = itemSocketName.search(REGCLOSESB);
	 		var itemAdvArrayName = itemSocketName.substring(0, findOpenSb);
			var itemAdvArrayPos = itemSocketName.substring(findOpenSb+1, findCloseSb);
			
			if (typeof(window[itemAdvArrayName][itemAdvArrayPos]) !== 'undefined' && window[itemAdvArrayName][itemAdvArrayPos] instanceof ItemSocket) {
				thisItemSocket = window[itemAdvArrayName][itemAdvArrayPos];
			}			
		}
	}
	
	return thisItemSocket;
}


/** 
 * Set proper host to be attached at ItemSocket. It also create the part that manage reception of messages and 
 * eventually manage JSON code
 * 
 * @param host   name of remote server
 * @return    this ItemSocket element
 * @example   myItemSocket.setHost("ws://localhost.prova.php");
 */
ItemSocket.prototype.setHost = function(host) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setHost", NOARGS, "insufficient input arguments, a string is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(host) === 'string') {
    		this.host = host;
    		this.socket = new WebSocket(host);
    		var that = this;
    		
    		this.socket.onmessage = function(message) {
				that.message = message.data;
				
				// check if message input is JSON
				if (/^[\],:{}\s]*$/.test(that.message.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
					// parse to an object
					that.isMessageJSON = true;
					that.messageJSON = JSON.parse(that.message);
				} else {
					that.isMessageJSON = false;
				}
				
				// check if something to redraw
				if (that.bindingRef.length > 0) {
					// redraw each item
					for (var elem in that.bindingRef) {
						thisItemName = that.bindingRef[elem];
						
						thisItem = _extractItem(thisItemName);
						if (thisItem) {
							_reDraw(thisItem);
						}
					}
				}
            };
    	}
        // signals error if wrong input type
        else {
            errore("setHost", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make setLabel property non enumerable
Object.defineProperty(ItemSocket.prototype, "setHost", {enumerable: false});


/*
ItemSocket.prototype.setOnMessage = function(onMessageFunction) {
    // check if any arguments has been passed
    if (arguments.length < 1) {
        errore("setHost", NOARGS, "insufficient input arguments, a function is needed");
        return this;
    // if at least 1 argument in input
    } else {
    	// check input
    	if (typeof(type) === 'string') {
    		this.host = host;
    		this.socket = new WebSocket(host);
    	}
        // signals error if wrong input type or unknown string
        else {
            errore("setHost", WRONGARGS, "wrong input argument");
            return this;
        }
    }

    return this;
}
// Make setLabel property non enumerable
Object.defineProperty(ItemSocket.prototype, "setHost", {enumerable: false});
*/




// Utility function uside during runtime with explicited names
var utilsLive = {
	attachItemMapAfterId: function(itemAdvancedName, idName) {
		_attachItemMapAndId(itemAdvancedName, idName, "after");
	},
	attachItemMapBeforeId: function(itemAdvancedName, idName) {
		_attachItemMapAndId(itemAdvancedName, idName, "before");
	},
	attachItemMapInsideId: function(itemAdvancedName, idName) {
		_attachItemMapAndId(itemAdvancedName, idName, "inside");
	},
	attachItemMapAfterItem: function(itemAdvancedName, idName) {
		_attachItemMapAndItem(itemAdvancedName, idName, "after");
	},
	attachItemMapBeforeItem: function(itemAdvancedName, idName) {
		_attachItemMapAndItem(itemAdvancedName, idName, "before");
	},
	attachItemMapInsideItem: function(itemAdvancedName, idName) {
		_attachItemMapAndItem(itemAdvancedName, idName, "inside");
	},
	
	attachItemImageAfterId: function(itemAdvancedName, idName) {
		_attachItemImageAndId(itemAdvancedName, idName, "after");
	},
	attachItemImageBeforeId: function(itemAdvancedName, idName) {
		_attachItemImageAndId(itemAdvancedName, idName, "before");
	},
	attachItemImageInsideId: function(itemAdvancedName, idName) {
		_attachItemImageAndId(itemAdvancedName, idName, "inside");
	},
	attachItemImageAfterItem: function(itemAdvancedName, idName) {
		_attachItemImageAndItem(itemAdvancedName, idName, "after");
	},
	attachItemImageBeforeItem: function(itemAdvancedName, idName) {
		_attachItemImageAndItem(itemAdvancedName, idName, "before");
	},
	attachItemImageInsideItem: function(itemAdvancedName, idName) {
		_attachItemImageAndItem(itemAdvancedName, idName, "inside");
	},
	
	attachItemMultimediaAfterId: function(itemAdvancedName, idName) {
		_attachItemMultimediaAndId(itemAdvancedName, idName, "after");
	},
	attachItemMultimediaBeforeId: function(itemAdvancedName, idName) {
		_attachItemMultimediaAndId(itemAdvancedName, idName, "before");
	},
	attachItemMultimediaInsideId: function(itemAdvancedName, idName) {
		_attachItemMultimediaAndId(itemAdvancedName, idName, "inside");
	},
	attachItemMultimediaAfterItem: function(itemAdvancedName, idName) {
		_attachItemMultimediaAndItem(itemAdvancedName, idName, "after");
	},
	attachItemMultimediaBeforeItem: function(itemAdvancedName, idName) {
		_attachItemMultimediaAndItem(itemAdvancedName, idName, "before");
	},
	attachItemMultimediaInsideItem: function(itemAdvancedName, idName) {
		_attachItemMultimediaAndItem(itemAdvancedName, idName, "inside");
	}

};


//*********** ERRORS HANDLING AND OTHER SPECIAL FUNCTIONS **********//

// insert a new error in errors array
function errore(functionName, errorType, longDesc) {
    errors.push([functionName, errorType, longDesc]);
}


// display errors
function _displayErrors() {
	// if only console
    if (ERRHANDLE === ERRORDISP.ONLYCONSOLE) {
    	for (var err in errors) {
    		var thiserr = errors[err];
    		console.log("[error type "+thiserr[1]+"] error in function "+thiserr[0]+": "+thiserr[2]+".");
    		delete errors[err];
    	}
    	
    }
}



// ************ EXPOSE TO GLOBAL VARIABLE ***************//
window.Item = Item;
window.ItemMap = ItemMap;
window.ItemImage = ItemImage;
window.ItemSocket = ItemSocket;
window.ItemMultimedia = ItemMultimedia;

window.H5 = {
	info: easyHTML5,
	version: easyHTML5.version,
	here: here,
	inside: inside,
	after: putItemAfter,
	date: {
		format: _extractDate,
		extract: extractNumberFromDate,
		distanceDays: _dateDistance,
		sumDays: _dateSumDay
	},
	runtime: {
		redraw: redraw,
		redrawItem: redrawItem,
		
		attachItemAfterItem: attachItemAfterItem,
		attachItemBeforeItem: attachItemBeforeItem,
		attachItemInsideItem: attachItemInsideItem,
		attachItemBeforeId: attachItemBeforeId,
		attachItemAfterId: attachItemAfterId,
		attachItemInsideId: attachItemInsideId,
		
		attachItemMapAfterId: utilsLive.attachItemMapAfterId,
		attachItemMapBeforeId: utilsLive.attachItemMapBeforeId,
		attachItemMapInsideId: utilsLive.attachItemMapInsideId,
		attachItemMapAfterItem: utilsLive.attachItemMapAfterItem,
		attachItemMapBeforeItem: utilsLive.attachItemMapBeforeItem,
		attachItemMapInsideItem: utilsLive.attachItemMapInsideItem,
		
		attachItemImageAfterId: utilsLive.attachItemImageAfterId,
		attachItemImageBeforeId: utilsLive.attachItemImageBeforeId,
		attachItemImageInsideId: utilsLive.attachItemImageInsideId,
		attachItemImageAfterItem: utilsLive.attachItemImageAfterItem,
		attachItemImageBeforeItem: utilsLive.attachItemImageBeforeItem,
		attachItemImageInsideItem: utilsLive.attachItemImageInsideItem,
		
		attachItemMultimediaAfterId: utilsLive.attachItemMultimediaAfterId,
		attachItemMultimediaBeforeId: utilsLive.attachItemMultimediaBeforeId,
		attachItemMultimediaInsideId: utilsLive.attachItemMultimediaInsideId,
		attachItemMultimediaAfterItem: utilsLive.attachItemMultimediaAfterItem,
		attachItemMultimediaBeforeItem: utilsLive.attachItemMultimediaBeforeItem,
		attachItemMultimediaInsideItem: utilsLive.attachItemMultimediaInsideItem
	}
}

// ONLY FOR DEBUG
if (DEBUG) {
	window.items = items;
	window.itemNames = itemNames;
	window.itemsToDraw = itemsToDraw;
	window.itemsLive = itemsLive;
	window.itemSocket = itemSocket;
	window.itemSocketNames = itemSocketNames;
	
	window._extractItem = _extractItem;
	window.here = here;
	
	window.itemsAdvanced = itemsAdvanced;
	window.elementsAfter = elementsAfter;
}



// ************* UTILS ************** //

// writable:false, configurable:false

// DEFINE B SUBCLASS OF A
// B.prototype = new A;  // Define sub-class
// B.prototype.constructor = B;

// measure performance of a function
//    console.time("a");
//    console.timeEnd("a");
// var start = (new Date).getTime();
/* Run a test. */
// var diff = (new Date).getTime() - start;

// SAVE TO LOCAL STORAGE
// localStorage.provaLocal = JSON.stringify(provaOggetto);
// var oggettoRecuperato = JSON.parse(localStorage.provaLocal);   

})();
