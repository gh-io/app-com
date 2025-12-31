(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.appCom = factory());
}(this, (function () { 'use strict';

var ERRORS = {
    SPEARATOR_NOT_SET: 'Set separator first with .setSeparator().',
    SPEARATOR_NO_STRING: 'Separator must be a string.',
    SPEARATOR_LENGHT: 'Separator length should be 1 - wtf, are you doing?',
    EVENTLIST_WRONG_FORMAT: 'Event list must be an array or object.',
    EVENT_NAME_DUPLICATES: 'Duplicate event names.',
    NO_EVENT_NAMES_FOUND: 'No event names registered.',
    EVENT_NAME_NOT_REGISTERED: 'Event name must be registered before using it.',
    EVENT_NAME_NOT_STRING: 'Event must be a string.',
    EVENT_NAME_NO_SEPARATOR: 'Event must start with the separator char "{0}".',
    EVENT_NAME_IS_WILDCARD: 'Event name can not be a wildcard. It can not end with "{0}".',
    SUB_WAS_KILLED_BEFORE: 'Tried to call a method on killed subscription.',
    SUB_WAS_STARTED_BEFORE: 'Subscription was stared before.',
    SUB_WAS_STOPPED_BEFORE: 'Subscription was stopped before.',
    EVENT_DATA_NOT_OBJECT: 'Event data must be an object.',
    EVENT_CALLBACK_NOT_FUNCTION: 'Event callback must be a function.',
    REGISTER_EMPTY: 'No events are registered. Register them before using the library!',
    REGISTER_NOT_DYNAMIC: 'Do not change the event registry dynamically! Create a event hub an pass it at init of your app.',
    SEPARATOR_NOT_DYNAMIC: 'Do not change the event separator dynamically! Create a event hub an pass the separator at init of your app.'
};

function replaceAll(search, replacement, target) {
    return target.split(search).join(replacement);
}

function insert(target) {
    var placeholderStart = '{',
        placeholderEnd = '}';

    for (var _len = arguments.length, replacements = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        replacements[_key - 1] = arguments[_key];
    }

    for (var _iterator = replacements.entries(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
        } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
        }

        var _ref2 = _ref,
            i = _ref2[0],
            value = _ref2[1];

        target = replaceAll(placeholderStart + i + placeholderEnd, value, target);
    }
    return target;
}

function inArray(needle, object, searchInKey) {

    if (Object.prototype.toString.call(needle) === '[object Object]' || Object.prototype.toString.call(needle) === '[object Array]') {
        needle = JSON.stringify(needle);
    }

    return Object.keys(object).some(function (key) {

        var value = object[key];

        if (Object.prototype.toString.call(value) === '[object Object]' || Object.prototype.toString.call(value) === '[object Array]') {
            value = JSON.stringify(value);
        }

        if (searchInKey) {
            if (value === needle || key === needle) {
                return true;
            }
        } else {
            if (value === needle) {
                return true;
            }
        }
    });
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Com$1 = (function () {

    var separator = false,
        registeredEventNames = [];

    var subscriptions = {},
        events = [];

    return {
        broadcast: broadcast,
        subscribe: subscribe,
        registerEventNames: registerEventNames,
        setSeparator: setSeparator
    };

    /////////////////////////////

    function registerEventNames(names) {

        checkSeparator();

        if (registeredEventNames.length > 0) {
            throw new Error(ERRORS.REGISTER_NOT_DYNAMIC);
        }

        var namesFound = [];

        if (isArray(names)) {
            names.forEach(function (name) {
                namesFound.push(name);
            });
        } else if (isObject(names)) {
            namesFound = getAllPropertyValues(names);
        } else {
            throw new Error(ERRORS.EVENTLIST_WRONG_FORMAT);
        }

        var namesClean = cleanDuplicatesInArray(namesFound);

        if (namesClean.length !== namesFound.length) {
            throw new Error(ERRORS.EVENT_NAME_DUPLICATES);
        }

        if (namesClean.length === 0) {
            throw new Error(ERRORS.NO_EVENT_NAMES_FOUND);
        }

        registeredEventNames = namesClean;
    }

    function setSeparator(sep) {
        if (separator !== false) {
            throw new Error(ERRORS.SEPARATOR_NOT_DYNAMIC);
        }
        if (!isString(sep)) {
            throw new Error(ERRORS.SPEARATOR_NO_STRING);
        }
        if (sep.length !== 1) {
            throw new Error(ERRORS.SPEARATOR_LENGHT);
        }
        separator = sep;
    }

    function subscribe(eventName, callback) {

        checkForRegisteredEvents();

        checkEventName(eventName);

        if (!isFunction(callback)) {
            throw new Error(ERRORS.EVENT_CALLBACK_NOT_FUNCTION);
        }

        var id = createUniqueIdFor(subscriptions);

        subscriptions[id] = {
            id: id, // unique id for the subscription
            eventName: eventName, // path like representation as string
            callback: callback, // callback
            isActive: false, // for starting and stopping
            isAlive: true // for killing
        };

        return {
            kill: function kill() {
                checkSubscription(id);
                subscriptions[id].isAlive = false;
            },
            stop: function stop() {
                checkSubscriptionForStopping(id);
                subscriptions[id].isActive = false;
            },
            start: function start() {
                checkSubscriptionForStarting(id);
                subscriptions[id].isActive = true;
            },
            startWithLast: function startWithLast() {
                checkSubscriptionForStarting(id);
                subscriptions[id].isActive = true;
                var match = getLastItem(getMatchingEvents(eventName));
                if (match) {
                    callback(match.eventData, match);
                }
            },
            startWithAll: function startWithAll() {
                checkSubscriptionForStarting(id);
                subscriptions[id].isActive = true;
                var matches = getMatchingEvents(eventName);
                matches.forEach(function (match) {
                    callback(match.eventData, match);
                });
            }
        };
    }

    function broadcast(eventName) {
        var eventData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


        checkForRegisteredEvents();

        checkEventNameForBroadcasting(eventName);

        if (!isObject(eventData)) {
            throw new Error(ERRORS.EVENT_DATA_NOT_OBJECT);
        }

        var event = {
            timestamp: Date.now(),
            eventName: eventName,
            eventData: eventData
        };

        events.push(event);

        Object.keys(subscriptions).forEach(function (key) {

            var subscription = subscriptions[key];

            if (subscription.isActive && subscription.isAlive) {

                if (isCatchAllEvent(subscription.eventName)) {

                    subscription.callback(event.eventData, event);
                } else if (isWildcardEvent(subscription.eventName)) {

                    if (isWildcardEventMatching(subscription.eventName, event.eventName)) {
                        subscription.callback(event.eventData, event);
                    }
                } else if (subscription.eventName === event.eventName) {
                    subscription.callback(event.eventData, event);
                }
            }
        });
    }

    function checkSeparator() {
        if (separator === false) {
            throw new Error(ERRORS.SPEARATOR_NOT_SET);
        }
    }

    function checkForRegisteredEvents() {
        checkSeparator();
        if (registeredEventNames.length === 0) {
            throw new Error(ERRORS.REGISTER_EMPTY);
        }
    }

    function checkEventName(eventName) {

        if (!isString(eventName)) {
            throw new Error(ERRORS.EVENT_NAME_NOT_STRING);
        }

        if (!startsWithSeparator(eventName)) {
            throw new Error(insert(ERRORS.EVENT_NAME_NO_SEPARATOR, separator));
        }

        if (!isRegistered(eventName)) {
            throw new Error(ERRORS.EVENT_NAME_NOT_REGISTERED);
        }
    }

    function checkEventNameForBroadcasting(eventName) {

        checkEventName(eventName);

        if (isCatchAllEvent(eventName) || isWildcardEvent(eventName)) {
            throw new Error(ERRORS.EVENT_NAME_IS_WILDCARD);
        }
    }

    function getMatchingEvents(eventName) {
        var matches = [];

        if (isCatchAllEvent(eventName)) {
            matches = events;
        } else if (isWildcardEvent(eventName)) {
            events.some(function (e) {
                if (isWildcardEventMatching(eventName, e.eventName)) {
                    matches.push(e);
                }
            });
        } else {
            events.some(function (e) {
                if (eventName === e.eventName) {
                    matches.push(e);
                }
            });
        }

        return matches;
    }

    function isRegistered(eventName) {
        return inArray(eventName, registeredEventNames);
    }

    function startsWithSeparator(something) {
        return something.charAt(0) === separator;
    }

    function isCatchAllEvent(eventName) {
        return eventName === separator;
    }

    function isWildcardEvent(eventName) {
        return eventName.slice(-1) === separator;
    }

    function isWildcardEventMatching(wildcardEventName, eventName) {
        return eventName.substring(0, wildcardEventName.length) === wildcardEventName;
    }

    function getLastItem(arr) {
        if (typeof arr[arr.length - 1] !== 'undefined') {
            return arr[arr.length - 1];
        } else {
            return false;
        }
    }

    function checkSubscription(id) {
        if (typeof subscriptions[id] === 'undefined' || !subscriptions[id].isAlive) {
            throw new Error(ERRORS.SUB_WAS_KILLED_BEFORE);
        }
    }

    function checkSubscriptionForStarting(id) {
        checkSubscription(id);
        if (subscriptions[id].isActive === true) {
            throw new Error(ERRORS.SUB_WAS_STARTED_BEFORE);
        }
    }

    function checkSubscriptionForStopping(id) {
        checkSubscription(id);
        if (subscriptions[id].isActive === false) {
            throw new Error(ERRORS.SUB_WAS_STOPPED_BEFORE);
        }
    }
});

/////////////


function createUniqueIdFor(variable) {
    var id = void 0;
    while (!id || typeof variable[id] !== 'undefined') {
        id = Math.random().toString(36).substr(2, 9);
    }
    return id;
}

function isFunction(something) {
    return something && typeof something === 'function';
}

function isString(something) {
    return typeof something === 'string';
}

function isArray(obj) {
    return obj && Array.isArray(obj);
}

function isObject(data) {
    return data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && !Array.isArray(data);
}

function getAllPropertyValues() {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var values = [];
    Object.keys(obj).forEach(function (key) {
        if (isObject(obj[key])) {
            getAllPropertyValues(obj[key]).forEach(function (v) {
                values.push(v);
            });
        } else {
            values.push(obj[key]);
        }
    });
    return values;
}

function cleanDuplicatesInArray(arr) {
    var i = void 0,
        len = arr.length,
        out = [],
        obj = {};

    for (i = 0; i < len; i++) {
        obj[arr[i]] = 0;
    }
    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            out.push(i);
        }
    }
    return out;
}

return Com$1;

})));
