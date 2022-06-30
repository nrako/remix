import type { Action, Location } from "history";
import type { FormHTMLAttributes } from "react";
import * as React from "react";
import type { Navigator, Params } from "react-router";
import type { LinkProps, NavLinkProps } from "react-router-dom";
import type { AppData, FormEncType, FormMethod } from "./data";
import type { EntryContext, AssetsManifest } from "./entry";
import type { AppState } from "./errors";
import type { PrefetchPageDescriptor } from "./links";
import type { ClientRoute } from "./routes";
import type { RouteData } from "./routeData";
import type { RouteMatch as BaseRouteMatch } from "./routeMatching";
import type { RouteModules } from "./routeModules";
import { createTransitionManager } from "./transition";
import type { Transition, Fetcher } from "./transition";
interface RemixEntryContextType {
    manifest: AssetsManifest;
    matches: BaseRouteMatch<ClientRoute>[];
    routeData: {
        [routeId: string]: RouteData;
    };
    actionData?: RouteData;
    pendingLocation?: Location;
    appState: AppState;
    routeModules: RouteModules;
    serverHandoffString?: string;
    clientRoutes: ClientRoute[];
    transitionManager: ReturnType<typeof createTransitionManager>;
}
export declare const RemixEntryContext: React.Context<RemixEntryContextType | undefined>;
export declare function RemixEntry({ context: entryContext, action, location: historyLocation, navigator: _navigator, static: staticProp, }: {
    context: EntryContext;
    action: Action;
    location: Location;
    navigator: Navigator;
    static?: boolean;
}): JSX.Element;
export declare function RemixRoute({ id }: {
    id: string;
}): JSX.Element;
/**
 * Defines the prefetching behavior of the link:
 *
 * - "intent": Fetched when the user focuses or hovers the link
 * - "render": Fetched when the link is rendered
 * - "none": Never fetched
 */
declare type PrefetchBehavior = "intent" | "render" | "none";
export interface RemixLinkProps extends LinkProps {
    prefetch?: PrefetchBehavior;
}
export interface RemixNavLinkProps extends NavLinkProps {
    prefetch?: PrefetchBehavior;
}
/**
 * A special kind of `<Link>` that knows whether or not it is "active".
 *
 * @see https://remix.run/api/remix#navlink
 */
declare let NavLink: React.ForwardRefExoticComponent<RemixNavLinkProps & React.RefAttributes<HTMLAnchorElement>>;
export { NavLink };
/**
 * This component renders an anchor tag and is the primary way the user will
 * navigate around your website.
 *
 * @see https://remix.run/api/remix#link
 */
declare let Link: React.ForwardRefExoticComponent<RemixLinkProps & React.RefAttributes<HTMLAnchorElement>>;
export { Link };
export declare function composeEventHandlers<EventType extends React.SyntheticEvent | Event>(theirHandler: ((event: EventType) => any) | undefined, ourHandler: (event: EventType) => any): (event: EventType) => any;
/**
 * Renders the `<link>` tags for the current routes.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */
export declare function Links(): JSX.Element;
/**
 * This component renders all of the `<link rel="prefetch">` and
 * `<link rel="modulepreload"/>` tags for all the assets (data, modules, css) of
 * a given page.
 *
 * @param props
 * @param props.page
 * @see https://remix.run/api/remix#prefetchpagelinks-
 */
export declare function PrefetchPageLinks({ page, ...dataLinkProps }: PrefetchPageDescriptor): JSX.Element | null;
/**
 * Renders the `<title>` and `<meta>` tags for the current routes.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */
export declare function Meta(): JSX.Element;
declare type ScriptProps = Omit<React.HTMLProps<HTMLScriptElement>, "children" | "async" | "defer" | "src" | "type" | "noModule" | "dangerouslySetInnerHTML" | "suppressHydrationWarning">;
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
export declare function Scripts(props: ScriptProps): JSX.Element;
export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
    /**
     * The HTTP verb to use when the form is submit. Supports "get", "post",
     * "put", "delete", "patch".
     *
     * Note: If JavaScript is disabled, you'll need to implement your own "method
     * override" to support more than just GET and POST.
     */
    method?: FormMethod;
    /**
     * Normal `<form action>` but supports React Router's relative paths.
     */
    action?: string;
    /**
     * Normal `<form encType>`.
     *
     * Note: Remix defaults to `application/x-www-form-urlencoded` and also
     * supports `multipart/form-data`.
     */
    encType?: FormEncType;
    /**
     * Forces a full document navigation instead of a fetch.
     */
    reloadDocument?: boolean;
    /**
     * Replaces the current entry in the browser history stack when the form
     * navigates. Use this if you don't want the user to be able to click "back"
     * to the page with the form on it.
     */
    replace?: boolean;
    /**
     * A function to call when the form is submitted. If you call
     * `event.preventDefault()` then this form will not do anything.
     */
    onSubmit?: React.FormEventHandler<HTMLFormElement>;
}
/**
 * A Remix-aware `<form>`. It behaves like a normal form except that the
 * interaction with the server is with `fetch` instead of new document
 * requests, allowing components to add nicer UX to the page as the form is
 * submitted and returns with data.
 *
 * @see https://remix.run/api/remix#form
 */
