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
import { extends as _extends } from './_virtual/_rollupPluginBabelHelpers.js';
import * as React from 'react';
import { useHref, NavLink as NavLink$1, Link as Link$1, useLocation, useResolvedPath, useNavigate, Router, useRoutes } from 'react-router-dom';
import { RemixErrorBoundary, RemixRootDefaultErrorBoundary, RemixCatchBoundary, RemixRootDefaultCatchBoundary } from './errorBoundaries.js';
import invariant from './invariant.js';
import { getLinksForMatches, isPageLinkDescriptor, getNewMatchesForLinks, getDataLinkHrefs, getModuleLinkHrefs, getStylesheetPrefetchLinks } from './links.js';
import { createHtml } from './markup.js';
import { createClientRoutes } from './routes.js';
import { matchClientRoutes } from './routeMatching.js';
import { createTransitionManager } from './transition.js';

const RemixEntryContext = /*#__PURE__*/React.createContext(undefined);

function useRemixEntryContext() {
  let context = React.useContext(RemixEntryContext);
  invariant(context, "You must render this element inside a <Remix> element");
  return context;
}

function RemixEntry({
  context: entryContext,
  action,
  location: historyLocation,
  navigator: _navigator,
  static: staticProp = false
}) {
  let {
    manifest,
    routeData: documentLoaderData,
    actionData: documentActionData,
    routeModules,
    serverHandoffString,
    appState: entryComponentDidCatchEmulator
  } = entryContext;
  let clientRoutes = React.useMemo(() => createClientRoutes(manifest.routes, routeModules, RemixRoute), [manifest, routeModules]);
  let [clientState, setClientState] = React.useState(entryComponentDidCatchEmulator);
  let [transitionManager] = React.useState(() => {
    return createTransitionManager({
      routes: clientRoutes,
      actionData: documentActionData,
      loaderData: documentLoaderData,
      location: historyLocation,
      catch: entryComponentDidCatchEmulator.catch,
      catchBoundaryId: entryComponentDidCatchEmulator.catchBoundaryRouteId,
      onRedirect: _navigator.replace,
      onChange: state => {
        setClientState({
          catch: state.catch,
          error: state.error,
          catchBoundaryRouteId: state.catchBoundaryId,
          loaderBoundaryRouteId: state.errorBoundaryId,
          renderBoundaryRouteId: null,
          trackBoundaries: false,
          trackCatchBoundaries: false
        });
      }
    });
  }); // Ensures pushes interrupting pending navigations use replace
  // TODO: Move this to React Router

  let navigator = React.useMemo(() => {
    let push = (to, state) => {
      return transitionManager.getState().transition.state !== "idle" ? _navigator.replace(to, state) : _navigator.push(to, state);
    };

    return { ..._navigator,
      push
    };
  }, [_navigator, transitionManager]);
  let {
    location,
    matches,
    loaderData,
    actionData
  } = transitionManager.getState(); // Send new location to the transition manager

  React.useEffect(() => {
    let {
      location
    } = transitionManager.getState();
    if (historyLocation === location) return;
    transitionManager.send({
      type: "navigation",
      location: historyLocation,
      submission: consumeNextNavigationSubmission(),
      action
    });
  }, [transitionManager, historyLocation, action]); // If we tried to render and failed, and the app threw before rendering any
  // routes, get the error and pass it to the ErrorBoundary to emulate
  // `componentDidCatch`

  let ssrErrorBeforeRoutesRendered = clientState.error && clientState.renderBoundaryRouteId === null && clientState.loaderBoundaryRouteId === null ? deserializeError(clientState.error) : undefined;
  let ssrCatchBeforeRoutesRendered = clientState.catch && clientState.catchBoundaryRouteId === null ? clientState.catch : undefined;
  return /*#__PURE__*/React.createElement(RemixEntryContext.Provider, {
    value: {
      matches,
      manifest,
      appState: clientState,
      routeModules,
      serverHandoffString,
      clientRoutes,
      routeData: loaderData,
      actionData,
      transitionManager
    }
  }, /*#__PURE__*/React.createElement(RemixErrorBoundary, {
    location: location,
    component: RemixRootDefaultErrorBoundary,
    error: ssrErrorBeforeRoutesRendered
  }, /*#__PURE__*/React.createElement(RemixCatchBoundary, {
    location: location,
    component: RemixRootDefaultCatchBoundary,
    catch: ssrCatchBeforeRoutesRendered
  }, /*#__PURE__*/React.createElement(Router, {
    navigationType: action,
    location: location,
    navigator: navigator,
    static: staticProp
  }, /*#__PURE__*/React.createElement(Routes, null)))));
}

