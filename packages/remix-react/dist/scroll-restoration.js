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

var React = require('react');
var reactRouterDom = require('react-router-dom');
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

let STORAGE_KEY = "positions";
let positions = {};

if (typeof document !== "undefined") {
  let sessionPositions = sessionStorage.getItem(STORAGE_KEY);

  if (sessionPositions) {
    positions = JSON.parse(sessionPositions);
  }
}
/**
 * This component will emulate the browser's scroll restoration on location
 * changes.
 *
 * @see https://remix.run/api/remix#scrollrestoration
 */


function ScrollRestoration({
  nonce = undefined
}) {
  useScrollRestoration(); // wait for the browser to restore it on its own

  React__namespace.useEffect(() => {
    window.history.scrollRestoration = "manual";
  }, []); // let the browser restore on it's own for refresh

  components.useBeforeUnload(React__namespace.useCallback(() => {
    window.history.scrollRestoration = "auto";
  }, []));

  let restoreScroll = (STORAGE_KEY => {
    if (!window.history.state || !window.history.state.key) {
      let key = Math.random().toString(32).slice(2);
      window.history.replaceState({
        key
      }, "");
    }

    try {
      let positions = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
      let storedY = positions[window.history.state.key];

      if (typeof storedY === "number") {
        window.scrollTo(0, storedY);
      }
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }).toString();

  return /*#__PURE__*/React__namespace.createElement("script", {
    nonce: nonce,
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: {
      __html: `(${restoreScroll})(${JSON.stringify(STORAGE_KEY)})`
    }
  });
}
let hydrated = false;

function useScrollRestoration() {
  let location = reactRouterDom.useLocation();
  let transition = components.useTransition();
  let wasSubmissionRef = React__namespace.useRef(false);
  React__namespace.useEffect(() => {
    if (transition.submission) {
      wasSubmissionRef.current = true;
    }
  }, [transition]);
  React__namespace.useEffect(() => {
    if (transition.location) {
      positions[location.key] = window.scrollY;
    }
  }, [transition, location]);
  components.useBeforeUnload(React__namespace.useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, []));

  if (typeof document !== "undefined") {
    // eslint-disable-next-line
    React__namespace.useLayoutEffect(() => {
      // don't do anything on hydration, the component already did this with an
      // inline script.
      if (!hydrated) {
        hydrated = true;
        return;
      }

      let y = positions[location.key]; // been here before, scroll to it

      if (y != undefined) {
        window.scrollTo(0, y);
        return;
      } // try to scroll to the hash


      if (location.hash) {
        let el = document.getElementById(location.hash.slice(1));

        if (el) {
          el.scrollIntoView();
          return;
        }
      } // don't do anything on submissions


      if (wasSubmissionRef.current === true) {
        wasSubmissionRef.current = false;
        return;
      } // otherwise go to the top on new locations


      window.scrollTo(0, 0);
    }, [location]);
  }

  React__namespace.useEffect(() => {
    if (transition.submission) {
      wasSubmissionRef.current = true;
    }
  }, [transition]);
}

exports.ScrollRestoration = ScrollRestoration;
