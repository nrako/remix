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
var routeMatching = require('./routeMatching.js');
var invariant = require('./invariant.js');

// TODO: We eventually might not want to import anything directly from `history`
//#region Types and Utils
////////////////////////////////////////////////////////////////////////////////

class CatchValue {
  constructor(status, statusText, data) {
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }

}

function isActionSubmission(submission) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(submission.method);
}

function isLoaderSubmission(submission) {
  return submission.method === "GET";
}

function isRedirectLocation(location) {
  return Boolean(location.state) && location.state.isRedirect;
}

function isLoaderRedirectLocation(location) {
  return isRedirectLocation(location) && location.state.type === "loader";
}

function isActionRedirectLocation(location) {
  return isRedirectLocation(location) && location.state.type === "action";
}

function isFetchActionRedirect(location) {
  return isRedirectLocation(location) && location.state.type === "fetchAction";
}

function isLoaderSubmissionRedirectLocation(location) {
  return isRedirectLocation(location) && location.state.type === "loaderSubmission";
}

class TransitionRedirect {
  constructor(location, setCookie) {
    this.setCookie = setCookie;
    this.location = typeof location === "string" ? location : location.pathname + location.search;
  }

}
const IDLE_TRANSITION = {
  state: "idle",
  submission: undefined,
  location: undefined,
  type: "idle"
};
const IDLE_FETCHER = {
  state: "idle",
  type: "init",
  data: undefined,
  submission: undefined
}; //#endregion
////////////////////////////////////////////////////////////////////////////////
//#region createTransitionManager
////////////////////////////////////////////////////////////////////////////////

