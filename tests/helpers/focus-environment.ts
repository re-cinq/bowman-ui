// jsdom performs no layout and reports offsetParent as null everywhere, which
// would make the focus trap see every element as hidden; give attached elements
// a real-looking offsetParent and run requestAnimationFrame callbacks at once.
export const stubFocusEnvironment = () => {
  const offsetParentDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetParent"
  );

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetParent", {
      configurable: true,
      get() {
        return (this as HTMLElement).parentElement;
      },
    });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);

      return 0;
    });
  });

  const restoreOffsetParent = () => {
    if (offsetParentDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "offsetParent", offsetParentDescriptor);
    }
  };

  afterEach(() => {
    restoreOffsetParent();
    vi.unstubAllGlobals();
  });

  return { restoreOffsetParent };
};