function deserializeError(data) {
  let error = new Error(data.message);
  error.stack = data.stack;
  return error;
}

function Routes() {
  // TODO: Add `renderMatches` function to RR that we can use and then we don't
  // need this component, we can just `renderMatches` from RemixEntry
  let {
    clientRoutes
  } = useRemixEntryContext(); // fallback to the root if we don't have a match

  let element = useRoutes(clientRoutes) || clientRoutes[0].element;
  return element;
} ////////////////////////////////////////////////////////////////////////////////
// RemixRoute


const RemixRouteContext = /*#__PURE__*/React.createContext(undefined);

function useRemixRouteContext() {
  let context = React.useContext(RemixRouteContext);
  invariant(context, "You must render this element in a remix route element");
  return context;
}

function DefaultRouteComponent({
  id
}) {
  throw new Error(`Route "${id}" has no component! Please go add a \`default\` export in the route module file.\n` + "If you were trying to navigate or submit to a resource route, use `<a>` instead of `<Link>` or `<Form reloadDocument>`.");
}

function RemixRoute({
  id
}) {
  let location = useLocation();
  let {
    routeData,
    routeModules,
    appState
  } = useRemixEntryContext(); // This checks prevent cryptic error messages such as: 'Cannot read properties of undefined (reading 'root')'

  invariant(routeData, "Cannot initialize 'routeData'. This normally occurs when you have server code in your client modules.\n" + "Check this link for more details:\nhttps://remix.run/pages/gotchas#server-code-in-client-bundles");
  invariant(routeModules, "Cannot initialize 'routeModules'. This normally occurs when you have server code in your client modules.\n" + "Check this link for more details:\nhttps://remix.run/pages/gotchas#server-code-in-client-bundles");
  let data = routeData[id];
  let {
    default: Component,
    CatchBoundary,
    ErrorBoundary
  } = routeModules[id];
  let element = Component ? /*#__PURE__*/React.createElement(Component, null) : /*#__PURE__*/React.createElement(DefaultRouteComponent, {
    id: id
  });
  let context = {
    data,
    id
  };

  if (CatchBoundary) {
    // If we tried to render and failed, and this route threw the error, find it
    // and pass it to the ErrorBoundary to emulate `componentDidCatch`
    let maybeServerCaught = appState.catch && appState.catchBoundaryRouteId === id ? appState.catch : undefined; // This needs to run after we check for the error from a previous render,
    // otherwise we will incorrectly render this boundary for a loader error
    // deeper in the tree.

    if (appState.trackCatchBoundaries) {
      appState.catchBoundaryRouteId = id;
    }

    context = maybeServerCaught ? {
      id,

      get data() {
        console.error("You cannot `useLoaderData` in a catch boundary.");
        return undefined;
      }

    } : {
      id,
      data
    };
    element = /*#__PURE__*/React.createElement(RemixCatchBoundary, {
      location: location,
      component: CatchBoundary,
      catch: maybeServerCaught
    }, element);
  } // Only wrap in error boundary if the route defined one, otherwise let the
  // error bubble to the parent boundary. We could default to using error
  // boundaries around every route, but now if the app doesn't want users
  // seeing the default Remix ErrorBoundary component, they *must* define an
  // error boundary for *every* route and that would be annoying. Might as
  // well make it required at that point.
  //
  // By conditionally wrapping like this, we allow apps to define a top level
  // ErrorBoundary component and be done with it. Then, if they want to, they
  // can add more specific boundaries by exporting ErrorBoundary components
  // for whichever routes they please.
  //
  // NOTE: this kind of logic will move into React Router


  if (ErrorBoundary) {
    // If we tried to render and failed, and this route threw the error, find it
    // and pass it to the ErrorBoundary to emulate `componentDidCatch`
    let maybeServerRenderError = appState.error && (appState.renderBoundaryRouteId === id || appState.loaderBoundaryRouteId === id) ? deserializeError(appState.error) : undefined; // This needs to run after we check for the error from a previous render,
    // otherwise we will incorrectly render this boundary for a loader error
    // deeper in the tree.

    if (appState.trackBoundaries) {
      appState.renderBoundaryRouteId = id;
    }

    context = maybeServerRenderError ? {
      id,

      get data() {
        console.error("You cannot `useLoaderData` in an error boundary.");
        return undefined;
      }

    } : {
      id,
      data
    };
    element = /*#__PURE__*/React.createElement(RemixErrorBoundary, {
      location: location,
      component: ErrorBoundary,
      error: maybeServerRenderError
    }, element);
  } // It's important for the route context to be above the error boundary so that
  // a call to `useLoaderData` doesn't accidentally get the parents route's data.


  return /*#__PURE__*/React.createElement(RemixRouteContext.Provider, {
    value: context
  }, element);
} ////////////////////////////////////////////////////////////////////////////////
// Public API

