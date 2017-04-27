/* eslint-disable func-names */
import {
    buildSubscriberList,
    getArgumentNames,
    getIsEnabled,
    getIsLoggingEnabled,
    isFunction,
    makeErrorSubscriberFailback,
    notifyErrorSubscribers
} from '../src/error-catch-notifier';

import {
    disableErrorCatching,
    disableLogging,
    enableErrorCatching,
    enableLogging,
    initErrorCatchNotifier,
    wrap
} from '../src/index';

const chai = require('chai');
const stub = require('sinon').stub;
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('error-catch-notifier', function () {
    describe('getArugmentNames', function () {
        it('returns an array of argument names', function () {
            const functionFixture = function (argument1, argument2) { // eslint-disable-line no-unused-vars
                return true;
            };

            expect(getArgumentNames(functionFixture))
                .to.eql(['argument1', 'argument2']);
        });

        it('ignores inline comments', function () {
            const functionFixture = function (argument1 /*inline comment*/, argument2) { // eslint-disable-line

                return true;
            };

            expect(getArgumentNames(functionFixture))
                .to.eql(['argument1', 'argument2']);
        });
    });

    describe('isFunction', function () {
        it('returns true when appled to a function', function () {
            const functionFixture = function () {};

            expect(isFunction(functionFixture))
                .to.eql(true);
        });

        it('returns false when applied to an object or array', function () {
            const objectFixture = {};
            const arrayFixture = [];

            expect(isFunction(objectFixture))
                .to.eql(false);

            expect(isFunction(arrayFixture))
                .to.eql(false);
        });
    });

    describe('buildSubscriberList', function () {
        it('returns an array of error subscribers', function () {
            const errorSubscribers = [
                function errorSubscriber1(error) {}, // eslint-disable-line no-unused-vars
                function errorSubscriber2(error) {} // eslint-disable-line no-unused-vars
            ];

            expect(buildSubscriberList(errorSubscribers))
                .to.eql([errorSubscribers[0], errorSubscribers[1]]);
        });

        it('filters error subscribers with first arguments not named error', function () {
            const errorSubscribers = [
                function errorSubscriber(error) {}, // eslint-disable-line no-unused-vars
                function badErrorSubscriber() {}
            ];

            expect(buildSubscriberList(errorSubscribers))
                .to.eql([errorSubscribers[0]]);
        });

        it('logs a warning when an errorSubscriber with the wrong signature is filtered when loggingIsEnabled is true', function () {
            const errorSubscribers = [
                function errorSubscriber(error) {}, // eslint-disable-line no-unused-vars
                function badErrorSubscriber() {}
            ];

            const consoleWarnStub = stub(console, 'warn');

            enableLogging();

            buildSubscriberList(errorSubscribers);

            expect(consoleWarnStub)
                .to.have.been.calledWith('Skipping error subscriber: badErrorSubscriber');

            expect(consoleWarnStub)
                .to.have.been.calledWith('First argument of subscriber function must be named error');

            consoleWarnStub.restore();
            disableLogging();
        });

        it('filters error subscribers that are not functions when loggingIsEnabled is true', function () {
            const errorSubscribers = [
                function errorSubscriber(error) {}, // eslint-disable-line no-unused-vars
                {}
            ];

            expect(buildSubscriberList(errorSubscribers))
                .to.eql([errorSubscribers[0]]);
        });

        it('logs a warning when an errorSubscriber that is not a function is filtered and loggingIsEnabled is true', function () {
            const errorSubscribers = [
                function errorSubscriber(error) {}, // eslint-disable-line no-unused-vars
                {}
            ];

            const consoleWarnStub = stub(console, 'warn');

            enableLogging();

            buildSubscriberList(errorSubscribers);

            expect(consoleWarnStub)
                .to.have.been.calledWith('Skipping error subscriber: [object Object] at errorSubscribers index 1');

            expect(consoleWarnStub)
                .to.have.been.calledWith('Subscriber is not a function');

            consoleWarnStub.restore();
            disableLogging();
        });

        afterEach(function () {
            if (console.warn.restore) {
                console.warn.restore();
            }
        });
    });

    describe('enableLogging', function () {
        it('sets _isLoggingEnabled to true', function () {
            // set up
            const errorSubscribers = [
                function errorSubscriber(error) {} // eslint-disable-line no-unused-vars
            ];

            initErrorCatchNotifier(errorSubscribers, true, false);

            expect(getIsLoggingEnabled())
                .to.be.false;

            // test
            enableLogging();

            // assert
            expect(getIsLoggingEnabled())
                .to.be.true;
        });
    });

    describe('disableLogging', function () {
        it('sets _isLoggingEnabled to false', function () {
            // set up
            const errorSubscribers = [
                function errorSubscriber(error) {} // eslint-disable-line no-unused-vars
            ];

            initErrorCatchNotifier(errorSubscribers, true, true);

            expect(getIsLoggingEnabled())
                .to.be.true;

            // test
            disableLogging();

            // assert
            expect(getIsLoggingEnabled())
                .to.be.false;
        });
    });

    describe('enableErrorCatching', function () {
        let consoleWarnStub;

        it('sets _isEnabled to true when there are errorSubscribers', function () {
            // set up
            const errorSubscribers = [
                function errorSubscriber(error) {} // eslint-disable-line no-unused-vars
            ];

            initErrorCatchNotifier(errorSubscribers, false, false);

            expect(getIsEnabled())
                .to.be.false;

            // test
            enableErrorCatching();

            // assert
            expect(getIsEnabled())
                .to.be.true;

            // clean up
            disableErrorCatching();
        });

        it('sets _isEnabled to false when there are no errorSubscribers', function () {
            // set up
            initErrorCatchNotifier(undefined, false, false);

            expect(getIsEnabled())
                .to.be.false;

            // test
            enableErrorCatching();

            // assert
            expect(getIsEnabled())
                .to.be.false;
        });

        it('logs a warning when there are no errorSubscribers when _isLoggingEnabled is true', function () {
            // set up
            consoleWarnStub = stub(console, 'warn');
            initErrorCatchNotifier(undefined, false, true);

            expect(getIsEnabled())
                .to.be.false;

            // test
            enableErrorCatching();

            // assert
            expect(consoleWarnStub)
                .to.have.been.calledWith('No valid error subscribers provided. Use init to pass valid error subscribers');

            consoleWarnStub.restore();
        });

        afterEach(function () {
            if (consoleWarnStub) {
                consoleWarnStub.restore();
            }
        });
    });

    describe('disableErrorCatching', function () {
        it('sets _isEnabled to false', function () {
            // set up
            const errorSubscribers = [
                function errorSubscriber(error) {} // eslint-disable-line no-unused-vars
            ];

            initErrorCatchNotifier(errorSubscribers, true, false);

            expect(getIsEnabled())
                .to.be.true;

            // test
            disableErrorCatching();

            // assert
            expect(getIsEnabled())
                .to.be.false;

            // clean up
            disableErrorCatching();
        });
    });

    describe('initErrorCatchNotifier', function () {
        let consoleErrorStub;

        it('sets _isEnabled and _isLoggingEnabled to true when their respective arguments are true', function () {
            // set up
            const errorSubscribers = [
                function errorSubscriber(error) {} // eslint-disable-line no-unused-vars
            ];
            expect(getIsLoggingEnabled())
                .to.be.false;
            expect(getIsEnabled())
                .to.be.false;

            // test
            initErrorCatchNotifier(errorSubscribers, true, true);

            // assert
            expect(getIsLoggingEnabled())
                .to.be.true;

            expect(getIsEnabled())
                .to.be.true;

            // clean up
            disableErrorCatching();
            disableLogging();
        });

        it('reports an error if errorSubscriberFunctions is not an array', function () {
            // set up
            const errorSubscribers = {
                errorSubscriber: function errorSubscriber(error) {} // eslint-disable-line no-unused-vars
            };

            consoleErrorStub = stub(console, 'error');

            // test
            initErrorCatchNotifier(errorSubscribers, true, true);

            // assert
            expect(consoleErrorStub)
                .to.have.been.calledWith('errorSubscriberFunctions must be an array of functions');

            // clean up
            disableErrorCatching();
            disableLogging();
            consoleErrorStub.restore();
        });

        afterEach(function () {
            if (consoleErrorStub) {
                consoleErrorStub.restore();
            }
        });
    });

    describe('makeErrorSubscriberFailback', function () {
        beforeEach(function () {
            const errorSubscribers = [
                function errorSubscriber(error) {}, // eslint-disable-line no-unused-vars
                {}
            ];

            initErrorCatchNotifier(errorSubscribers, false, true);
        });

        it('logs the failback error with errorSubscriberName when called with an error when _isLoggingEnabled is true', function () {
            // set up
            const consoleErrorStub = stub(console, 'error');

            const sutErrorSubscriberFailback = makeErrorSubscriberFailback('errorSubscriber10');

            // test
            sutErrorSubscriberFailback('myError');

            // assert
            expect(consoleErrorStub)
                .to.have.been.calledWith('Error subscriber errorSubscriber10 failed with error');

            expect(consoleErrorStub)
                .to.have.been.calledWith('myError');

            consoleErrorStub.restore();
        });

        it('logs the failback data with errorSubscriberName when called with an error when _isLoggingEnabled is true', function () {
            // set up
            const consoleLogStub = stub(console, 'log');

            const sutErrorSubscriberFailback = makeErrorSubscriberFailback('errorSubscriber10');

            // test
            sutErrorSubscriberFailback(undefined, 'mySuccess');

            // assert
            expect(consoleLogStub)
                .to.have.been.calledWith('Error subscriber errorSubscriber10 succeeded with');

            expect(consoleLogStub)
                .to.have.been.calledWith('mySuccess');

            consoleLogStub.restore();
        });

        afterEach(function () {
            disableLogging();

            if (console.error.restore) {
                console.error.restore();
            }

            if (console.log.restore) {
                console.log.restore();
            }
        });
    });

    describe('notifyErrorSubscribers', function () {
        it('calls all error subscribers with the error and an errorSubscriberFailback', function () {
            let resultError;
            const errorSubscribers = [
                function (error) {
                    resultError = error;
                }
            ];

            const testError = new Error('testError');

            initErrorCatchNotifier(errorSubscribers, false, false);

            notifyErrorSubscribers(testError);

            expect(resultError)
                .to.equal(testError);
        });
    });

    describe('wrap', function () {
        it('returns a function wrapped in a try catch', function () {
            let resultError;
            const errorSubscribers = [
                function (error) {
                    resultError = error;
                }
            ];

            const testError = new Error('testError');

            const errorFunction = function () {
                throw testError;
            };

            initErrorCatchNotifier(errorSubscribers, true, false);

            wrap(errorFunction)();

            expect(resultError)
                .to.equal(testError);
        });
    });
});
