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
import { createBrowserHistory } from 'history';
import * as React from 'react';
import { RemixEntry } from './components.js';

// TODO: We eventually might not want to import anything directly from `history`

/**
 * The entry point for a Remix app when it is rendered in the browser (in
 * `app/entry.client.js`). This component is used by React to hydrate the HTML
 * that was received from the server.
 */
function RemixBrowser(_props) {
  let historyRef = React.useRef();

  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({
      window
    });
  }

  let history = historyRef.current;
  let [state, dispatch] = React.useReducer((_, update) => update, {
    action: history.action,
    location: history.location
  });
  React.useLayoutEffect(() => history.listen(dispatch), [history]);
  let entryContext = window.__remixContext;
  entryContext.manifest = window.__remixManifest;
  entryContext.routeModules = window.__remixRouteModules; // In the browser, we don't need this because a) in the case of loader
  // errors we already know the order and b) in the case of render errors
  // React knows the order and handles error boundaries normally.

  entryContext.appState.trackBoundaries = false;
  entryContext.appState.trackCatchBoundaries = false;
  return /*#__PURE__*/React.createElement(RemixEntry, {
    context: entryContext,
    action: state.action,
    location: state.location,
    navigator: history
  });
}

export { RemixBrowser };