/**
 * Defines the prefetching behavior of the link:
 *
 * - "intent": Fetched when the user focuses or hovers the link
 * - "render": Fetched when the link is rendered
 * - "none": Never fetched
 */

function usePrefetchBehavior(prefetch, theirElementProps) {
  let [maybePrefetch, setMaybePrefetch] = React.useState(false);
  let [shouldPrefetch, setShouldPrefetch] = React.useState(false);
  let {
    onFocus,
    onBlur,
    onMouseEnter,
    onMouseLeave,
    onTouchStart
  } = theirElementProps;
  React.useEffect(() => {
    if (prefetch === "render") {
      setShouldPrefetch(true);
    }
  }, [prefetch]);

  let setIntent = () => {
    if (prefetch === "intent") {
      setMaybePrefetch(true);
    }
  };

  let cancelIntent = () => {
    if (prefetch === "intent") {
      setMaybePrefetch(false);
      setShouldPrefetch(false);
    }
  };

  React.useEffect(() => {
    if (maybePrefetch) {
      let id = setTimeout(() => {
        setShouldPrefetch(true);
      }, 100);
      return () => {
        clearTimeout(id);
      };
    }
  }, [maybePrefetch]);
  return [shouldPrefetch, {
    onFocus: composeEventHandlers(onFocus, setIntent),
    onBlur: composeEventHandlers(onBlur, cancelIntent),
    onMouseEnter: composeEventHandlers(onMouseEnter, setIntent),
    onMouseLeave: composeEventHandlers(onMouseLeave, cancelIntent),
    onTouchStart: composeEventHandlers(onTouchStart, setIntent)
  }];
}
/**
 * A special kind of `<Link>` that knows whether or not it is "active".
 *
 * @see https://remix.run/api/remix#navlink
 */


let NavLink = /*#__PURE__*/React.forwardRef(({
  to,
  prefetch = "none",
  ...props
}, forwardedRef) => {
  let href = useHref(to);
  let [shouldPrefetch, prefetchHandlers] = usePrefetchBehavior(prefetch, props);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(NavLink$1, _extends({
    ref: forwardedRef,
    to: to
  }, props, prefetchHandlers)), shouldPrefetch ? /*#__PURE__*/React.createElement(PrefetchPageLinks, {
    page: href
  }) : null);
});
NavLink.displayName = "NavLink";
/**
 * This component renders an anchor tag and is the primary way the user will
 * navigate around your website.
 *
 * @see https://remix.run/api/remix#link
 */

let Link = /*#__PURE__*/React.forwardRef(({
  to,
  prefetch = "none",
  ...props
}, forwardedRef) => {
  let href = useHref(to);
  let [shouldPrefetch, prefetchHandlers] = usePrefetchBehavior(prefetch, props);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Link$1, _extends({
    ref: forwardedRef,
    to: to
  }, props, prefetchHandlers)), shouldPrefetch ? /*#__PURE__*/React.createElement(PrefetchPageLinks, {
    page: href
  }) : null);
});
Link.displayName = "Link";
function composeEventHandlers(theirHandler, ourHandler) {
  return event => {
    theirHandler && theirHandler(event);

    if (!event.defaultPrevented) {
      ourHandler(event);
    }
  };
}
/**
 * Renders the `<link>` tags for the current routes.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */

