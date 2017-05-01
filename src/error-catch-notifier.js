/**
 * Error catching is enabled
 * @member {bool}
 */
let _isEnabled = false;

/**
 * Error logging is enabled
 * @member {bool}
 */
let _isLoggingEnabled = false;

/**
 * A function that takes as its first argument a parameter named error
 * The first argument of an errorSubscriber must be named error
 * @typedef {function} ErrorSubscriber
 * @param {error} error - error object
 * @param {object} [options] - options passed to subscriber from wrap or notifiySubscribers
 * @param {function} [failback] - failback for logging async errors / success
 */

/**
 * Array of functions called when an error is caught
 * @member {function[]} errorSubscriberFunctions
 * @param {ErrorSubscriber} errorSubscriberFunctions[]
 */
let _errorSubscribers = [];

/**
 * Returns an array of argument names from a function
 * @param {function} targetFunction - function definition
 * @return {string[]} names of function definition's arguments
 */
export function getArgumentNames(targetFunction) {
    // First match everything inside the function argument parens.
    let args;
    try {
        args = targetFunction.toString().match(/function\s.*?\(([^)]*)\)/)[1];
    } catch (error) {
        return [];
    }

    // Split the arguments string into an array comma delimited.
    return args.split(',').map(function argsTrimCommentsAndWhiteSpace(arg) {
    // Ensure no inline comments are parsed and trim the whitespace.
        return arg.replace(/\/\*.*\*\//, '').trim();
    }).filter(function filterUndefined(arg) {
    // Ensure no undefined values are added.
        return arg;
    });
}

/**
 * Determines if object is a function
 * @param {object} obj - any value with object on its prototype chain
 * @return {bool} true if obj is a function; false if not
 */
export function isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
}

export function buildSubscriberList(errorSubscriberFunctions = []) {
    return errorSubscriberFunctions.filter(function errorSubscriberFunctionsFilter(subscriberCallback, index) {
        // subscribers must be a function
        if (!isFunction(subscriberCallback)) {
            if (_isLoggingEnabled) {
                console.warn(`Skipping error subscriber: ${subscriberCallback} at errorSubscribers index ${index}`);
                console.warn('Subscriber is not a function');
            }

            return false;
        }

        // subscribers must take an error as their first argument
        const subscriberFunctionArgumentNames = getArgumentNames(subscriberCallback);
        if (subscriberFunctionArgumentNames[0] !== 'error') {
            if (_isLoggingEnabled) {
                console.warn(`Skipping error subscriber: ${subscriberCallback.name}`);
                console.warn('First argument of subscriber function must be named error');
            }

            return false;
        }

        return true;
    });
}

/**
 * Sets error messages to be logged to console
 */
export function enableLogging() {
    _isLoggingEnabled = true;
}

export function disableLogging() {
    _isLoggingEnabled = false;
}

/**
 * Sets error catching on
 */
export function enableErrorCatching() {
    if (_errorSubscribers.length === 0) {
        if (_isLoggingEnabled) {
            console.warn('No valid error subscribers provided. Use init to pass valid error subscribers');
        }

        _isEnabled = false;

        return;
    }

    _isEnabled = true;
}

/**
 * Sets error catching off
 */
export function disableErrorCatching() {
    _isEnabled = false;

    return true;
}

/**
 * Sets _errorSubscribers array
 * @param {function[]} errorSubscriberFunctions - array of ErrorSubscriber
 * @param {ErrorSubscriber} errorSubscriberFunctions[] - function called when error is caught by wrap
 * @param {bool} [enabled=false] - errors caught by wrap will be passed to errorSubscribers when true
 * @param {bool} [loggingEnabled=false] - error messages will be logged to console when true
 */
export function initErrorCatchNotifier(errorSubscriberFunctions = [], enabled = false, loggingEnabled = false) {
    loggingEnabled ? enableLogging() : disableLogging();

    if (!Array.isArray(errorSubscriberFunctions)) {
        if (_isLoggingEnabled) {
            console.error('errorSubscriberFunctions must be an array of functions');

            return;
        }
    }

    _errorSubscribers = buildSubscriberList(errorSubscriberFunctions);

    enabled ? enableErrorCatching() : disableErrorCatching();
}

/**
 * Failback error subscribers are called with
 * Used as a hook for module to log errors caused by async behavior in errorSubscriber
 * @typedef {function} ErrorSubscriberFailback
 * @param {error} error - error object
 * @param {data} data - success data
 */

/**
 * Curries error subscriber name with error subscriber failback
 * @param {string} errorSubscriberName - name of error subscriber; typically the function name is used
 * @return {ErrorSubscriberFailback}
 */
export function makeErrorSubscriberFailback(errorSubscriberName) {
    return function errorSubscriberFailback(error, data) {
        if (!_isLoggingEnabled) {
            return;
        }

        if (error) {
            console.error(`Error subscriber ${errorSubscriberName} failed with error`);
            console.error(error);
        }

        if (data) {
            console.log(`Error subscriber ${errorSubscriberName} succeeded with`);
            console.log(data);
        }
    };
}

/**
 * Passes an error to each callback in _errorSubscribers
 * @param {error} error
 * @param {object} options
 */
export function notifyErrorSubscribers(error, options) {
    for (let i = 0; i < _errorSubscribers.length; i += 1) {
        const errorSubscriber = _errorSubscribers[i];
        try {
            errorSubscriber(error, options, makeErrorSubscriberFailback(errorSubscriber.name));
        } catch (catchError) {
            if (!_isLoggingEnabled) {
                return;
            }

            console.error(`Skipping error subscriber: ${errorSubscriber.name}`);
            console.error(catchError);
        }
    }
}

/**
 * Wrap a target function in a try catch.
 * Errors caught by this block will be passed to _errorSubscribers
 * @param {function} targetFunction - function definition to be wrapped in try catch
 * @param {object} options - options passed to notifiyErrorSubscribers
 */
export function wrap(targetFunction, options) {
    return function wrappedFunction(...args) {
        if (!_isEnabled) {
            return targetFunction.apply(this, args);
        }

        let value;

        try {
            value = targetFunction.apply(this, args);
        } catch (error) {
            notifyErrorSubscribers(error, options);
        }

        return value;
    };
}

/**
 * Gets _isEnabled
 * For unit tests
 */
export function getIsEnabled() {
    return _isEnabled;
}

/**
 * Gets _isLoggingEnabled
 * For unit tests
 */
export function getIsLoggingEnabled() {
    return _isLoggingEnabled;
}
