/**
 * no-network-egress — no component code reaches the network. The privacy
 * contract (docs/design-notes.md § Lint guardrails; the no-egress invariant)
 * is enforced at runtime by the suite-wide traps in tests/setup.ts and at the
 * dependency level by scripts/check-forbidden-imports.mjs; this rule is the
 * lint-time backstop that names the violation at review time instead of at
 * test time.
 *
 * Flagged channels: `fetch` (bare or via window/globalThis/self),
 * `new WebSocket/EventSource/XMLHttpRequest`, and `navigator.sendBeacon`.
 * A denylist of the known egress channels, not an allowlist — components
 * legitimately touch plenty of other globals.
 */

const NETWORK_CONSTRUCTORS = new Set(["WebSocket", "EventSource", "XMLHttpRequest"]);
const GLOBAL_HOSTS = new Set(["window", "globalThis", "self"]);

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow network egress (fetch, WebSocket, EventSource, XMLHttpRequest, sendBeacon) in component code - see docs/design-notes.md § Lint guardrails",
    },
    schema: [],
    messages: {
      networkEgress:
        "Component code must not reach the network - '{{api}}' violates the no-egress contract. Data arrives through props; callbacks send it back up - see docs/design-notes.md § Lint guardrails.",
    },
  },

  create(context) {
    function report(node, api) {
      context.report({ node, messageId: "networkEgress", data: { api } });
    }

    return {
      NewExpression(node) {
        if (node.callee.type === "Identifier" && NETWORK_CONSTRUCTORS.has(node.callee.name)) {
          report(node, `new ${node.callee.name}`);

          return;
        }

        // The same constructors reached through a global host - new window.WebSocket(...).
        if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.property.type === "Identifier" &&
          NETWORK_CONSTRUCTORS.has(node.callee.property.name) &&
          node.callee.object.type === "Identifier" &&
          GLOBAL_HOSTS.has(node.callee.object.name)
        ) {
          report(node, `new ${node.callee.object.name}.${node.callee.property.name}`);
        }
      },
      CallExpression(node) {
        const callee = node.callee;

        if (callee.type === "Identifier" && callee.name === "fetch") {
          report(node, "fetch");

          return;
        }

        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.property.type !== "Identifier"
        ) {
          return;
        }

        const host = callee.object.type === "Identifier" ? callee.object.name : null;

        if (callee.property.name === "fetch" && GLOBAL_HOSTS.has(host)) {
          report(node, "fetch");

          return;
        }

        // navigator.sendBeacon, bare or reached through a global host
        // (window.navigator.sendBeacon).
        const viaGlobalHost =
          callee.object.type === "MemberExpression" &&
          !callee.object.computed &&
          callee.object.property.type === "Identifier" &&
          callee.object.property.name === "navigator" &&
          callee.object.object.type === "Identifier" &&
          GLOBAL_HOSTS.has(callee.object.object.name);

        if (callee.property.name === "sendBeacon" && (host === "navigator" || viaGlobalHost)) {
          report(node, "navigator.sendBeacon");
        }
      },
    };
  },
};
