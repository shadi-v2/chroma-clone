"use client";

import { GooeyToaster as GooeyToasterPrimitive, gooeyToast } from "goey-toast";
import type { GooeyToasterProps } from "goey-toast";
import "goey-toast/styles.css";

export { gooeyToast };
export type { GooeyToasterProps };
export type {
  GooeyToastOptions,
  GooeyPromiseData,
  GooeyToastAction,
  GooeyToastClassNames,
  GooeyToastTimings,
} from "goey-toast";

const GOOEY_SHADCN_CSS = `
.gooey-wrapper {
  --gooey-fill: #ffffff;
  --gooey-border: rgba(30, 47, 117, 0.15);
  --gooey-border-width: 1px;
  --gooey-title-default: #1e2f75;
  --gooey-title-loading: #1e2f75;
  --gooey-description: rgba(30, 47, 117, 0.7);
  --gooey-timestamp: rgba(30, 47, 117, 0.5);
  --gooey-close-fg: #1e2f75;
  --gooey-action-default-bg: #eef3ff;
  --gooey-action-default-fg: #1e2f75;
  --gooey-action-default-bg-hover: #b7c8ff;
  --gooey-action-default-bg-active: #97b2ff;
  --gooey-progress-track: rgba(30, 47, 117, 0.1);
  --gooey-progress-default: #3d63d6;
  --gooey-title-success: #16a34a;
  --gooey-action-success-fg: #15803d;
  --gooey-action-success-bg: #dcfce7;
  --gooey-action-success-bg-hover: #bbf7d0;
  --gooey-action-success-bg-active: #86efac;
  --gooey-progress-success: #16a34a;
  --gooey-title-error: #dc2626;
  --gooey-action-error-fg: #b91c1c;
  --gooey-action-error-bg: #fee2e2;
  --gooey-action-error-bg-hover: #fecaca;
  --gooey-action-error-bg-active: #fca5a5;
  --gooey-progress-error: #dc2626;
  --gooey-title-warning: #d97706;
  --gooey-action-warning-fg: #b45309;
  --gooey-action-warning-bg: #fef3c7;
  --gooey-action-warning-bg-hover: #fde68a;
  --gooey-action-warning-bg-active: #fcd34d;
  --gooey-progress-warning: #d97706;
  --gooey-title-info: #2563eb;
  --gooey-action-info-fg: #1d4ed8;
  --gooey-action-info-bg: #dbeafe;
  --gooey-action-info-bg-hover: #bfdbfe;
  --gooey-action-info-bg-active: #93c5fd;
  --gooey-progress-info: #2563eb;
}
`;

export function GooeyToaster(props: GooeyToasterProps) {
  return (
    <>
      <style>{GOOEY_SHADCN_CSS}</style>
      <GooeyToasterPrimitive position="bottom-right" {...props} />
    </>
  );
}
