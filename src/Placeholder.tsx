"use client";

// Throwaway component: exists only to prove the build/test/publish pipeline.
// The first real extraction PR deletes Placeholder.tsx, its test and its export.
export const Placeholder = () => {
  return <span data-placeholder="true">bowman-ui scaffold placeholder</span>;
};
