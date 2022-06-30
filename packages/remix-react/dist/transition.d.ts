import { Action } from "history";
import type { Location } from "history";
import type { RouteData } from "./routeData";
import type { RouteMatch } from "./routeMatching";
import type { ClientRoute } from "./routes";
export interface CatchData<T = any> {
    status: number;
    statusText: string;
    data: T;
}
export interface TransitionManagerState {
    /**
     * The current location the user sees in the browser, during a transition this
     * is the "old page"
     */
    location: Location;
    /**
     * The current set of route matches the user sees in the browser. During a
     * transition this are the "old matches"
     */
    matches: ClientMatch[];
    /**
     * Only used When both navigation and fetch loads are pending, the fetch loads
     * may need to use the next matches to load data.
     */
    nextMatches?: ClientMatch[];
    /**
     * Data from the loaders that user sees in the browser. During a transition
     * this is the "old" data, unless there are multiple pending forms, in which
     * case this may be updated as fresh data loads complete
     */
    loaderData: RouteData;
    /**
     * Holds the action data for the latest NormalPostSubmission
     */
    actionData?: RouteData;
    /**
     * Tracks the latest, non-keyed pending submission
     */
    transition: Transition;
    /**
     * Persists thrown response loader/action data. TODO: should probably be an array
     * and keep track of them all and pass the array to ErrorBoundary.
     */
    catch?: CatchData;
    /**
     * Persists uncaught loader/action errors. TODO: should probably be an array
     * and keep track of them all and pass the array to ErrorBoundary.
     */
    error?: Error;
    /**
     * The id of the nested ErrorBoundary in which to render the error.
     *
     * - undefined: no error
     * - null: error, but no routes have a boundary, use a default
     * - string: actual id
     */
    errorBoundaryId: null | string;
    /**
     * The id of the nested ErrorBoundary in which to render the error.
     *
     * - undefined: no error
     * - null: error, but no routes have a boundary, use a default
     * - string: actual id
     */
    catchBoundaryId: null | string;
    fetchers: Map<string, Fetcher>;
}
export interface TransitionManagerInit {
    routes: ClientRoute[];
    location: Location;
    loaderData: RouteData;
    actionData?: RouteData;
    catch?: CatchData;
    error?: Error;
    catchBoundaryId?: null | string;
    errorBoundaryId?: null | string;
    onChange: (state: TransitionManagerState) => void;
    onRedirect: (to: string, state?: any) => void;
}
export interface Submission {
    action: string;
    method: string;
    formData: FormData;
    encType: string;
    key: string;
}
export interface ActionSubmission extends Submission {
    method: "POST" | "PUT" | "PATCH" | "DELETE";
}
export interface LoaderSubmission extends Submission {
    method: "GET";
}
export declare type TransitionStates = {
    Idle: {
        state: "idle";
        type: "idle";
        submission: undefined;
        location: undefined;
    };
    SubmittingAction: {
        state: "submitting";
        type: "actionSubmission";
        submission: ActionSubmission;
        location: Location;
    };
    SubmittingLoader: {
        state: "submitting";
        type: "loaderSubmission";
        submission: LoaderSubmission;
        location: Location;
    };
    LoadingLoaderSubmissionRedirect: {
        state: "loading";
        type: "loaderSubmissionRedirect";
        submission: LoaderSubmission;
        location: Location;
    };
    LoadingAction: {
        state: "loading";
        type: "actionReload";
        submission: ActionSubmission;
        location: Location;
    };
    LoadingActionRedirect: {
        state: "loading";
        type: "actionRedirect";
        submission: ActionSubmission;
        location: Location;
    };
    LoadingFetchActionRedirect: {
        state: "loading";
        type: "fetchActionRedirect";
        submission: undefined;
        location: Location;
    };
    LoadingRedirect: {
        state: "loading";
        type: "normalRedirect";
        submission: undefined;
        location: Location;
    };
    Loading: {
        state: "loading";
        type: "normalLoad";
        location: Location;
        submission: undefined;
    };
};
export declare type Transition = TransitionStates[keyof TransitionStates];
export declare type Redirects = {
    Loader: {
        isRedirect: true;
        type: "loader";
        setCookie: boolean;
    };
    Action: {
        isRedirect: true;
        type: "action";
        setCookie: boolean;
    };
    LoaderSubmission: {
        isRedirect: true;
        type: "loaderSubmission";
        setCookie: boolean;
    };
    FetchAction: {
        isRedirect: true;
        type: "fetchAction";
        setCookie: boolean;
    };
};
declare type FetcherStates<TData = any> = {
    Idle: {
        state: "idle";
        type: "init";
        submission: undefined;
        data: undefined;
    };
    SubmittingAction: {
        state: "submitting";
        type: "actionSubmission";
        submission: ActionSubmission;
        data: undefined;
    };
    SubmittingLoader: {
        state: "submitting";
        type: "loaderSubmission";
        submission: LoaderSubmission;
        data: TData | undefined;
    };
    ReloadingAction: {
        state: "loading";
        type: "actionReload";
        submission: ActionSubmission;
        data: TData;
    };
    LoadingActionRedirect: {
        state: "loading";
        type: "actionRedirect";
        submission: ActionSubmission;
        data: undefined;
    };
    Loading: {
        state: "loading";
        type: "normalLoad";
        submission: undefined;
        data: TData | undefined;
    };
    Done: {
        state: "idle";
        type: "done";
        submission: undefined;
        data: TData;
    };
};
export declare type Fetcher<TData = any> = FetcherStates<TData>[keyof FetcherStates<TData>];
declare type ClientMatch = RouteMatch<ClientRoute>;
export declare class CatchValue {
    status: number;
    statusText: string;
    data: any;
    constructor(status: number, statusText: string, data: any);
}
export declare type NavigationEvent = {
    type: "navigation";
    action: Action;
    location: Location;
    submission?: Submission;
};
export declare type FetcherEvent = {
    type: "fetcher";
    key: string;
    submission?: Submission;
    href: string;
};
export declare type DataEvent = NavigationEvent | FetcherEvent;
export declare class TransitionRedirect {
    setCookie: boolean;
    location: string;
    constructor(location: Location | string, setCookie: boolean);
}
export declare const IDLE_TRANSITION: TransitionStates["Idle"];
export declare const IDLE_FETCHER: FetcherStates["Idle"];
export declare function createTransitionManager(init: TransitionManagerInit): {
    send: (event: DataEvent) => Promise<void>;
    getState: () => TransitionManagerState;
    getFetcher: <TData = any>(key: string) => Fetcher<TData>;
    deleteFetcher: (key: string) => void;
    dispose: () => void;
    readonly _internalFetchControllers: Map<string, AbortController>;
};
export {};
