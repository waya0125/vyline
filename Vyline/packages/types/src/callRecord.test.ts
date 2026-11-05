import { expect, test } from "bun:test";
import { callRecordLabel, readCallRecord } from "./callRecord.js";

test("reads the call kind from TYPE and the group media type", () => {
  expect(readCallRecord("CALL", { TYPE: "A", RESULT: "NORMAL" })).toEqual({
    video: false,
    group: false,
    outcome: "ended",
  });
  expect(readCallRecord("CALL", { TYPE: "V", RESULT: "NORMAL" }).video).toBe(true);
  expect(readCallRecord("CALL", { TYPE: "G", GC_MEDIA_TYPE: "AUDIO" })).toMatchObject({
    video: false,
    group: true,
  });
  expect(readCallRecord("CALL", { TYPE: "G", GC_MEDIA_TYPE: "VIDEO" })).toMatchObject({
    video: true,
    group: true,
  });
});

test("treats GC_DURATION as a group call whether it is a string or a number", () => {
  expect(readCallRecord("CALL", { GC_DURATION: "0" }).group).toBe(true);
  expect(readCallRecord("CALL", { GC_DURATION: 0 }).group).toBe(true);
  expect(readCallRecord("CALL", { GC_DURATION: "" }).group).toBe(false);
  expect(readCallRecord("CALL", {}).group).toBe(false);
});

test("reads the outcome from RESULT", () => {
  expect(readCallRecord("CALL", { RESULT: "CANCELED" }).outcome).toBe("missed");
  expect(readCallRecord("CALL", { RESULT: "REJECTED" }).outcome).toBe("declined");
  expect(readCallRecord("CALL", { RESULT: "BUSY" }).outcome).toBe("busy");
  expect(readCallRecord("CALL", null).outcome).toBe("ended");
});

test("labels call records for the chat list", () => {
  expect(callRecordLabel(undefined)).toBe("音声通話");
  expect(callRecordLabel(readCallRecord("CALL", { TYPE: "V", RESULT: "CANCELED" }))).toBe(
    "不在着信 · ビデオ通話",
  );
  expect(callRecordLabel(readCallRecord("CALL", { TYPE: "G", GC_MEDIA_TYPE: "AUDIO" }))).toBe(
    "グループ通話",
  );
  expect(callRecordLabel(readCallRecord("CALL", { GC_DURATION: 0, TYPE: "V" }))).toBe(
    "グループビデオ通話",
  );
});
