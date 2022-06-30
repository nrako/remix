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

// TODO: We eventually might not want to import anything directly from `history`
// and leverage `react-router` here instead
// TODO: import/export from react-router-dom

/**
 * A React component that is rendered when the server throws a Response.
 *
 * @see https://remix.run/api/conventions#catchboundary
 */

/**
 * A React component that is rendered when there is an error on a route.
 *
 * @see https://remix.run/api/conventions#errorboundary
 */

/**
 * A function that defines `<link>` tags to be inserted into the `<head>` of
 * the document on route transitions.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */

/**
 * A function that returns an object of name + content pairs to use for
 * `<meta>` tags for a route. These tags will be merged with (and take
 * precedence over) tags from parent routes.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */

/**
 * A name/content pair used to render `<meta>` tags in a meta function for a
 * route. The value can be either a string, which will render a single `<meta>`
 * tag, or an array of strings that will render multiple tags with the same
 * `name` attribute.
 */

/**
 * During client side transitions Remix will optimize reloading of routes that
 * are currently on the page by avoiding loading routes that aren't changing.
 * However, in some cases, like form submissions or search params Remix doesn't
 * know which routes need to be reloaded so it reloads them all to be safe.
 *
 * This function lets apps further optimize by returning `false` when Remix is
 * about to reload the route. A common case is a root loader with nothing but
 * environment variables: after form submissions the root probably doesn't need
 * to be reloaded.
 *
 * @see https://remix.run/api/conventions#unstable_shouldreload
 */

/**
 * A React component that is rendered for a route.
 */

/**
 * An arbitrary object that is associated with a route.
 *
 * @see https://remix.run/api/conventions#handle
 */
async function loadRouteModule(route, routeModulesCache) {
  if (route.id in routeModulesCache) {
    return routeModulesCache[route.id];
  }

  try {
    let routeModule = await (function (t) { return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require(t)); }); })(route.module);
    routeModulesCache[route.id] = routeModule;
    return routeModule;
  } catch (error) {
    // User got caught in the middle of a deploy and the CDN no longer has the
    // asset we're trying to import! Reload from the server and the user
    // (should) get the new manifest--unless the developer purged the static
    // assets, the manifest path, but not the documents 😬
    window.location.reload();
    return new Promise(() => {// check out of this hook cause the DJs never gonna re[s]olve this
    });
  }
}

exports.loadRouteModule = loadRouteModule;
