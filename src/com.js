import ERRORS  from './ErrorMessages.js';
import { inArray, insert } from './Util';

export default () => {

    let separator            = false,
        registeredEventNames = [];

    let subscriptions = {},
        events        = [];

    return {
        broadcast          : broadcast,
        subscribe          : subscribe,
        registerEventNames : registerEventNames,
        setSeparator       : setSeparator
    };

    /////////////////////////////

    function registerEventNames( names ) {

        checkSeparator();

        if ( registeredEventNames.length > 0 ) {
            throw new Error( ERRORS.REGISTER_NOT_DYNAMIC );
        }

        let namesFound = [];

        if ( isArray( names ) ) {
            names.forEach( name => {
                namesFound.push( name );
            } );
        } else if ( isObject( names ) ) {
            namesFound = getAllPropertyValues( names );
        } else {
            throw new Error( ERRORS.EVENTLIST_WRONG_FORMAT );
        }

        let namesClean = cleanDuplicatesInArray( namesFound );

        if ( namesClean.length !== namesFound.length ) {
            throw new Error( ERRORS.EVENT_NAME_DUPLICATES );
        }

        if ( namesClean.length === 0 ) {
            throw new Error( ERRORS.NO_EVENT_NAMES_FOUND );
        }

        registeredEventNames = namesClean;
    }

    function setSeparator( sep ) {
        if ( separator !== false ) {
            throw new Error( ERRORS.SEPARATOR_NOT_DYNAMIC );
        }
        if ( !isString( sep ) ) {
            throw new Error( ERRORS.SPEARATOR_NO_STRING );
        }
        if ( sep.length !== 1 ) {
            throw new Error( ERRORS.SPEARATOR_LENGHT );
        }
        separator = sep;
    }

    function subscribe( eventName, callback ) {

        checkForRegisteredEvents();

        checkEventName( eventName );

        if ( !isFunction( callback ) ) {
            throw new Error( ERRORS.EVENT_CALLBACK_NOT_FUNCTION );
        }

        let id = createUniqueIdFor( subscriptions );

        subscriptions[ id ] = {
            id        : id,            // unique id for the subscription
            eventName : eventName,     // path like representation as string
            callback  : callback,      // callback
            isActive  : false,         // for starting and stopping
            isAlive   : true           // for killing
        };

        return {
            kill          : function () {
                checkSubscription( id );
                subscriptions[ id ].isAlive = false;
            },
            stop          : function () {
                checkSubscriptionForStopping( id );
                subscriptions[ id ].isActive = false;
            },
            start         : function () {
                checkSubscriptionForStarting( id );
                subscriptions[ id ].isActive = true;
            },
            startWithLast : function () {
                checkSubscriptionForStarting( id );
                subscriptions[ id ].isActive = true;
                let match = getLastItem( getMatchingEvents( eventName ) );
                if ( match ) {
                    callback( match.eventData, match );
                }
            },
            startWithAll  : function () {
                checkSubscriptionForStarting( id );
                subscriptions[ id ].isActive = true;
                let matches = getMatchingEvents( eventName );
                matches.forEach( match => {
                    callback( match.eventData, match );
                } );
            }
        };
    }

    function broadcast( eventName, eventData = {} ) {

        checkForRegisteredEvents();

        checkEventNameForBroadcasting( eventName );

        if ( !isObject( eventData ) ) {
            throw new Error( ERRORS.EVENT_DATA_NOT_OBJECT );
        }

        let event = {
            timestamp : Date.now(),
            eventName : eventName,
            eventData : eventData
        };

        events.push( event );

        Object.keys( subscriptions ).forEach( key => {

            let subscription = subscriptions[ key ];

            if ( subscription.isActive && subscription.isAlive ) {

                if ( isCatchAllEvent( subscription.eventName ) ) {

                    subscription.callback( event.eventData, event );

                } else if ( isWildcardEvent( subscription.eventName ) ) {

                    if ( isWildcardEventMatching( subscription.eventName, event.eventName ) ) {
                        subscription.callback( event.eventData, event );
                    }

                } else if ( subscription.eventName === event.eventName ) {
                    subscription.callback( event.eventData, event );
                }
            }
        } );
    }

    function checkSeparator() {
        if ( separator === false ) {
            throw new Error( ERRORS.SPEARATOR_NOT_SET );
        }
    }

    function checkForRegisteredEvents() {
        checkSeparator();
        if ( registeredEventNames.length === 0 ) {
            throw new Error( ERRORS.REGISTER_EMPTY );
        }
    }

    function checkEventName( eventName ) {

        if ( !isString( eventName ) ) {
            throw new Error( ERRORS.EVENT_NAME_NOT_STRING );
        }

        if ( !startsWithSeparator( eventName ) ) {
            throw new Error( insert( ERRORS.EVENT_NAME_NO_SEPARATOR, separator ) );
        }

        if ( !isRegistered( eventName ) ) {
            throw new Error( ERRORS.EVENT_NAME_NOT_REGISTERED );
        }
    }

    function checkEventNameForBroadcasting( eventName ) {

        checkEventName( eventName );

        if ( isCatchAllEvent( eventName ) || isWildcardEvent( eventName ) ) {
            throw new Error( ERRORS.EVENT_NAME_IS_WILDCARD );
        }
    }

    function getMatchingEvents( eventName ) {
        let matches = [];

        if ( isCatchAllEvent( eventName ) ) {
            matches = events;
        } else if ( isWildcardEvent( eventName ) ) {
            events.some( e => {
                if ( isWildcardEventMatching( eventName, e.eventName ) ) {
                    matches.push( e );
                }
            } );
        } else {
            events.some( e => {
                if ( eventName === e.eventName ) {
                    matches.push( e );
                }
            } );
        }

        return matches;
    }

    function isRegistered( eventName ) {
        return inArray( eventName, registeredEventNames );
    }

    function startsWithSeparator( something ) {
        return something.charAt( 0 ) === separator;
    }

    function isCatchAllEvent( eventName ) {
        return eventName === separator;
    }

    function isWildcardEvent( eventName ) {
        return eventName.slice( -1 ) === separator;
    }

    function isWildcardEventMatching( wildcardEventName, eventName ) {
        return eventName.substring( 0, wildcardEventName.length ) === wildcardEventName;
    }

    function getLastItem( arr ) {
        if ( typeof arr[ arr.length - 1 ] !== 'undefined' ) {
            return arr[ arr.length - 1 ];
        } else {
            return false;
        }
    }

    function checkSubscription( id ) {
        if ( typeof subscriptions[ id ] === 'undefined' || !subscriptions[ id ].isAlive ) {
            throw new Error( ERRORS.SUB_WAS_KILLED_BEFORE );
        }
    }

    function checkSubscriptionForStarting( id ) {
        checkSubscription( id );
        if ( subscriptions[ id ].isActive === true ) {
            throw new Error( ERRORS.SUB_WAS_STARTED_BEFORE );
        }
    }

    function checkSubscriptionForStopping( id ) {
        checkSubscription( id );
        if ( subscriptions[ id ].isActive === false ) {
            throw new Error( ERRORS.SUB_WAS_STOPPED_BEFORE );
        }
    }

};

/////////////


function createUniqueIdFor( variable ) {
    let id;
    while ( !id || typeof variable[ id ] !== 'undefined' ) {
        id = Math.random().toString( 36 ).substr( 2, 9 );
    }
    return id;
}

function isFunction( something ) {
    return something && typeof something === 'function';
}

function isString( something ) {
    return typeof something === 'string';
}

function isArray( obj ) {
    return obj && Array.isArray( obj );
}

function isObject( data ) {
    return data && typeof data === 'object' && !Array.isArray( data );
}

function getAllPropertyValues( obj = {} ) {
    let values = [];
    Object.keys( obj ).forEach( key => {
        if ( isObject( obj[ key ] ) ) {
            getAllPropertyValues( obj[ key ] ).forEach( v => {
                values.push( v );
            } );
        } else {
            values.push( obj[ key ] );
        }
    } );
    return values;
}

function cleanDuplicatesInArray( arr ) {
    let i,
        len = arr.length,
        out = [],
        obj = {};

    for ( i = 0; i < len; i++ ) {
        obj[ arr[ i ] ] = 0;
    }
    for ( i in obj ) {
        if ( obj.hasOwnProperty( i ) ) {
            out.push( i );
        }
    }
    return out;
}
