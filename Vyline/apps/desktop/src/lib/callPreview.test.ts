import { expect, test } from "bun:test";
import type { Message as LineMessage } from "@vyline/types";
import { callPreviewLabel } from "./callPreview.js";
import { mapMessage } from "./mappers.js";

function callMessage(contentMetadata: Record<string, string>): LineMessage {
  return {
    id: "1",
    from: "u-peer",
    to: "u-self",
    text: "Call History : 0 millisecs, Result: 77",
    contentType: "CALL",
    createdTime: 1,
    isMyMessage: false,
    contentMetadata,
  };
}

function labelOf(contentMetadata: Record<string, unknown>): string {
  const message = mapMessage(callMessage(contentMetadata as Record<string, string>), "u-peer", "a");
  return callPreviewLabel(message.callMeta);
}

test("labels call records like the backend list preview", () => {
  expect(callPreviewLabel(undefined)).toBe("音声通話");
  expect(labelOf({ TYPE: "A", RESULT: "NORMAL" })).toBe("音声通話");
  expect(labelOf({ TYPE: "V", RESULT: "CANCELED" })).toBe("不在着信 · ビデオ通話");
  expect(labelOf({ TYPE: "G", GC_MEDIA_TYPE: "AUDIO" })).toBe("グループ通話");
  expect(labelOf({ TYPE: "G", GC_MEDIA_TYPE: "VIDEO", RESULT: "REJECTED" })).toBe(
    "グループビデオ通話",
  );
});