function createTransitionManager(init) {
  let {
    routes
  } = init;
  let pendingNavigationController;
  let fetchControllers = new Map();
  let incrementingLoadId = 0;
  let navigationLoadId = -1;
  let fetchReloadIds = new Map();
  let fetchRedirectIds = new Set();
  let matches = routeMatching.matchClientRoutes(routes, init.location);

  if (!matches) {
    // If we do not match a user-provided-route, fall back to the root
    // to allow the CatchBoundary to take over
    matches = [{
      params: {},
      pathname: "",
      route: routes[0]
    }];
  }

  let state = {
    location: init.location,
    loaderData: init.loaderData || {},
    actionData: init.actionData,
    catch: init.catch,
    error: init.error,
    catchBoundaryId: init.catchBoundaryId || null,
    errorBoundaryId: init.errorBoundaryId || null,
    matches,
    nextMatches: undefined,
    transition: IDLE_TRANSITION,
    fetchers: new Map()
  };

  function update(updates) {
    if (updates.transition) {
      if (updates.transition === IDLE_TRANSITION) {
        pendingNavigationController = undefined;
      }
    }

    state = Object.assign({}, state, updates);
    init.onChange(state);
  }

  function getState() {
    return state;
  }

  function getFetcher(key) {
    return state.fetchers.get(key) || IDLE_FETCHER;
  }

  function setFetcher(key, fetcher) {
    state.fetchers.set(key, fetcher);
  }

  function deleteFetcher(key) {
    if (fetchControllers.has(key)) abortFetcher(key);
    fetchReloadIds.delete(key);
    fetchRedirectIds.delete(key);
    state.fetchers.delete(key);
  }

  async function send(event) {
    switch (event.type) {
      case "navigation":
        {
          let {
            action,
            location,
            submission
          } = event;
          let matches = routeMatching.matchClientRoutes(routes, location);

          if (!matches) {
            matches = [{
              params: {},
              pathname: "",
              route: routes[0]
            }];
            await handleNotFoundNavigation(location, matches);
          } else if (!submission && isHashChangeOnly(location)) {
            await handleHashChange(location, matches);
          } // back/forward button, treat all as normal navigation
          else if (action === history.Action.Pop) {
            await handleLoad(location, matches);
          } // <Form method="post | put | delete | patch">
          else if (submission && isActionSubmission(submission)) {
            await handleActionSubmissionNavigation(location, submission, matches);
          } // <Form method="get"/>
          else if (submission && isLoaderSubmission(submission)) {
            await handleLoaderSubmissionNavigation(location, submission, matches);
          } // action=>redirect
          else if (isActionRedirectLocation(location)) {
            await handleActionRedirect(location, matches);
          } // <Form method="get"> --> loader=>redirect
          else if (isLoaderSubmissionRedirectLocation(location)) {
            await handleLoaderSubmissionRedirect(location, matches);
          } // loader=>redirect
          else if (isLoaderRedirectLocation(location)) {
            await handleLoaderRedirect(location, matches);
          } // useSubmission()=>redirect
          else if (isFetchActionRedirect(location)) {
            await handleFetchActionRedirect(location, matches);
          } // <Link>, navigate()
          else {
            await handleLoad(location, matches);
          }

          navigationLoadId = -1;
          break;
        }

      case "fetcher":
        {
          let {
            key,
            submission,
            href
          } = event;
          let matches = routeMatching.matchClientRoutes(routes, href);
          invariant(matches, "No matches found");
          if (fetchControllers.has(key)) abortFetcher(key);
          let match = getFetcherRequestMatch(new URL(href, window.location.href), matches);

          if (submission && isActionSubmission(submission)) {
            await handleActionFetchSubmission(key, submission, match);
          } else if (submission && isLoaderSubmission(submission)) {
            await handleLoaderFetchSubmission(href, key, submission, match);
          } else {
            await handleLoaderFetch(href, key, match);
          }

          break;
        }

      default:
        {
          // @ts-ignore
          throw new Error(`Unknown data event type: ${event.type}`);
        }
    }
  }

  function dispose() {
    abortNormalNavigation();

    for (let [, controller] of fetchControllers) {
      controller.abort();
    }
  }

  function isIndexRequestUrl(url) {
    for (let param of url.searchParams.getAll("index")) {
      // only use bare `?index` params without a value
      // ✅ /foo?index
      // ✅ /foo?index&index=123
      // ✅ /foo?index=123&index
      // ❌ /foo?index=123
      if (param === "") {
        return true;
      }
    }

    return false;
  }

  function getFetcherRequestMatch(url, matches) {
    let match = matches.slice(-1)[0];

    if (!isIndexRequestUrl(url) && match.route.index) {
      return matches.slice(-2)[0];
    }

    return match;
  }

  async function handleActionFetchSubmission(key, submission, match) {
    let currentFetcher = state.fetchers.get(key);
    let fetcher = {
      state: "submitting",
      type: "actionSubmission",
      submission,
      data: (currentFetcher === null || currentFetcher === void 0 ? void 0 : currentFetcher.data) || undefined
    };
    setFetcher(key, fetcher);
    update({
      fetchers: new Map(state.fetchers)
    });
    let controller = new AbortController();
    fetchControllers.set(key, controller);
    let result = await callAction(submission, match, controller.signal);

    if (controller.signal.aborted) {
      return;
    }

    if (isRedirectResult(result)) {
      let locationState = {
        isRedirect: true,
        type: "fetchAction",
        setCookie: result.value.setCookie
      };
      fetchRedirectIds.add(key);
      init.onRedirect(result.value.location, locationState);
      let loadingFetcher = {
        state: "loading",
        type: "actionRedirect",
        submission,
        data: undefined
      };
      setFetcher(key, loadingFetcher);
      update({
        fetchers: new Map(state.fetchers)
      });
      return;
    }

    if (maybeBailOnError(match, key, result)) {
      return;
    }

    if (await maybeBailOnCatch(match, key, result)) {
      return;
    }

    let loadFetcher = {
      state: "loading",
      type: "actionReload",
      data: result.value,
      submission
    };
    setFetcher(key, loadFetcher);
    update({
      fetchers: new Map(state.fetchers)
    });
    let maybeActionErrorResult = isErrorResult(result) ? result : undefined;
    let maybeActionCatchResult = isCatchResult(result) ? result : undefined;
    let loadId = ++incrementingLoadId;
    fetchReloadIds.set(key, loadId);
    let matchesToLoad = state.nextMatches || state.matches;
    let results = await callLoaders(state, state.transition.location || state.location, matchesToLoad, controller.signal, maybeActionErrorResult, maybeActionCatchResult, submission, match.route.id, loadFetcher);

    if (controller.signal.aborted) {
      return;
    }

    fetchReloadIds.delete(key);
    fetchControllers.delete(key);
    let redirect = findRedirect(results);

    if (redirect) {
      let locationState = {
        isRedirect: true,
        type: "loader",
        setCookie: redirect.setCookie
      };
      init.onRedirect(redirect.location, locationState);
      return;
    }

    let [error, errorBoundaryId] = findErrorAndBoundaryId(results, state.matches, maybeActionErrorResult);
    let [catchVal, catchBoundaryId] = (await findCatchAndBoundaryId(results, state.matches, maybeActionCatchResult)) || [];
    let doneFetcher = {
      state: "idle",
      type: "done",
      data: result.value,
      submission: undefined
    };
    setFetcher(key, doneFetcher);
    let abortedKeys = abortStaleFetchLoads(loadId);

    if (abortedKeys) {
      markFetchersDone(abortedKeys);
    }

    let yeetedNavigation = yeetStaleNavigationLoad(loadId); // need to do what we would have done when the navigation load completed

    if (yeetedNavigation) {
      let {
        transition
      } = state;
      invariant(transition.state === "loading", "Expected loading transition");
      update({
        location: transition.location,
        matches: state.nextMatches,
        error,
        errorBoundaryId,
        catch: catchVal,
        catchBoundaryId,
        loaderData: makeLoaderData(state, results, matchesToLoad),
        actionData: transition.type === "actionReload" ? state.actionData : undefined,
        transition: IDLE_TRANSITION,
        fetchers: new Map(state.fetchers)
      });
    } // otherwise just update the info for the data
    else {
      update({
        fetchers: new Map(state.fetchers),
        error,
        errorBoundaryId,
        loaderData: makeLoaderData(state, results, matchesToLoad)
      });
    }
  }

  function yeetStaleNavigationLoad(landedId) {
    let isLoadingNavigation = state.transition.state === "loading";

    if (isLoadingNavigation && navigationLoadId < landedId) {
      abortNormalNavigation();
      return true;
    }

    return false;
  }

  function markFetchersDone(keys) {
    for (let key of keys) {
      let fetcher = getFetcher(key);
      let doneFetcher = {
        state: "idle",
        type: "done",
        data: fetcher.data,
        submission: undefined
      };
      setFetcher(key, doneFetcher);
    }
  }

  function abortStaleFetchLoads(landedId) {
    let yeetedKeys = [];

    for (let [key, id] of fetchReloadIds) {
      if (id < landedId) {
        let fetcher = state.fetchers.get(key);
        invariant(fetcher, `Expected fetcher: ${key}`);

        if (fetcher.state === "loading") {
          abortFetcher(key);
          fetchReloadIds.delete(key);
          yeetedKeys.push(key);
        }
      }
    }

    return yeetedKeys.length ? yeetedKeys : false;
  }

  async function handleLoaderFetchSubmission(href, key, submission, match) {
    let currentFetcher = state.fetchers.get(key);
    let fetcher = {
      state: "submitting",
      type: "loaderSubmission",
      submission,
      data: (currentFetcher === null || currentFetcher === void 0 ? void 0 : currentFetcher.data) || undefined
    };
    setFetcher(key, fetcher);
    update({
      fetchers: new Map(state.fetchers)
    });
    let controller = new AbortController();
    fetchControllers.set(key, controller);
    let result = await callLoader(match, createUrl(href), controller.signal);
    fetchControllers.delete(key);

    if (controller.signal.aborted) {
      return;
    }

    if (isRedirectResult(result)) {
      let locationState = {
        isRedirect: true,
        type: "loader",
        setCookie: result.value.setCookie
      };
      init.onRedirect(result.value.location, locationState);
      return;
    }

    if (maybeBailOnError(match, key, result)) {
      return;
    }

    if (await maybeBailOnCatch(match, key, result)) {
      return;
    }

    let doneFetcher = {
      state: "idle",
      type: "done",
      data: result.value,
      submission: undefined
    };
    setFetcher(key, doneFetcher);
    update({
      fetchers: new Map(state.fetchers)
    });
  }

  async function handleLoaderFetch(href, key, match) {
    if (typeof AbortController === "undefined") {
      throw new Error("handleLoaderFetch was called during the server render, but it shouldn't be. " + "You are likely calling useFetcher.load() in the body of your component. " + "Try moving it to a useEffect or a callback.");
    }

    let currentFetcher = state.fetchers.get(key);
    let fetcher = {
      state: "loading",
      type: "normalLoad",
      submission: undefined,
      data: (currentFetcher === null || currentFetcher === void 0 ? void 0 : currentFetcher.data) || undefined
    };
    setFetcher(key, fetcher);
    update({
      fetchers: new Map(state.fetchers)
    });
    let controller = new AbortController();
    fetchControllers.set(key, controller);
    let result = await callLoader(match, createUrl(href), controller.signal);
    if (controller.signal.aborted) return;
    fetchControllers.delete(key);

    if (isRedirectResult(result)) {
      let locationState = {
        isRedirect: true,
        type: "loader",
        setCookie: result.value.setCookie
      };
      init.onRedirect(result.value.location, locationState);
      return;
    }

    if (maybeBailOnError(match, key, result)) {
      return;
    }

    if (await maybeBailOnCatch(match, key, result)) {
      return;
    }

    let doneFetcher = {
      state: "idle",
      type: "done",
      data: result.value,
      submission: undefined
    };
    setFetcher(key, doneFetcher);
    update({
      fetchers: new Map(state.fetchers)
    });
  }

  async function maybeBailOnCatch(match, key, result) {
    // TODO: revisit this if submission is correct after review
    if (isCatchResult(result)) {
      let catchBoundaryId = findNearestCatchBoundary(match, state.matches);
      state.fetchers.delete(key);
      update({
        transition: IDLE_TRANSITION,
        fetchers: new Map(state.fetchers),
        catch: {
          data: result.value.data,
          status: result.value.status,
          statusText: result.value.statusText
        },
        catchBoundaryId
      });
      return true;
    }

    return false;
  }

  function maybeBailOnError(match, key, result) {
    if (isErrorResult(result)) {
      let errorBoundaryId = findNearestBoundary(match, state.matches);
      state.fetchers.delete(key);
      update({
        fetchers: new Map(state.fetchers),
        error: result.value,
        errorBoundaryId
      });
      return true;
    }

    return false;
  }

  async function handleNotFoundNavigation(location, matches) {
    abortNormalNavigation();
    let transition = {
      state: "loading",
      type: "normalLoad",
      submission: undefined,
      location
    };
    update({
      transition,
      nextMatches: matches
    }); // Force async so UI code doesn't have to special not found route changes not
    // skipping the pending state (like scroll restoration gets really
    // complicated without the pending state, maybe we can figure something else
    // out later, but this works great.)

    await Promise.resolve();
    let catchBoundaryId = findNearestCatchBoundary(matches[0], matches);
    update({
      location,
      matches,
      catch: {
        data: null,
        status: 404,
        statusText: "Not Found"
      },
      catchBoundaryId,
      transition: IDLE_TRANSITION
    });
  }

  async function handleActionSubmissionNavigation(location, submission, matches) {
    abortNormalNavigation();
    let transition = {
      state: "submitting",
      type: "actionSubmission",
      submission,
      location
    };
    update({
      transition,
      nextMatches: matches
    });
    let controller = new AbortController();
    pendingNavigationController = controller; // Create a local copy we can mutate for proper determination of the acton
    // to run on layout/index routes.  We do not want to mutate the eventual
    // matches used for revalidation

    let actionMatches = matches;

    if (!isIndexRequestUrl(createUrl(submission.action)) && actionMatches[matches.length - 1].route.index) {
      actionMatches = actionMatches.slice(0, -1);
    }

    let leafMatch = actionMatches.slice(-1)[0];
    let result = await callAction(submission, leafMatch, controller.signal);

    if (controller.signal.aborted) {
      return;
    }

    if (isRedirectResult(result)) {
      let locationState = {
        isRedirect: true,
        type: "action",
        setCookie: result.value.setCookie
      };
      init.onRedirect(result.value.location, locationState);
      return;
    }

    let catchVal, catchBoundaryId;

    if (isCatchResult(result)) {
      [catchVal, catchBoundaryId] = (await findCatchAndBoundaryId([result], actionMatches, result)) || [];
    }

    let loadTransition = {
      state: "loading",
      type: "actionReload",
      submission,
      location
    };
    update({
      transition: loadTransition,
      actionData: {
        [leafMatch.route.id]: result.value
      }
    });
    await loadPageData(location, matches, submission, leafMatch.route.id, result, catchVal, catchBoundaryId);
  }

  async function handleLoaderSubmissionNavigation(location, submission, matches) {
    abortNormalNavigation();
    let transition = {
      state: "submitting",
      type: "loaderSubmission",
      submission,
      location
    };
    update({
      transition,
      nextMatches: matches
    });
    await loadPageData(location, matches, submission);
  }

  async function handleHashChange(location, matches) {
    abortNormalNavigation();
    let transition = {
      state: "loading",
      type: "normalLoad",
      submission: undefined,
      location
    };
    update({
      transition,
      nextMatches: matches
    }); // Force async so UI code doesn't have to special case hash changes not
    // skipping the pending state (like scroll restoration gets really
    // complicated without the pending state, maybe we can figure something else
    // out later, but this works great.)

    await Promise.resolve();
    update({
      location,
      matches,
      transition: IDLE_TRANSITION
    });
  }

  async function handleLoad(location, matches) {
    abortNormalNavigation();
    let transition = {
      state: "loading",
      type: "normalLoad",
      submission: undefined,
      location
    };
    update({
      transition,
      nextMatches: matches
    });
    await loadPageData(location, matches);
  }

  async function handleLoaderRedirect(location, matches) {
    abortNormalNavigation();
    let transition = {
      state: "loading",
      type: "normalRedirect",
      submission: undefined,
      location
    };
    update({
      transition,
      nextMatches: matches
    });
    await loadPageData(location, matches);
  }

  async function handleLoaderSubmissionRedirect(location, matches) {
    abortNormalNavigation();
    invariant(state.transition.type === "loaderSubmission", `Unexpected transition: ${JSON.stringify(state.transition)}`);
    let {
      submission
    } = state.transition;
    let transition = {
      state: "loading",
      type: "loaderSubmissionRedirect",
      submission,
      location: location
    };
    update({
      transition,
      nextMatches: matches
    });
    await loadPageData(location, matches, submission);
  }

  async function handleFetchActionRedirect(location, matches) {
    abortNormalNavigation();
    let transition = {
      state: "loading",
      type: "fetchActionRedirect",
      submission: undefined,
      location
    };
    update({
      transition,
      nextMatches: matches
    });
    await loadPageData(location, matches);
  }

  async function handleActionRedirect(location, matches) {
    abortNormalNavigation();
    invariant(state.transition.type === "actionSubmission" || // loader redirected during action reload
    state.transition.type === "actionReload" || // loader redirected during action redirect
    state.transition.type === "actionRedirect", `Unexpected transition: ${JSON.stringify(state.transition)}`);
    let {
      submission
    } = state.transition;
    let transition = {
      state: "loading",
      type: "actionRedirect",
      submission,
      location
    };
    update({
      transition,
      nextMatches: matches
    });
    await loadPageData(location, matches, submission);
  }

  function isHashChangeOnly(location) {
    return createHref(state.location) === createHref(location) && state.location.hash !== location.hash;
  }

  async function loadPageData(location, matches, submission, submissionRouteId, actionResult, catchVal, catchBoundaryId) {
    let maybeActionErrorResult = actionResult && isErrorResult(actionResult) ? actionResult : undefined;
    let maybeActionCatchResult = actionResult && isCatchResult(actionResult) ? actionResult : undefined;
    let controller = new AbortController();
    pendingNavigationController = controller;
    navigationLoadId = ++incrementingLoadId;
    let results = await callLoaders(state, location, matches, controller.signal, maybeActionErrorResult, maybeActionCatchResult, submission, submissionRouteId, undefined, catchBoundaryId);

    if (controller.signal.aborted) {
      return;
    }

    let redirect = findRedirect(results);

    if (redirect) {
      // loader redirected during an action reload, treat it like an
      // actionRedirect instead so that all the loaders get called again and the
      // submission sticks around for optimistic/pending UI.
      if (state.transition.type === "actionReload" || isActionRedirectLocation(location)) {
        let locationState = {
          isRedirect: true,
          type: "action",
          setCookie: redirect.setCookie
        };
        init.onRedirect(redirect.location, locationState);
      } else if (state.transition.type === "loaderSubmission") {
        let locationState = {
          isRedirect: true,
          type: "loaderSubmission",
          setCookie: redirect.setCookie
        };
        init.onRedirect(redirect.location, locationState);
      } else {
        var _location$state;

        let locationState = {
          isRedirect: true,
          type: "loader",
          // If we're in the middle of a setCookie redirect, we need to preserve
          // the flag so we handle revalidations across multi-redirect scenarios
          setCookie: redirect.setCookie || ((_location$state = location.state) === null || _location$state === void 0 ? void 0 : _location$state.setCookie) === true
        };
        init.onRedirect(redirect.location, locationState);
      }

      return;
    }

    let [error, errorBoundaryId] = findErrorAndBoundaryId(results, matches, maybeActionErrorResult);
    [catchVal, catchBoundaryId] = (await findCatchAndBoundaryId(results, matches, maybeActionErrorResult)) || [catchVal, catchBoundaryId];
    markFetchRedirectsDone();
    let abortedIds = abortStaleFetchLoads(navigationLoadId);

    if (abortedIds) {
      markFetchersDone(abortedIds);
    }

    update({
      location,
      matches,
      error,
      errorBoundaryId,
      catch: catchVal,
      catchBoundaryId,
      loaderData: makeLoaderData(state, results, matches),
      actionData: state.transition.type === "actionReload" ? state.actionData : undefined,
      transition: IDLE_TRANSITION,
      fetchers: abortedIds ? new Map(state.fetchers) : state.fetchers
    });
  }

  function abortNormalNavigation() {
    if (pendingNavigationController) {
      pendingNavigationController.abort();
    }
  }

  function abortFetcher(key) {
    let controller = fetchControllers.get(key);
    invariant(controller, `Expected fetch controller: ${key}`);
    controller.abort();
    fetchControllers.delete(key);
  }

  function markFetchRedirectsDone() {
    let doneKeys = [];

    for (let key of fetchRedirectIds) {
      let fetcher = state.fetchers.get(key);
      invariant(fetcher, `Expected fetcher: ${key}`);

      if (fetcher.type === "actionRedirect") {
        fetchRedirectIds.delete(key);
        doneKeys.push(key);
      }
    }

    markFetchersDone(doneKeys);
  }

  return {
    send,
    getState,
    getFetcher,
    deleteFetcher,
    dispose,

    get _internalFetchControllers() {
      return fetchControllers;
    }

  };
} //#endregion
////////////////////////////////////////////////////////////////////////////////
//#region createTransitionManager sub-functions
////////////////////////////////////////////////////////////////////////////////

