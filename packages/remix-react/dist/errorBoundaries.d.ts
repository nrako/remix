import type { Location } from "history";
import React from "react";
import type { CatchBoundaryComponent, ErrorBoundaryComponent } from "./routeModules";
import type { ThrownResponse } from "./errors";
declare type RemixErrorBoundaryProps = React.PropsWithChildren<{
    location: Location;
    component: ErrorBoundaryComponent;
    error?: Error;
}>;
declare type RemixErrorBoundaryState = {
    error: null | Error;
    location: Location;
};
export declare class RemixErrorBoundary extends React.Component<RemixErrorBoundaryProps, RemixErrorBoundaryState> {
    constructor(props: RemixErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): {
        error: Error;
    };
    static getDerivedStateFromProps(props: RemixErrorBoundaryProps, state: RemixErrorBoundaryState): {
        error: Error | null;
        location: Location;
    };
    render(): React.ReactNode;
}
/**
 * When app's don't provide a root level ErrorBoundary, we default to this.
 */
export declare function RemixRootDefaultErrorBoundary({ error }: {
    error: Error;
}): JSX.Element;
/**
 * Returns the status code and thrown response data.
 *
 * @see https://remix.run/api/conventions#catchboundary
 */
export declare function useCatch<Result extends ThrownResponse = ThrownResponse>(): Result;
declare type RemixCatchBoundaryProps = React.PropsWithChildren<{
    location: Location;
    component: CatchBoundaryComponent;
    catch?: ThrownResponse;
}>;
export declare function RemixCatchBoundary({ catch: catchVal, component: Component, children, }: RemixCatchBoundaryProps): JSX.Element;
/**
 * When app's don't provide a root level CatchBoundary, we default to this.
 */
export declare function RemixRootDefaultCatchBoundary(): JSX.Element;
export {};
