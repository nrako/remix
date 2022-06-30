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
var routeModules = require('./routeModules.js');
var data = require('./data.js');
var transition = require('./transition.js');
var links = require('./links.js');
var invariant = require('./invariant.js');

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

function createClientRoute(entryRoute, routeModulesCache, Component) {
  return {
    caseSensitive: !!entryRoute.caseSensitive,
    element: /*#__PURE__*/React__namespace.createElement(Component, {
      id: entryRoute.id
    }),
    id: entryRoute.id,
    path: entryRoute.path,
    index: entryRoute.index,
    module: entryRoute.module,
    loader: createLoader(entryRoute, routeModulesCache),
    action: createAction(entryRoute, routeModulesCache),
    shouldReload: createShouldReload(entryRoute, routeModulesCache),
    ErrorBoundary: entryRoute.hasErrorBoundary,
    CatchBoundary: entryRoute.hasCatchBoundary,
    hasLoader: entryRoute.hasLoader
  };
}
function createClientRoutes(routeManifest, routeModulesCache, Component, parentId) {
  return Object.keys(routeManifest).filter(key => routeManifest[key].parentId === parentId).map(key => {
    let route = createClientRoute(routeManifest[key], routeModulesCache, Component);
    let children = createClientRoutes(routeManifest, routeModulesCache, Component, route.id);
    if (children.length > 0) route.children = children;
    return route;
  });
}

function createShouldReload(route, routeModules) {
  let shouldReload = arg => {
    let module = routeModules[route.id];
    invariant(module, `Expected route module to be loaded for ${route.id}`);

    if (module.unstable_shouldReload) {
      return module.unstable_shouldReload(arg);
    }

    return true;
  };

  return shouldReload;
}

async function loadRouteModuleWithBlockingLinks(route, routeModules$1) {
  let routeModule = await routeModules.loadRouteModule(route, routeModules$1);
  await links.prefetchStyleLinks(routeModule);
  return routeModule;
}

function createLoader(route, routeModules) {
  let loader = async ({
    url,
    signal,
    submission
  }) => {
    if (route.hasLoader) {
      let [result] = await Promise.all([data.fetchData(url, route.id, signal, submission), loadRouteModuleWithBlockingLinks(route, routeModules)]);
      if (result instanceof Error) throw result;
      let redirect = await checkRedirect(result);
      if (redirect) return redirect;

      if (data.isCatchResponse(result)) {
        throw new transition.CatchValue(result.status, result.statusText, await data.extractData(result));
      }

      return data.extractData(result);
    } else {
      await loadRouteModuleWithBlockingLinks(route, routeModules);
    }
  };

  return loader;
}

function createAction(route, routeModules) {
  let action = async ({
    url,
    signal,
    submission
  }) => {
    if (!route.hasAction) {
      console.error(`Route "${route.id}" does not have an action, but you are trying ` + `to submit to it. To fix this, please add an \`action\` function to the route`);
    }

    let result = await data.fetchData(url, route.id, signal, submission);

    if (result instanceof Error) {
      throw result;
    }

    let redirect = await checkRedirect(result);
    if (redirect) return redirect;
    await loadRouteModuleWithBlockingLinks(route, routeModules);

    if (data.isCatchResponse(result)) {
      throw new transition.CatchValue(result.status, result.statusText, await data.extractData(result));
    }

    return data.extractData(result);
  };

  return action;
}

async function checkRedirect(response) {
  if (data.isRedirectResponse(response)) {
    let url = new URL(response.headers.get("X-Remix-Redirect"), window.location.origin);

    if (url.origin !== window.location.origin) {
      await new Promise(() => {
        window.location.replace(url.href);
      });
    } else {
      return new transition.TransitionRedirect(url.pathname + url.search + url.hash, response.headers.get("X-Remix-Revalidate") !== null);
    }
  }

  return null;
}

exports.createClientRoute = createClientRoute;
exports.createClientRoutes = createClientRoutes;