async function callLoaders(state, location, matches, signal, actionErrorResult, actionCatchResult, submission, submissionRouteId, fetcher, catchBoundaryId) {
  let url = createUrl(createHref(location));
  let matchesToLoad = filterMatchesToLoad(state, location, matches, actionErrorResult, actionCatchResult, submission, submissionRouteId, fetcher, catchBoundaryId);
  return Promise.all(matchesToLoad.map(match => callLoader(match, url, signal)));
}

async function callLoader(match, url, signal) {
  invariant(match.route.loader, `Expected loader for ${match.route.id}`);

  try {
    let {
      params
    } = match;
    let value = await match.route.loader({
      params,
      url,
      signal
    });
    return {
      match,
      value
    };
  } catch (error) {
    return {
      match,
      value: error
    };
  }
}

async function callAction(submission, match, signal) {
  try {
    let value = await match.route.action({
      url: createUrl(submission.action),
      params: match.params,
      submission,
      signal
    });
    return {
      match,
      value
    };
  } catch (error) {
    return {
      match,
      value: error
    };
  }
}

function filterMatchesToLoad(state, location, matches, actionErrorResult, actionCatchResult, submission, submissionRouteId, fetcher, catchBoundaryId) {
  var _location$state2;

  // Filter out all routes below the problematic route as they aren't going
  // to render so we don't need to load them.
  if (catchBoundaryId || submissionRouteId && (actionCatchResult || actionErrorResult)) {
    let foundProblematicRoute = false;
    matches = matches.filter(match => {
      if (foundProblematicRoute) {
        return false;
      }

      if (match.route.id === submissionRouteId || match.route.id === catchBoundaryId) {
        foundProblematicRoute = true;
        return false;
      }

      return true;
    });
  }

  let isNew = (match, index) => {
    // [a] -> [a, b]
    if (!state.matches[index]) return true; // [a, b] -> [a, c]

    return match.route.id !== state.matches[index].route.id;
  };

  let matchPathChanged = (match, index) => {
    var _state$matches$index$;

    return (// param change, /users/123 -> /users/456
      state.matches[index].pathname !== match.pathname || // splat param changed, which is not present in match.path
      // e.g. /files/images/avatar.jpg -> files/finances.xls
      ((_state$matches$index$ = state.matches[index].route.path) === null || _state$matches$index$ === void 0 ? void 0 : _state$matches$index$.endsWith("*")) && state.matches[index].params["*"] !== match.params["*"]
    );
  };

  let url = createUrl(createHref(location));

  let filterByRouteProps = (match, index) => {
    if (!match.route.loader) {
      return false;
    }

    if (isNew(match, index) || matchPathChanged(match, index)) {
      return true;
    }

    if (match.route.shouldReload) {
      let prevUrl = createUrl(createHref(state.location));
      return match.route.shouldReload({
        prevUrl,
        url,
        submission,
        params: match.params
      });
    }

    return true;
  };

  let isInRootCatchBoundary = state.matches.length === 1;

  if (isInRootCatchBoundary) {
    return matches.filter(match => !!match.route.loader);
  }

  if ((fetcher === null || fetcher === void 0 ? void 0 : fetcher.type) === "actionReload") {
    return matches.filter(filterByRouteProps);
  } else if ( // mutation, reload for fresh data
  state.transition.type === "actionReload" || state.transition.type === "actionRedirect" || state.transition.type === "fetchActionRedirect" || // clicked the same link, resubmitted a GET form
  createHref(url) === createHref(state.location) || // search affects all loaders
  url.searchParams.toString() !== state.location.search.substring(1) || // a cookie was set
  (_location$state2 = location.state) !== null && _location$state2 !== void 0 && _location$state2.setCookie) {
    return matches.filter(filterByRouteProps);
  }

  return matches.filter((match, index, arr) => {
    var _location$state3;

    // don't load errored action route
    if ((actionErrorResult || actionCatchResult) && arr.length - 1 === index) {
      return false;
    }

    return match.route.loader && (isNew(match, index) || matchPathChanged(match, index) || ((_location$state3 = location.state) === null || _location$state3 === void 0 ? void 0 : _location$state3.setCookie));
  });
}

