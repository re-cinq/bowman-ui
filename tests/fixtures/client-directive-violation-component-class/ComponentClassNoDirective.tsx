// Red fixture for scripts/check-client-directives.mjs: class components with
// no hook and no JSX handler, without "use client". One extends the named
// import, one extends through the namespace import - both heritage shapes
// must fire.
import { Component } from "react";
import * as React from "react";

export class ComponentClassNoDirective extends Component {
  render() {
    return null;
  }
}

export class NamespaceComponentClassNoDirective extends React.PureComponent {
  render() {
    return null;
  }
}

declare const withStoredDefaults: (value: unknown) => new () => object;

// A mixin expression is walked for value references even though the heritage
// head is not a React class - only implements clauses are skipped wholesale.
export class MixinNoDirective extends withStoredDefaults(
  localStorage.getItem("theme"),
) {}
