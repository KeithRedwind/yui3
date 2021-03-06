(function() {

    var tests = (window.location.search.match(/[?&]tests=([^&]+)/) || [])[1] || null,
        filter = (window.location.search.match(/[?&]filter=([^&]+)/) || [])[1] || null,
        showConsole = (window.location.search.match(/[?&]console=([^&]+)/) || [])[1] || null,
        name = YUI.Env.Tests.name,
        projectAssets = YUI.Env.Tests.project,
        assets = YUI.Env.Tests.assets,
        auto = YUI.Env.Tests.auto || YUI().UA.phantomjs,
        examples = YUI.Env.Tests.examples,
        newWindow = YUI.Env.Tests.newWindow,
        isExample = false, i;

    
    for (i = 0; i < examples.length; i++) {
        if (name === examples[i]) {
            isExample = true;
        }
    }
    if (newWindow === 'true') {
        isExample = false;
    }

    if (!isExample) { //Don't test landing pages
        return false;
    }

    if (auto) {
        filter = filter || 'raw';
        tests = true;
    }

    if (filter) {
        YUI.applyConfig({
            filter: filter
        });
    }

    if (!tests) {
        //Abort the tests.
        return;
    }

    window.onerror = function(msg) {
        if (msg.indexOf('Error loading script') === -1) {
            YUI.Env.windowError = msg;
        }
        return true;
    };
    var mods = {
        'runner-css': projectAssets + '/yui/test-runner.css'
    };
    mods[name + '-tests'] = {
        fullpath: assets + '/' + name + '-tests.js',
        requires: [ 'test', 'runner-css' ]
    };

    YUI({
        modules: mods
    }).use(name + '-tests', 'test-console', function(Y, status) {
        var log, testConsole,
            renderLogger = function() {
                if (!log) {
                    log = Y.Node.create('<div id="logger" class="yui3-skin-sam"/>');
                    Y.one('body').prepend(log);
                    testConsole = (new Y.Test.Console()).render('#logger');
                    testConsole.collapse();
                    if (!auto && !showConsole) {
                        testConsole.hide();
                    }
                }
        };

        renderLogger();
        
        if (filter || showConsole) {
            Y.all('a').each(function(item) {
                var url = item.getAttribute('href');
                if (url.indexOf('#') === -1) {
                    var f = [];
                    if (filter) {
                        f.push('filter=' + filter);
                    }
                    if (showConsole) {
                        f.push('console=' + showConsole);
                    }
                    item.set('href', url + '?' + f.join('&'));
                }
            });
        }


        var counter = 0,
        count = function() {
            counter++;
        },
        testCase = new Y.Test.Case({
            name: 'Checking for load failure',
            'automated test script loaded': function() {
                Y.Assert.isTrue(status.success, 'Automated script 404ed');
            },
            'window.onerror called': function() {
                Y.Assert.isUndefined(YUI.Env.windowError, 'window.onerror fired');
            },
            'check for automated Y.TestCase': function() {
                Y.Assert.isTrue(Y.Test.Runner.masterSuite.items.length > 1, 'Automated script does not contain a Y.Test.Case');
            },
            'check for tests': function() {
                var num = Y.Object.keys(this).length - 3; //name, _should & this test
                if (num === counter) {
                    Y.Assert.fail('Automated script contains no tests');
                }
                Y.Assert.pass('All Good');
            }
        });

        Y.Test.Runner.on('pass', count);
        Y.Test.Runner.on('fail', count);
        Y.Test.Runner.on('ignored', count);

        Y.Test.Runner.add(testCase);
        
        Y.Test.Runner._ignoreEmpty = false; //Throw on no assertions
        Y.Test.Runner.setName('Automated ' + name + ' tests');
        Y.Test.Runner.on('complete', function(e) {
            
            if (e.results.failed) {
                testConsole.show();
            }

            if (log) {
            var header = log.one('.yui3-console-hd h4');

                if (e.results.failed) {
                    log.addClass('failed');
                    header.setHTML(e.results.failed + ' tests failed!');
                    testConsole.expand();
                } else {
                    header.setHTML('All tests passed!');
                    log.addClass('passed');
                }
            }
        });
        Y.Test.Runner.run();
    });

}());


