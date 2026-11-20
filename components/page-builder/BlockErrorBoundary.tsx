"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { BlockFallback } from "./BlockFallback";

type BlockErrorBoundaryProps = {
  blockType: string;
  index: number;
  /**
   * When this value changes (e.g. the editor sends new props), a failed block
   * gets another chance to render instead of staying broken forever.
   */
  resetKey?: unknown;
  children: ReactNode;
};

type BlockErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Isolates each block: if a *registered* component throws (e.g. the CMS sent
 * props in an unexpected shape), only that section is replaced by a fallback
 * instead of the whole page crashing. Error boundaries must be class components.
 */
export class BlockErrorBoundary extends Component<BlockErrorBoundaryProps, BlockErrorBoundaryState> {
  state: BlockErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): BlockErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[PageBuilder] Block "${this.props.blockType}" (#${this.props.index}) failed to render.`,
      error,
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: BlockErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <BlockFallback reason="error" index={this.props.index} blockType={this.props.blockType} />;
    }
    return this.props.children;
  }
}
