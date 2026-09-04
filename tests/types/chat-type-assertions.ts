// Compiled by tests/types/chat.test.ts with tsc --noEmit. Each ts-expect-error
// directive below is load-bearing: if the suppressed assignment ever starts to
// compile, tsc reports the directive as unused and the test fails.
import type {
  AssistantChatEntry,
  ChatEntry,
  ThinkingChatEntry,
  ToolChatEntry,
  UserChatEntry,
} from "../../src/types/chat.js";

// @ts-expect-error -- a fifth role is not part of the ChatEntry union
const fifthRole: ChatEntry = { id: "e1", role: "system", content: "nope" };

// @ts-expect-error -- AssistantChatEntry requires isStreaming
const assistantWithoutIsStreaming: AssistantChatEntry = {
  id: "e2",
  role: "assistant",
  content: "hi",
};

const userWithPersona: UserChatEntry = {
  id: "e3",
  role: "user",
  content: "hi",
  // @ts-expect-error -- persona is assistant-only: a user entry accepts none
  persona: "olt-support",
};

const thinkingWithPersona: ThinkingChatEntry = {
  id: "e4",
  role: "thinking",
  content: "",
  isStreaming: true,
  // @ts-expect-error -- persona is assistant-only: a thinking entry accepts none
  persona: "olt-support",
};

const toolWithPersona: ToolChatEntry = {
  id: "e5",
  role: "tool",
  toolName: "get_weather",
  toolInput: {},
  // @ts-expect-error -- persona is assistant-only: a tool entry accepts none
  persona: "olt-support",
};

const allFourRolesCompile: ChatEntry[] = [
  { id: "u1", role: "user", content: "hello" },
  {
    id: "a1",
    role: "assistant",
    content: "",
    isStreaming: true,
    toolStatus: "Running get_weather...",
    persona: "olt-support",
  },
  { id: "t1", role: "thinking", content: "", isStreaming: true },
  {
    id: "x1",
    role: "tool",
    toolName: "get_weather",
    toolInput: { location: "Berlin" },
  },
];

void fifthRole;
void assistantWithoutIsStreaming;
void userWithPersona;
void thinkingWithPersona;
void toolWithPersona;
void allFourRolesCompile;
