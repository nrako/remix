/**
 * @remix-run/react v1.6.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var history = require('history');
var React = require('react');
var components = require('./components.js');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);

// TODO: We eventually might not want to import anything directly from `history`

/**
 * The entry point for a Remix app when it is rendered in the browser (in
 * `app/entry.client.js`). This component is used by React to hydrate the HTML
 * that was received from the server.
 */
function RemixBrowser(_props) {
  let historyRef = React__namespace.useRef();

  if (historyRef.current == null) {
    historyRef.current = history.createBrowserHistory({
      window
    });
  }

  let history$1 = historyRef.current;
  let [state, dispatch] = React__namespace.useReducer((_, update) => update, {
    action: history$1.action,
    location: history$1.location
  });
  React__namespace.useLayoutEffect(() => history$1.listen(dispatch), [history$1]);
  let entryContext = window.__remixContext;
  entryContext.manifest = window.__remixManifest;
  entryContext.routeModules = window.__remixRouteModules; // In the browser, we don't need this because a) in the case of loader
  // errors we already know the order and b) in the case of render errors
  // React knows the order and handles error boundaries normally.

  entryContext.appState.trackBoundaries = false;
  entryContext.appState.trackCatchBoundaries = false;
  return /*#__PURE__*/React__namespace.createElement(components.RemixEntry, {
    context: entryContext,
    action: state.action,
    location: state.location,
    navigator: history$1
  });
}

exports.RemixBrowser = RemixBrowser;