function Links() {
  let {
    matches,
    routeModules,
    manifest
  } = useRemixEntryContext();
  let links = React.useMemo(() => getLinksForMatches(matches, routeModules, manifest), [matches, routeModules, manifest]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, links.map(link => {
    if (isPageLinkDescriptor(link)) {
      return /*#__PURE__*/React.createElement(PrefetchPageLinks, _extends({
        key: link.page
      }, link));
    }

    let imageSrcSet = null; // In React 17, <link imageSrcSet> and <link imageSizes> will warn
    // because the DOM attributes aren't recognized, so users need to pass
    // them in all lowercase to forward the attributes to the node without a
    // warning. Normalize so that either property can be used in Remix.

    if ("useId" in React) {
      if (link.imagesrcset) {
        link.imageSrcSet = imageSrcSet = link.imagesrcset;
        delete link.imagesrcset;
      }

      if (link.imagesizes) {
        link.imageSizes = link.imagesizes;
        delete link.imagesizes;
      }
    } else {
      if (link.imageSrcSet) {
        link.imagesrcset = imageSrcSet = link.imageSrcSet;
        delete link.imageSrcSet;
      }

      if (link.imageSizes) {
        link.imagesizes = link.imageSizes;
        delete link.imageSizes;
      }
    }

    return /*#__PURE__*/React.createElement("link", _extends({
      key: link.rel + (link.href || "") + (imageSrcSet || "")
    }, link));
  }));
}
/**
 * This component renders all of the `<link rel="prefetch">` and
 * `<link rel="modulepreload"/>` tags for all the assets (data, modules, css) of
 * a given page.
 *
 * @param props
 * @param props.page
 * @see https://remix.run/api/remix#prefetchpagelinks-
 */

function PrefetchPageLinks({
  page,
  ...dataLinkProps
}) {
  let {
    clientRoutes
  } = useRemixEntryContext();
  let matches = React.useMemo(() => matchClientRoutes(clientRoutes, page), [clientRoutes, page]);

  if (!matches) {
    console.warn(`Tried to prefetch ${page} but no routes matched.`);
    return null;
  }

  return /*#__PURE__*/React.createElement(PrefetchPageLinksImpl, _extends({
    page: page,
    matches: matches
  }, dataLinkProps));
}

function usePrefetchedStylesheets(matches) {
  let {
    routeModules
  } = useRemixEntryContext();
  let [styleLinks, setStyleLinks] = React.useState([]);
  React.useEffect(() => {
    let interrupted = false;
    getStylesheetPrefetchLinks(matches, routeModules).then(links => {
      if (!interrupted) setStyleLinks(links);
    });
    return () => {
      interrupted = true;
    };
  }, [matches, routeModules]);
  return styleLinks;
}

function PrefetchPageLinksImpl({
  page,
  matches: nextMatches,
  ...linkProps
}) {
  let location = useLocation();
  let {
    matches,
    manifest
  } = useRemixEntryContext();
  let newMatchesForData = React.useMemo(() => getNewMatchesForLinks(page, nextMatches, matches, location, "data"), [page, nextMatches, matches, location]);
  let newMatchesForAssets = React.useMemo(() => getNewMatchesForLinks(page, nextMatches, matches, location, "assets"), [page, nextMatches, matches, location]);
  let dataHrefs = React.useMemo(() => getDataLinkHrefs(page, newMatchesForData, manifest), [newMatchesForData, page, manifest]);
  let moduleHrefs = React.useMemo(() => getModuleLinkHrefs(newMatchesForAssets, manifest), [newMatchesForAssets, manifest]); // needs to be a hook with async behavior because we need the modules, not
  // just the manifest like the other links in here.

  let styleLinks = usePrefetchedStylesheets(newMatchesForAssets);
  return /*#__PURE__*/React.createElement(React.Fragment, null, dataHrefs.map(href => /*#__PURE__*/React.createElement("link", _extends({
    key: href,
    rel: "prefetch",
    as: "fetch",
    href: href
  }, linkProps))), moduleHrefs.map(href => /*#__PURE__*/React.createElement("link", _extends({
    key: href,
    rel: "modulepreload",
    href: href
  }, linkProps))), styleLinks.map(link =>
  /*#__PURE__*/
  // these don't spread `linkProps` because they are full link descriptors
  // already with their own props
  React.createElement("link", _extends({
    key: link.href
  }, link))));
}
/**
 * Renders the `<title>` and `<meta>` tags for the current routes.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */


