import { randomUUID } from "node:crypto";

import type { DiagnosticProviderId, RuntimeDiagnosticSignal } from "../../../shared/types/conversion";

type RuntimeDiagnosticInput = {
  attemptId: string;
  sourceProviderId: DiagnosticProviderId;
  targetProviderId: DiagnosticProviderId;
  failureClass: RuntimeDiagnosticSignal["failureClass"];
  normalizedIdentityHash: string;
  confidenceBucket: RuntimeDiagnosticSignal["confidenceBucket"];
  strippedTrackingKeys: string[];
  sink: RuntimeDiagnosticSignal["sink"];
};

declare global {
  // eslint-disable-next-line no-var
  var __podShiftRuntimeDiagnostics__: RuntimeDiagnosticSignal[] | undefined;
}

function getRuntimeDiagnosticsStore() {
  globalThis.__podShiftRuntimeDiagnostics__ ??= [];
  return globalThis.__podShiftRuntimeDiagnostics__;
}

export async function emitRuntimeDiagnosticSignal(
  input: RuntimeDiagnosticInput
): Promise<RuntimeDiagnosticSignal> {
  const diagnostic: RuntimeDiagnosticSignal = {
    diagnosticSignalId: randomUUID(),
    attemptId: input.attemptId,
    sourceProviderId: input.sourceProviderId,
    targetProviderId: input.targetProviderId,
    failureClass: input.failureClass,
    normalizedIdentityHash: input.normalizedIdentityHash,
    confidenceBucket: input.confidenceBucket,
    strippedTrackingKeys: input.strippedTrackingKeys,
    emittedAt: new Date().toISOString(),
    sink: input.sink
  };

  getRuntimeDiagnosticsStore().push(diagnostic);
  console.warn("[pod-shift] runtime-diagnostic", diagnostic);
  return diagnostic;
}

export function listRuntimeDiagnosticSignals() {
  return [...getRuntimeDiagnosticsStore()];
}

export function clearRuntimeDiagnosticSignals() {
  globalThis.__podShiftRuntimeDiagnostics__ = [];
}
