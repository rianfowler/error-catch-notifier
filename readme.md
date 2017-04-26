# Error Catch Notifier

Wrap your functions. Report your errors to an array of callbacks.

## Installation

`npm install error-catch-notifier --save`

## Quickstart

1. Make your error callback (named functions are best)
```
const myErrorCallback = function myErrorCallback(error) { // first argument must be named error
    /* do something with the error */
};
```

2. Set up the notifier
```
import { initErrorCatchNotifier } from 'error-catch-notifier';

initErrorCatchNotifier([myErrorCallback], true); // you can give it as many callbacks as you want
```

3. Wrap your functions
```
import { wrap } from 'error-catch-notifier';

// named functions are best
const myWrappedFunction = wrap(function myFunction() { ... });
myWrappedFunction();
```

Any errors that occur in your wrapped functions will be caught and passed to your error callbacks.

## Details
1. Initialization

`initErrorCatchNotifier(errorSubscriberFunctions = [], enabled = false, loggingEnabled = false)`

`errorSubscriberFunctions` - array of callbacks- each callback must have `error` as its first argument

`enabled` - error catching is off by default. When true, errors are caught, sent to error subscribers, and swallowed. When false, errors pass through normal call chain.

`loggingEnabled` - error logging is off by default. When on, module error messages are logged to console. This does not control error logging for wrapped functions- errors caught by `wrap` are not console logged by this module when `enabled` is true.

2. Controlling Logging and Error Catching

`disableErrorCatching()` and `enableErrorCatching()` control error catching. This flag is checked before every wrapped function execution.
`disableLogging()` and `enableLogging()` control module error logging.

3. Logging errors from async errorSubscribers

This module provides a failback to error subscribers for logging async results

Enable logging
```
enableLogging();

OR

initErrorCatchNotifier([myErrorCallback], true, true); // third true turns on error logging
```

Call the failback in the error callback given to init
```
const myErrorCallback = function myErrorCallback(error, failback) {
    /* do something async with the error */

    // success e.g. inside .then()
    failback(undefined, successDataYouWantConsoleLogged);

    // failure e.g. inside .catch()
    failback(errorYouWantConsoleLogged);
};
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

Pull requests should have passing unit tests.

## Maintenance Commands

`npm run build` - lints, unit tests, and compiles

`npm run compile` - compiles index and main source into dist folder

`npm run lint` - runs eslint on source and test files

`npm run test` - runs lint and unit tests

## License

MIT License

Copyright (c) 2017 Rian Fowler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