function isRedirectResult(result) {
  return result.value instanceof TransitionRedirect;
}

function createHref(location) {
  return location.pathname + location.search;
}

function findRedirect(results) {
  for (let result of results) {
    if (isRedirectResult(result)) {
      return result.value;
    }
  }

  return null;
}

async function findCatchAndBoundaryId(results, matches, actionCatchResult) {
  let loaderCatchResult;

  for (let result of results) {
    if (isCatchResult(result)) {
      loaderCatchResult = result;
      break;
    }
  }

  let extractCatchData = async res => ({
    status: res.status,
    statusText: res.statusText,
    data: res.data
  }); // Weird case where action threw, and then a parent loader ALSO threw, we
  // use the action catch but the loader's nearest boundary (cause we can't
  // render down to the boundary the action would prefer)


  if (actionCatchResult && loaderCatchResult) {
    let boundaryId = findNearestCatchBoundary(loaderCatchResult.match, matches);
    return [await extractCatchData(actionCatchResult.value), boundaryId];
  }

  if (loaderCatchResult) {
    let boundaryId = findNearestCatchBoundary(loaderCatchResult.match, matches);
    return [await extractCatchData(loaderCatchResult.value), boundaryId];
  }

  return null;
}

function findErrorAndBoundaryId(results, matches, actionErrorResult) {
  let loaderErrorResult;

  for (let result of results) {
    if (isErrorResult(result)) {
      loaderErrorResult = result;
      break;
    }
  } // Weird case where action errored, and then a parent loader ALSO errored, we
  // use the action error but the loader's nearest boundary (cause we can't
  // render down to the boundary the action would prefer)


  if (actionErrorResult && loaderErrorResult) {
    let boundaryId = findNearestBoundary(loaderErrorResult.match, matches);
    return [actionErrorResult.value, boundaryId];
  }

  if (actionErrorResult) {
    let boundaryId = findNearestBoundary(actionErrorResult.match, matches);
    return [actionErrorResult.value, boundaryId];
  }

  if (loaderErrorResult) {
    let boundaryId = findNearestBoundary(loaderErrorResult.match, matches);
    return [loaderErrorResult.value, boundaryId];
  }

  return [undefined, undefined];
}

