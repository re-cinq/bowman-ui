import { fireEvent } from "@testing-library/react";
import type { Mock } from "vitest";

export const expectClickEventDelivered = (onClick: Mock, button: HTMLElement): void => {
  fireEvent.click(button);

  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onClick.mock.calls[0][0]).toMatchObject({ type: "click", target: button });
  expect(onClick.mock.calls[0][0].nativeEvent).toBeInstanceOf(MouseEvent);
};
