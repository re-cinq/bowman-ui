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

import { identifierName, memberPropertyName } from "../ast.mjs";

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
        const callee = node.callee;

        if (NETWORK_CONSTRUCTORS.has(identifierName(callee))) {
          report(node, `new ${callee.name}`);

          return;
        }

        // The same constructors reached through a global host - new window.WebSocket(...).
        const constructorName = memberPropertyName(callee);

        if (
          NETWORK_CONSTRUCTORS.has(constructorName) &&
          GLOBAL_HOSTS.has(identifierName(callee.object))
        ) {
          report(node, `new ${callee.object.name}.${constructorName}`);
        }
      },
      CallExpression(node) {
        const callee = node.callee;

        if (identifierName(callee) === "fetch") {
          report(node, "fetch");

          return;
        }

        const property = memberPropertyName(callee);

        if (property === null) {
          return;
        }

        const host = identifierName(callee.object);

        if (property === "fetch" && GLOBAL_HOSTS.has(host)) {
          report(node, "fetch");

          return;
        }

        // navigator.sendBeacon, bare or reached through a global host
        // (window.navigator.sendBeacon).
        const viaGlobalHost =
          memberPropertyName(callee.object) === "navigator" &&
          GLOBAL_HOSTS.has(identifierName(callee.object.object));

        if (property === "sendBeacon" && (host === "navigator" || viaGlobalHost)) {
          report(node, "navigator.sendBeacon");
        }
      },
    };
  },
};
