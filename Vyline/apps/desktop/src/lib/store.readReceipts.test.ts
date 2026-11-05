import { afterEach, expect, test } from "bun:test";
import { hasCheckedReadReceipts, useStore } from "./store.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  useStore.setState({
    accountId: null,
    chats: [],
    messages: [],
    activeChatId: null,
    readDisabledMids: {},
  });
});

test("manual mark-all sends receipts even when automatic receipts are disabled", async () => {
  const requests: Array<{ url: string; body: { chatMids?: string[] } }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body ?? "{}")) as { chatMids?: string[] },
    });
    return Response.json({ ok: true, lastMessageId: "server-latest" });
  }) as typeof fetch;

  useStore.setState((state) => ({
    accountId: "mark-all-read-test",
    settings: { ...state.settings, readReceipts: false },
    readDisabledMids: { "c-disabled-chat": true },
    chats: [
      {
        id: "u-unread-chat",
        name: "DM",
        type: "friend",
        avatar: "D",
        color: "#000",
        status: "",
        unread: 2,
        lastMessagePreview: "",
        lastMessageTime: 1,
      },
      {
        id: "c-disabled-chat",
        name: "Group",
        type: "group",
        avatar: "G",
        color: "#000",
        status: "",
        unread: 1,
        lastMessagePreview: "",
        lastMessageTime: 1,
      },
      {
        id: "u-read-chat",
        name: "Read",
        type: "friend",
        avatar: "R",
        color: "#000",
        status: "",
        unread: 0,
        lastMessagePreview: "",
        lastMessageTime: 1,
      },
    ],
  }));

  await useStore.getState().markAllChatsRead();

  expect(requests).toHaveLength(1);
  expect(requests[0]?.url).toContain("/read-all");
  expect(requests[0]?.body.chatMids?.sort()).toEqual(["c-disabled-chat", "u-unread-chat"]);
  expect(useStore.getState().chats.every((chat) => chat.unread === 0)).toBe(true);
});

test("an old group chat is checked again after a failed first read receipt fetch", async () => {
  const chatId = "c-old-group";
  const accountId = "read-receipt-retry";
  let calls = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).includes("/getMessageReadRange/")) {
      calls += 1;
      if (calls === 1) return Response.json({ ok: false });
      return Response.json({ ok: true, receipts: { "100": { readCount: 2, readBy: [] } } });
    }
    return Response.json({ ok: true });
  }) as typeof fetch;
  useStore.setState({
    accountId,
    chats: [],
    readWatermarks: {},
    messages: [
      {
        id: "100",
        chatId,
        authorId: "me",
        kind: "text",
        text: "",
        // 追跡の期限（15 分）を過ぎた発言
        createdAt: Date.now() - 60 * 60_000,
        messageState: "normal",
        read: false,
      } as never,
    ],
  });

  await useStore.getState().refreshReadReceipts(chatId);
  expect(calls).toBe(1);
  expect(hasCheckedReadReceipts(accountId, chatId)).toBe(false);

  await useStore.getState().refreshReadReceipts(chatId);
  expect(calls).toBe(2);
  expect(hasCheckedReadReceipts(accountId, chatId)).toBe(true);
  expect(useStore.getState().messages[0]?.readCount).toBe(2);

  // 取得できた後は、期限を過ぎた発言のために取り直さない
  await useStore.getState().refreshReadReceipts(chatId);
  expect(calls).toBe(2);
});