function findNearestCatchBoundary(matchWithError, matches) {
  let nearestBoundaryId = null;

  for (let match of matches) {
    if (match.route.CatchBoundary) {
      nearestBoundaryId = match.route.id;
    } // only search parents (stop at throwing match)


    if (match === matchWithError) {
      break;
    }
  }

  return nearestBoundaryId;
}

function findNearestBoundary(matchWithError, matches) {
  let nearestBoundaryId = null;

  for (let match of matches) {
    if (match.route.ErrorBoundary) {
      nearestBoundaryId = match.route.id;
    } // only search parents (stop at throwing match)


    if (match === matchWithError) {
      break;
    }
  }

  return nearestBoundaryId;
}

function makeLoaderData(state, results, matches) {
  let newData = {};

  for (let {
    match,
    value
  } of results) {
    newData[match.route.id] = value;
  }

  let loaderData = {};

  for (let {
    route
  } of matches) {
    let value = newData[route.id] !== undefined ? newData[route.id] : state.loaderData[route.id];

    if (value !== undefined) {
      loaderData[route.id] = value;
    }
  }

  return loaderData;
}

function isCatchResult(result) {
  return result.value instanceof CatchValue;
}

function isErrorResult(result) {
  return result.value instanceof Error;
}

function createUrl(href) {
  return new URL(href, window.location.origin);
} //#endregion

exports.CatchValue = CatchValue;
exports.IDLE_FETCHER = IDLE_FETCHER;
exports.IDLE_TRANSITION = IDLE_TRANSITION;
exports.TransitionRedirect = TransitionRedirect;
exports.createTransitionManager = createTransitionManager;
