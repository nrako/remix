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
import { Action, createPath } from 'history';
import * as React from 'react';
import { RemixEntry } from './components.js';

// TODO: We eventually might not want to import anything directly from `history`

/**
 * The entry point for a Remix app when it is rendered on the server (in
 * `app/entry.server.js`). This component is used to generate the HTML in the
 * response from the server.
 */
function RemixServer({
  context,
  url
}) {
  if (typeof url === "string") {
    url = new URL(url);
  }

  let location = {
    pathname: url.pathname,
    search: url.search,
    hash: "",
    state: null,
    key: "default"
  };
  let staticNavigator = {
    createHref(to) {
      return typeof to === "string" ? to : createPath(to);
    },

    push(to) {
      throw new Error(`You cannot use navigator.push() on the server because it is a stateless ` + `environment. This error was probably triggered when you did a ` + `\`navigate(${JSON.stringify(to)})\` somewhere in your app.`);
    },

    replace(to) {
      throw new Error(`You cannot use navigator.replace() on the server because it is a stateless ` + `environment. This error was probably triggered when you did a ` + `\`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere ` + `in your app.`);
    },

    go(delta) {
      throw new Error(`You cannot use navigator.go() on the server because it is a stateless ` + `environment. This error was probably triggered when you did a ` + `\`navigate(${delta})\` somewhere in your app.`);
    },

    back() {
      throw new Error(`You cannot use navigator.back() on the server because it is a stateless ` + `environment.`);
    },

    forward() {
      throw new Error(`You cannot use navigator.forward() on the server because it is a stateless ` + `environment.`);
    },

    block() {
      throw new Error(`You cannot use navigator.block() on the server because it is a stateless ` + `environment.`);
    }

  };
  return /*#__PURE__*/React.createElement(RemixEntry, {
    context: context,
    action: Action.Pop,
    location: location,
    navigator: staticNavigator,
    static: true
  });
}

export { RemixServer };