function Meta() {
  let {
    matches,
    routeData,
    routeModules
  } = useRemixEntryContext();
  let location = useLocation();
  let meta = {};
  let parentsData = {};

  for (let match of matches) {
    let routeId = match.route.id;
    let data = routeData[routeId];
    let params = match.params;
    let routeModule = routeModules[routeId];

    if (routeModule.meta) {
      let routeMeta = typeof routeModule.meta === "function" ? routeModule.meta({
        data,
        parentsData,
        params,
        location
      }) : routeModule.meta;
      Object.assign(meta, routeMeta);
    }

    parentsData[routeId] = data;
  }

  return /*#__PURE__*/React.createElement(React.Fragment, null, Object.entries(meta).map(([name, value]) => {
    if (!value) {
      return null;
    }

    if (["charset", "charSet"].includes(name)) {
      return /*#__PURE__*/React.createElement("meta", {
        key: "charset",
        charSet: value
      });
    }

    if (name === "title") {
      return /*#__PURE__*/React.createElement("title", {
        key: "title"
      }, value);
    } // Open Graph tags use the `property` attribute, while other meta tags
    // use `name`. See https://ogp.me/


    let isOpenGraphTag = name.startsWith("og:");
    return [value].flat().map(content => {
      if (isOpenGraphTag) {
        return /*#__PURE__*/React.createElement("meta", {
          content: content,
          key: name + content,
          property: name
        });
      }

      if (typeof content === "string") {
        return /*#__PURE__*/React.createElement("meta", {
          content: content,
          name: name,
          key: name + content
        });
      }

      return /*#__PURE__*/React.createElement("meta", _extends({
        key: name + JSON.stringify(content)
      }, content));
    });
  }));
}
/**
 * Tracks whether Remix has finished hydrating or not, so scripts can be skipped
 * during client-side updates.
 */

let isHydrated = false;

/**
 * Renders the `<script>` tags needed for the initial render. Bundles for
 * additional routes are loaded later as needed.
 *
 * @param props Additional properties to add to each script tag that is rendered.
 * In addition to scripts, \<link rel="modulepreload"> tags receive the crossOrigin
 * property if provided.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */
function Scripts(props) {
  let {
    manifest,
    matches,
    pendingLocation,
    clientRoutes,
    serverHandoffString
  } = useRemixEntryContext();
  React.useEffect(() => {
    isHydrated = true;
  }, []);
  let initialScripts = React.useMemo(() => {
    let contextScript = serverHandoffString ? `window.__remixContext = ${serverHandoffString};` : "";
    let routeModulesScript = `${matches.map((match, index) => `import * as route${index} from ${JSON.stringify(manifest.routes[match.route.id].module)};`).join("\n")}
window.__remixRouteModules = {${matches.map((match, index) => `${JSON.stringify(match.route.id)}:route${index}`).join(",")}};`;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("script", _extends({}, props, {
      suppressHydrationWarning: true,
      dangerouslySetInnerHTML: createHtml(contextScript)
    })), /*#__PURE__*/React.createElement("script", _extends({}, props, {
      src: manifest.url
    })), /*#__PURE__*/React.createElement("script", _extends({}, props, {
      dangerouslySetInnerHTML: createHtml(routeModulesScript),
      type: "module"
    })), /*#__PURE__*/React.createElement("script", _extends({}, props, {
      src: manifest.entry.module,
      type: "module"
    }))); // disabled deps array because we are purposefully only rendering this once
    // for hydration, after that we want to just continue rendering the initial
    // scripts as they were when the page first loaded
    // eslint-disable-next-line
  }, []); // avoid waterfall when importing the next route module

  let nextMatches = React.useMemo(() => {
    if (pendingLocation) {
      // FIXME: can probably use transitionManager `nextMatches`
      let matches = matchClientRoutes(clientRoutes, pendingLocation);
      invariant(matches, `No routes match path "${pendingLocation.pathname}"`);
      return matches;
    }

    return [];
  }, [pendingLocation, clientRoutes]);
  let routePreloads = matches.concat(nextMatches).map(match => {
    let route = manifest.routes[match.route.id];
    return (route.imports || []).concat([route.module]);
  }).flat(1);
  let preloads = manifest.entry.imports.concat(routePreloads);
  return /*#__PURE__*/React.createElement(React.Fragment, null, dedupe(preloads).map(path => /*#__PURE__*/React.createElement("link", {
    key: path,
    rel: "modulepreload",
    href: path,
    crossOrigin: props.crossOrigin
  })), isHydrated ? null : initialScripts);
}