declare let Form: React.ForwardRefExoticComponent<FormProps & React.RefAttributes<HTMLFormElement>>;
export { Form };
interface FormImplProps extends FormProps {
    fetchKey?: string;
}
declare let FormImpl: React.ForwardRefExoticComponent<FormImplProps & React.RefAttributes<HTMLFormElement>>;
export { FormImpl };
/**
 * Resolves a `<form action>` path relative to the current route.
 *
 * @see https://remix.run/api/remix#useformaction
 */
export declare function useFormAction(action?: string, method?: FormMethod): string;
export interface SubmitOptions {
    /**
     * The HTTP method used to submit the form. Overrides `<form method>`.
     * Defaults to "GET".
     */
    method?: FormMethod;
    /**
     * The action URL path used to submit the form. Overrides `<form action>`.
     * Defaults to the path of the current route.
     *
     * Note: It is assumed the path is already resolved. If you need to resolve a
     * relative path, use `useFormAction`.
     */
    action?: string;
    /**
     * The action URL used to submit the form. Overrides `<form encType>`.
     * Defaults to "application/x-www-form-urlencoded".
     */
    encType?: FormEncType;
    /**
     * Set `true` to replace the current entry in the browser's history stack
     * instead of creating a new one (i.e. stay on "the same page"). Defaults
     * to `false`.
     */
    replace?: boolean;
}
/**
 * Submits a HTML `<form>` to the server without reloading the page.
 */
export interface SubmitFunction {
    (
    /**
     * Specifies the `<form>` to be submitted to the server, a specific
     * `<button>` or `<input type="submit">` to use to submit the form, or some
     * arbitrary data to submit.
     *
     * Note: When using a `<button>` its `name` and `value` will also be
     * included in the form data that is submitted.
     */
    target: HTMLFormElement | HTMLButtonElement | HTMLInputElement | FormData | URLSearchParams | {
        [name: string]: string;
    } | null, 
    /**
     * Options that override the `<form>`'s own attributes. Required when
     * submitting arbitrary data without a backing `<form>`.
     */
    options?: SubmitOptions): void;
}
/**
 * Returns a function that may be used to programmatically submit a form (or
 * some arbitrary data) to the server.
 *
 * @see https://remix.run/api/remix#usesubmit
 */
export declare function useSubmit(): SubmitFunction;
export declare function useSubmitImpl(key?: string): SubmitFunction;
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
export declare function useBeforeUnload(callback: () => any): void;
export interface RouteMatch {
    /**
     * The id of the matched route
     */
    id: string;
    /**
     * The pathname of the matched route
     */
    pathname: string;
    /**
     * The dynamic parameters of the matched route
     *
     * @see https://remix.run/docs/api/conventions#dynamic-route-parameters
     */
    params: Params<string>;
    /**
     * Any route data associated with the matched route
     */
    data: RouteData;
    /**
     * The exported `handle` object of the matched route.
     *
     * @see https://remix.run/docs/api/conventions#handle
     */
    handle: undefined | {
        [key: string]: any;
    };
}
/**
 * Returns the current route matches on the page. This is useful for creating
 * layout abstractions with your current routes.
 *
 * @see https://remix.run/api/remix#usematches
 */
export declare function useMatches(): RouteMatch[];
/**
 * Returns the JSON parsed data from the current route's `loader`.
 *
 * @see https://remix.run/api/remix#useloaderdata
 */
export declare function useLoaderData<T = AppData>(): T;
/**
 * Returns the JSON parsed data from the current route's `action`.
 *
 * @see https://remix.run/api/remix#useactiondata
 */
export declare function useActionData<T = AppData>(): T | undefined;
/**
 * Returns everything you need to know about a page transition to build pending
 * navigation indicators and optimistic UI on data mutations.
 *
 * @see https://remix.run/api/remix#usetransition
 */
export declare function useTransition(): Transition;
export declare type FetcherWithComponents<TData> = Fetcher<TData> & {
    Form: React.ForwardRefExoticComponent<FormProps & React.RefAttributes<HTMLFormElement>>;
    submit: SubmitFunction;
    load: (href: string) => void;
};
/**
 * Interacts with route loaders and actions without causing a navigation. Great
 * for any interaction that stays on the same page.
 *
 * @see https://remix.run/api/remix#usefetcher
 */
export declare function useFetcher<TData = any>(): FetcherWithComponents<TData>;
/**
 * Provides all fetchers currently on the page. Useful for layouts and parent
 * routes that need to provide pending/optimistic UI regarding the fetch.
 *
 * @see https://remix.run/api/remix#usefetchers
 */
export declare function useFetchers(): Fetcher[];
export declare const LiveReload: (() => null) | (({ port, nonce, }: {
    port?: number | undefined;
    /**
     * @deprecated this property is no longer relevant.
     */
    nonce?: string | undefined;
}) => JSX.Element);
