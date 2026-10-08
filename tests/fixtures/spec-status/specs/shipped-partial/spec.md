# fixture lantern ferry

| Field  | Value                |
| ------ | -------------------- |
| Issue  | re-cinq/bowman-ui#17 |
| Status | Shipped              |

The lantern ferry crosses the estuary on the hour and carries a spare lamp for the return
leg after dusk.

## The rule

- The ferry leaves on the hour whatever the tide
  ([validated by](../../__tests__/fixture-evidence.ts#L1)).
- The spare lamp is lit before the return leg and never during the crossing.