function dedupe(array) {
  return [...new Set(array)];
}

/**
 * A Remix-aware `<form>`. It behaves like a normal form except that the
 * interaction with the server is with `fetch` instead of new document
 * requests, allowing components to add nicer UX to the page as the form is
 * submitted and returns with data.
 *
 * @see https://remix.run/api/remix#form
 */
let Form = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(FormImpl, _extends({}, props, {
    ref: ref
  }));
});
Form.displayName = "Form";
let FormImpl = /*#__PURE__*/React.forwardRef(({
  reloadDocument = false,
  replace = false,
  method = "get",
  action = ".",
  encType = "application/x-www-form-urlencoded",
  fetchKey,
  onSubmit,
  ...props
}, forwardedRef) => {
  let submit = useSubmitImpl(fetchKey);
  let formMethod = method.toLowerCase() === "get" ? "get" : "post";
  let formAction = useFormAction(action);
  return /*#__PURE__*/React.createElement("form", _extends({
    ref: forwardedRef,
    method: formMethod,
    action: formAction,
    encType: encType,
    onSubmit: reloadDocument ? undefined : event => {
      onSubmit && onSubmit(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      let submitter = event.nativeEvent.submitter;
      submit(submitter || event.currentTarget, {
        replace
      });
    }
  }, props));
});
FormImpl.displayName = "FormImpl";

/**
 * Resolves a `<form action>` path relative to the current route.
 *
 * @see https://remix.run/api/remix#useformaction
 */
function useFormAction(action = ".", // TODO: Remove method param in v2 as it's no longer needed and is a breaking change
method = "get") {
  let {
    id
  } = useRemixRouteContext();
  let path = useResolvedPath(action);
  let search = path.search;
  let isIndexRoute = id.endsWith("/index");

  if (action === "." && isIndexRoute) {
    search = search ? search.replace(/^\?/, "?index&") : "?index";
  }

  return path.pathname + search;
}

/**
 * Returns a function that may be used to programmatically submit a form (or
 * some arbitrary data) to the server.
 *
 * @see https://remix.run/api/remix#usesubmit
 */
function useSubmit() {
  return useSubmitImpl();
}
let defaultMethod = "get";
let defaultEncType = "application/x-www-form-urlencoded";
function useSubmitImpl(key) {
  let navigate = useNavigate();
  let defaultAction = useFormAction();
  let {
    transitionManager
  } = useRemixEntryContext();
  return React.useCallback((target, options = {}) => {
    let method;
    let action;
    let encType;
    let formData;

    if (isFormElement(target)) {
      let submissionTrigger = options.submissionTrigger;
      method = options.method || target.getAttribute("method") || defaultMethod;
      action = options.action || target.getAttribute("action") || defaultAction;
      encType = options.encType || target.getAttribute("enctype") || defaultEncType;
      formData = new FormData(target);

      if (submissionTrigger && submissionTrigger.name) {
        formData.append(submissionTrigger.name, submissionTrigger.value);
      }
    } else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
      let form = target.form;

      if (form == null) {
        throw new Error(`Cannot submit a <button> without a <form>`);
      } // <button>/<input type="submit"> may override attributes of <form>


      method = options.method || target.getAttribute("formmethod") || form.getAttribute("method") || defaultMethod;
      action = options.action || target.getAttribute("formaction") || form.getAttribute("action") || defaultAction;
      encType = options.encType || target.getAttribute("formenctype") || form.getAttribute("enctype") || defaultEncType;
      formData = new FormData(form); // Include name + value from a <button>

      if (target.name) {
        formData.append(target.name, target.value);
      }
    } else {
      if (isHtmlElement(target)) {
        throw new Error(`Cannot submit element that is not <form>, <button>, or ` + `<input type="submit|image">`);
      }

      method = options.method || "get";
      action = options.action || defaultAction;
      encType = options.encType || "application/x-www-form-urlencoded";

      if (target instanceof FormData) {
        formData = target;
      } else {
        formData = new FormData();

        if (target instanceof URLSearchParams) {
          for (let [name, value] of target) {
            formData.append(name, value);
          }
        } else if (target != null) {
          for (let name of Object.keys(target)) {
            formData.append(name, target[name]);
          }
        }
      }
    }

    if (typeof document === "undefined") {
      throw new Error("You are calling submit during the server render. " + "Try calling submit within a `useEffect` or callback instead.");
    }

    let {
      protocol,
      host
    } = window.location;
    let url = new URL(action, `${protocol}//${host}`);

    if (method.toLowerCase() === "get") {
      for (let [name, value] of formData) {
        if (typeof value === "string") {
          url.searchParams.append(name, value);
        } else {
          throw new Error(`Cannot submit binary form data using GET`);
        }
      }
    }

    let submission = {
      formData,
      action: url.pathname + url.search,
      method: method.toUpperCase(),
      encType,
      key: Math.random().toString(36).substr(2, 8)
    };

    if (key) {
      transitionManager.send({
        type: "fetcher",
        href: submission.action,
        submission,
        key
      });
    } else {
      setNextNavigationSubmission(submission);
      navigate(url.pathname + url.search, {
        replace: options.replace
      });
    }
  }, [defaultAction, key, navigate, transitionManager]);
}
let nextNavigationSubmission;

