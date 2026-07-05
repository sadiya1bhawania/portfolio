"use client";

import { useCallback, useState } from "react";
import { Proposal } from "./data/detect";
import { applyAction, initState, isGated, DemoState } from "./state";

export function usePhaseTwoState(proposals: Proposal[]) {
  const [state, setState] = useState<DemoState>(() => initState(proposals, Date.now()));

  const approve = useCallback(() => {
    setState((prev) => applyAction(prev, proposals, { type: "APPROVE" }, Date.now()));
  }, [proposals]);

  const narrow = useCallback(() => {
    setState((prev) => applyAction(prev, proposals, { type: "NARROW" }, Date.now()));
  }, [proposals]);

  const ignore = useCallback(() => {
    setState((prev) => applyAction(prev, proposals, { type: "IGNORE" }, Date.now()));
  }, [proposals]);

  const reviewSample = useCallback(() => {
    setState((prev) => applyAction(prev, proposals, { type: "REVIEW_SAMPLE" }, Date.now()));
  }, [proposals]);

  const reset = useCallback(() => {
    setState((prev) => applyAction(prev, proposals, { type: "RESET" }, Date.now()));
  }, [proposals]);

  return {
    state,
    activeIndex: state.activeIndex,
    activeProposal: proposals[state.activeIndex],
    gated: isGated(state, proposals),
    everGated: state.everGated,
    approve,
    narrow,
    ignore,
    reviewSample,
    reset,
  };
}
