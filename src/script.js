/*!
 * $script.js Async loader & dependency manager
 * https://github.com/ded/script.js
 * (c) Dustin Diaz 2013
 * License: MIT
 */

/** @private */
var doc = document;
/** @private */
var head = doc.getElementsByTagName('head')[0]
/** @private */
var validBase = /^https?:\/\//
/** @private */
var list = {};
/** @private */
var ids = {};
/** @private */
var delay = {};
/** @private */
var scriptpath;
/** @private */
var scripts = {}
/** @private */
var s = 'string';
/** @private */
var f = false;
/** @private */
var push = 'push';
/** @private */
var domContentLoaded = 'DOMContentLoaded';
/** @private */
var readyState = 'readyState'
/** @private */
var addEventListenerName = 'addEventListenerName';
/** @private */
var onreadystatechangeName = 'onreadystatechangeName';

/** @private */
function every(ar, fn) {
    for (var i = 0, j = ar.length; i < j; ++i) if (!fn(ar[i])) return f
    return 1
}

/** @private */
function each(ar, fn) {
    every(ar, function(el) {
        return !fn(el)
    })
}

if (!doc[readyState] && doc[addEventListenerName]) {
    doc[addEventListenerName](domContentLoaded, function fn() {
        doc.removeEventListener(domContentLoaded, fn, f)
        doc[readyState] = 'complete'
    }, f)
    doc[readyState] = 'loading'
}

/**
 * @param {string|Array.<string>} paths
 * @param {(string|function())=} idOrDone
 * @param {function()=} optDone
 */
function $script(paths, idOrDone, optDone) {
    paths = paths[push] ? paths : [paths]
    var idOrDoneIsDone = idOrDone && typeof idOrDone == 'function'
        , done = /** @type {Function} */ (idOrDoneIsDone ? idOrDone : optDone)
        , id = idOrDoneIsDone ? paths.join('') : idOrDone
        , queue = paths.length
    function loopFn(item) {
        return item.call ? item() : list[item]
    }
    function callback() {
        if (!--queue) {
            list[id] = 1
            done && done()
            for (var dset in delay) {
                every(dset.split('|'), loopFn) && !each(delay[dset], loopFn) && (delay[dset] = [])
            }
        }
    }
    setTimeout(function () {
        each(paths, function (path) {
            if (path === null) return callback()
            if (scripts[path]) {
                id && (ids[id] = 1)
                return scripts[path] == 2 && callback()
            }
            scripts[path] = 1
            id && (ids[id] = 1)
            create(!validBase.test(path) && scriptpath ? scriptpath + path + '.js' : path, callback)
        })
    }, 0)
    return $script
}

/** @private */
function create(path, fn) {
    var el = doc.createElement('script')
        , loaded = f
    el.onload = el.onerror = el[onreadystatechangeName] = function () {
        if ((el[readyState] && !(/^c|loade/.test(el[readyState]))) || loaded) return;
        el.onload = el[onreadystatechangeName] = null
        loaded = 1
        scripts[path] = 2
        fn()
    }
    el.async = 1
    el.src = path
    head.insertBefore(el, head.firstChild)
}

$script.get = create

/** @private */
$script.order = function (scripts, id, done) {
    (function callback() {
        var s = scripts.shift()
        if (!scripts.length) $script(s, id, done)
        else $script(s, callback)
    }())
}

/**
 * @param {string} p
 */
$script.path = function (p) {
    scriptpath = p
}

/**
 * @param {string|Array.<string>} deps
 * @param {function()} ready
 * @param {function(Array.<string>)=} req
 */
$script.ready = function (deps, ready, req) {
    deps = deps[push] ? deps : [deps]
    var missing = [];
    !each(deps,  function (dep) {
        list[dep] || missing[push](dep);
    }) && every(deps, function (dep) {return list[dep]}) ?
        ready() : (function (key) {
        delay[key] = delay[key] || []
        delay[key][push](ready)
        req && req(missing)
    }(deps.join('|')))
    return $script
}

$script.done = function (idOrDone) {
    $script([null], idOrDone)
}