function setNextNavigationSubmission(submission) {
  nextNavigationSubmission = submission;
}

function consumeNextNavigationSubmission() {
  let submission = nextNavigationSubmission;
  nextNavigationSubmission = undefined;
  return submission;
}

function isHtmlElement(object) {
  return object != null && typeof object.tagName === "string";
}

function isButtonElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}

function isFormElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}

function isInputElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}
/**
 * Setup a callback to be fired on the window's `beforeunload` event. This is
 * useful for saving some data to `window.localStorage` just before the page
 * refreshes, which automatically happens on the next `<Link>` click when Remix
 * detects a new version of the app is available on the server.
 *
 * Note: The `callback` argument should be a function created with
 * `React.useCallback()`.
 *
 * @see https://remix.run/api/remix#usebeforeunload
 */


function useBeforeUnload(callback) {
  React.useEffect(() => {
    window.addEventListener("beforeunload", callback);
    return () => {
      window.removeEventListener("beforeunload", callback);
    };
  }, [callback]);
}

/**
 * Returns the current route matches on the page. This is useful for creating
 * layout abstractions with your current routes.
 *
 * @see https://remix.run/api/remix#usematches
 */
function useMatches() {
  let {
    matches,
    routeData,
    routeModules
  } = useRemixEntryContext();
  return React.useMemo(() => matches.map(match => {
    var _routeModules$match$r;

    let {
      pathname,
      params
    } = match;
    return {
      id: match.route.id,
      pathname,
      params,
      data: routeData[match.route.id],
      // if the module fails to load or an error/response is thrown, the module
      // won't be defined.
      handle: (_routeModules$match$r = routeModules[match.route.id]) === null || _routeModules$match$r === void 0 ? void 0 : _routeModules$match$r.handle
    };
  }), [matches, routeData, routeModules]);
}
/**
 * Returns the JSON parsed data from the current route's `loader`.
 *
 * @see https://remix.run/api/remix#useloaderdata
 */

function useLoaderData() {
  return useRemixRouteContext().data;
}
/**
 * Returns the JSON parsed data from the current route's `action`.
 *
 * @see https://remix.run/api/remix#useactiondata
 */

