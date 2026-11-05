import { describe, expect, test } from "bun:test";
import { mapMessage, parseCallDurationSeconds } from "./mappers.js";

describe("parseCallDurationSeconds", () => {
  test("converts LINE DURATION milliseconds to seconds", () => {
    expect(parseCallDurationSeconds({ DURATION: "10000" })).toBe(10);
  });

  test("keeps the legacy duration field in seconds", () => {
    expect(parseCallDurationSeconds({ duration: 185 })).toBe(185);
  });

  test("returns undefined for missing or invalid duration", () => {
    expect(parseCallDurationSeconds(null)).toBeUndefined();
    expect(parseCallDurationSeconds({ DURATION: "0" })).toBeUndefined();
  });
});

describe("call record kind", () => {
  const call = (contentMetadata: Record<string, unknown>) =>
    mapMessage(
      {
        id: "1",
        from: "u-peer",
        to: "u-self",
        text: "Call History : 0 millisecs, Result: 77",
        contentType: "CALL",
        createdTime: 1,
        isMyMessage: false,
        contentMetadata: contentMetadata as Record<string, string>,
      },
      "u-peer",
      "a",
    ).callMeta;

  test("reads TYPE V as a video call, like the backend list preview", () => {
    expect(call({ TYPE: "V" })).toMatchObject({ video: true, group: false });
    expect(call({ TYPE: "A" })).toMatchObject({ video: false, group: false });
  });

  test("reads GC_DURATION as a group call whether it is a string or a number", () => {
    expect(call({ GC_DURATION: "0" })?.group).toBe(true);
    expect(call({ GC_DURATION: 0 })?.group).toBe(true);
    expect(call({ TYPE: "G", GC_MEDIA_TYPE: "AUDIO" })?.group).toBe(true);
  });
});
