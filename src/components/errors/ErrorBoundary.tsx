"use client";

import type { ReactNode } from "react";
import { Component } from "react";
import { errorLogger } from "@/lib/logging/client";
import { ErrorFallback } from "./ErrorFallback";

export type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: (props: ErrorFallbackRenderProps) => ReactNode;
  onError?: (error: Error, errorInfo: { componentStack?: string | null }) => void;
  resetKeys?: unknown[];
};

export type ErrorFallbackRenderProps = {
  error: Error;
  reset: () => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * Global React error boundary — catches render errors in client subtrees.
 * Use in layouts or feature shells; Next.js `error.tsx` handles route segments.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string | null }) {
    errorLogger.unhandled(error, {
      source: "react_error_boundary",
      componentStack: errorInfo.componentStack ?? undefined,
    });
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (!this.state.error || !this.props.resetKeys) return;
    if (prevProps.resetKeys?.some((key, i) => key !== this.props.resetKeys?.[i])) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback({ error, reset: this.reset });
      }
      return <ErrorFallback error={error} reset={this.reset} />;
    }
    return this.props.children;
  }
}