function useActionData() {
  let {
    id: routeId
  } = useRemixRouteContext();
  let {
    transitionManager
  } = useRemixEntryContext();
  let {
    actionData
  } = transitionManager.getState();
  return actionData ? actionData[routeId] : undefined;
}
/**
 * Returns everything you need to know about a page transition to build pending
 * navigation indicators and optimistic UI on data mutations.
 *
 * @see https://remix.run/api/remix#usetransition
 */

function useTransition() {
  let {
    transitionManager
  } = useRemixEntryContext();
  return transitionManager.getState().transition;
}

function createFetcherForm(fetchKey) {
  let FetcherForm = /*#__PURE__*/React.forwardRef((props, ref) => {
    // TODO: make ANOTHER form w/o a fetchKey prop
    return /*#__PURE__*/React.createElement(FormImpl, _extends({}, props, {
      ref: ref,
      fetchKey: fetchKey
    }));
  });
  FetcherForm.displayName = "fetcher.Form";
  return FetcherForm;
}

let fetcherId = 0;

/**
 * Interacts with route loaders and actions without causing a navigation. Great
 * for any interaction that stays on the same page.
 *
 * @see https://remix.run/api/remix#usefetcher
 */
function useFetcher() {
  let {
    transitionManager
  } = useRemixEntryContext();
  let [key] = React.useState(() => String(++fetcherId));
  let [Form] = React.useState(() => createFetcherForm(key));
  let [load] = React.useState(() => href => {
    transitionManager.send({
      type: "fetcher",
      href,
      key
    });
  });
  let submit = useSubmitImpl(key);
  let fetcher = transitionManager.getFetcher(key);
  let fetcherWithComponents = React.useMemo(() => ({
    Form,
    submit,
    load,
    ...fetcher
  }), [fetcher, Form, submit, load]);
  React.useEffect(() => {
    // Is this busted when the React team gets real weird and calls effects
    // twice on mount?  We really just need to garbage collect here when this
    // fetcher is no longer around.
    return () => transitionManager.deleteFetcher(key);
  }, [transitionManager, key]);
  return fetcherWithComponents;
}
/**
 * Provides all fetchers currently on the page. Useful for layouts and parent
 * routes that need to provide pending/optimistic UI regarding the fetch.
 *
 * @see https://remix.run/api/remix#usefetchers
 */

function useFetchers() {
  let {
    transitionManager
  } = useRemixEntryContext();
  let {
    fetchers
  } = transitionManager.getState();
  return [...fetchers.values()];
} // Dead Code Elimination magic for production builds.
// This way devs don't have to worry about doing the NODE_ENV check themselves.
// If running an un-bundled server outside of `remix dev` you will still need
// to set the REMIX_DEV_SERVER_WS_PORT manually.

const LiveReload = process.env.NODE_ENV !== "development" ? () => null : function LiveReload({
  port = Number(process.env.REMIX_DEV_SERVER_WS_PORT || 8002),
  nonce = undefined
}) {
  let js = String.raw;
  return /*#__PURE__*/React.createElement("script", {
    nonce: nonce,
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: {
      __html: js`
                (() => {
                  let protocol = location.protocol === "https:" ? "wss:" : "ws:";
                  let host = location.hostname;
                  let socketPath = protocol + "//" + host + ":" + ${String(port)} + "/socket";

                  let ws = new WebSocket(socketPath);
                  ws.onmessage = (message) => {
                    let event = JSON.parse(message.data);
                    if (event.type === "LOG") {
                      console.log(event.message);
                    }
                    if (event.type === "RELOAD") {
                      console.log("💿 Reloading window ...");
                      window.location.reload();
                    }
                  };
                  ws.onerror = (error) => {
                    console.log("Remix dev asset server web socket error:");
                    console.error(error);
                  };
                })();
              `
    }
  });
};

export { Form, FormImpl, Link, Links, LiveReload, Meta, NavLink, PrefetchPageLinks, RemixEntry, RemixEntryContext, RemixRoute, Scripts, composeEventHandlers, useActionData, useBeforeUnload, useFetcher, useFetchers, useFormAction, useLoaderData, useMatches, useSubmit, useSubmitImpl, useTransition };
