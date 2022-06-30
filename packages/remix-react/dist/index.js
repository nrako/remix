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

var browser = require('./browser.js');
var reactRouterDom = require('react-router-dom');
var components = require('./components.js');
var errorBoundaries = require('./errorBoundaries.js');
var scrollRestoration = require('./scroll-restoration.js');
var server = require('./server.js');



exports.RemixBrowser = browser.RemixBrowser;
Object.defineProperty(exports, 'Outlet', {
  enumerable: true,
  get: function () { return reactRouterDom.Outlet; }
});
Object.defineProperty(exports, 'useHref', {
  enumerable: true,
  get: function () { return reactRouterDom.useHref; }
});
Object.defineProperty(exports, 'useLocation', {
  enumerable: true,
  get: function () { return reactRouterDom.useLocation; }
});
Object.defineProperty(exports, 'useNavigate', {
  enumerable: true,
  get: function () { return reactRouterDom.useNavigate; }
});
Object.defineProperty(exports, 'useNavigationType', {
  enumerable: true,
  get: function () { return reactRouterDom.useNavigationType; }
});
Object.defineProperty(exports, 'useOutlet', {
  enumerable: true,
  get: function () { return reactRouterDom.useOutlet; }
});
Object.defineProperty(exports, 'useOutletContext', {
  enumerable: true,
  get: function () { return reactRouterDom.useOutletContext; }
});
Object.defineProperty(exports, 'useParams', {
  enumerable: true,
  get: function () { return reactRouterDom.useParams; }
});
Object.defineProperty(exports, 'useResolvedPath', {
  enumerable: true,
  get: function () { return reactRouterDom.useResolvedPath; }
});
Object.defineProperty(exports, 'useSearchParams', {
  enumerable: true,
  get: function () { return reactRouterDom.useSearchParams; }
});
exports.Form = components.Form;
exports.Link = components.Link;
exports.Links = components.Links;
exports.LiveReload = components.LiveReload;
exports.Meta = components.Meta;
exports.NavLink = components.NavLink;
exports.PrefetchPageLinks = components.PrefetchPageLinks;
exports.Scripts = components.Scripts;
exports.useActionData = components.useActionData;
exports.useBeforeUnload = components.useBeforeUnload;
exports.useFetcher = components.useFetcher;
exports.useFetchers = components.useFetchers;
exports.useFormAction = components.useFormAction;
exports.useLoaderData = components.useLoaderData;
exports.useMatches = components.useMatches;
exports.useSubmit = components.useSubmit;
exports.useTransition = components.useTransition;
exports.useCatch = errorBoundaries.useCatch;
exports.ScrollRestoration = scrollRestoration.ScrollRestoration;
exports.RemixServer = server.RemixServer;
