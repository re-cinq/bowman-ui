const url = "https://greetings.invalid/latest";
const courier = { fetch: (target: string) => target.length, WebSocket: class {} };
const tracker = { sendBeacon: (target: string) => target.length };
const frame = { window };
const getCourier = () => courier;

export const viaWindow = () => window.fetch(url);
export const viaGlobalThis = () => globalThis.fetch(url);
export const viaSelf = () => self.fetch(url);
export const viaOptionalHost = () => window?.fetch(url);
export const viaOptionalCall = () => window.fetch?.(url);
export const socket = new WebSocket(url);
export const source = new EventSource(url);
export const request = new XMLHttpRequest();
export const hostedSocket = new window.WebSocket(url);
export const hostedSource = new globalThis.EventSource(url);
export const hostedRequest = new self.XMLHttpRequest();
export const beacon = () => navigator.sendBeacon(url);
export const hostedBeacon = () => window.navigator.sendBeacon(url);
export const globalBeacon = () => globalThis.navigator.sendBeacon(url);
export const optionalBeacon = () => navigator?.sendBeacon(url);
export const computedFetch = () => window["fetch"](url);
export const computedSocket = new window["WebSocket"](url);
export const computedBeaconHost = () => window["navigator"].sendBeacon(url);
export const computedBeacon = () => navigator["sendBeacon"](url);
export const optionalComputedFetch = () => window?.["fetch"](url);
export const computedBeaconChain = () => window["navigator"]["sendBeacon"](url);
export const templateFetch = () => window[`fetch`](url);

// Outside the denylist: a computed member whose property is a template with
// substitutions, non-global hosts, other constructors.
export const substitutionFetch = () => window[`fe${"tch"}`](url);
export const localFetch = () => courier.fetch(url);
export const calledFetch = () => getCourier().fetch(url);
export const localSocket = new courier.WebSocket();
export const localBeacon = () => tracker.sendBeacon(url);
export const nestedBeacon = () => frame.window.navigator.sendBeacon(url);
export const stamp = new Date();

// A non-computed member whose property is a private name, not an Identifier.
export class Courier {
  #fetch = (target: string) => target.length;
  #WebSocket = class {};
  #navigator = { sendBeacon: (target: string) => target.length };

  privateFetch() {
    return window.#fetch(url);
  }

  privateSocket() {
    return new window.#WebSocket();
  }

  privateBeacon() {
    return window.#navigator.sendBeacon(url);
  }
}
