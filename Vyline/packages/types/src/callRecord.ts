/**
 * 通話の記録（contentType が CALL のメッセージ）の contentMetadata の読み方。
 * バックエンド（トーク一覧のプレビュー）と画面（通話の記録・開いているトークの一覧）で
 * 同じ規則を使い、表示が開閉で変わらないようにする。
 *
 * 実際の記録では TYPE が "A"（音声）・"V"（ビデオ）・"G"（グループ）で、
 * グループには GC_MEDIA_TYPE（"AUDIO" / "VIDEO"）が付く。
 */
export type CallRecordOutcome = "ended" | "missed" | "declined" | "busy";

export interface CallRecordKind {
  video: boolean;
  group: boolean;
  outcome: CallRecordOutcome;
}

type CallRecordMeta = Record<string, unknown> | null | undefined;

function hasValue(value: unknown): boolean {
  return value != null && String(value).trim() !== "";
}

export function readCallRecord(contentType: string, meta: CallRecordMeta): CallRecordKind {
  const type = contentType.toUpperCase();
  const hint = String(meta?.CALL_TYPE ?? meta?.TYPE ?? "").toUpperCase();
  const media = String(meta?.GC_MEDIA_TYPE ?? "").toUpperCase();
  const video =
    (type.includes("VIDEO") && type.includes("CALL")) ||
    hint.includes("VIDEO") ||
    hint === "1" ||
    hint === "V" ||
    media.includes("VIDEO");
  const group =
    type.includes("GROUP") ||
    hint === "G" ||
    hasValue(meta?.GC_MEDIA_TYPE) ||
    hasValue(meta?.GC_DURATION);
  const result = String(meta?.RESULT ?? meta?.eventType ?? "").toLowerCase();
  let outcome: CallRecordOutcome = "ended";
  if (result.includes("cancel") || result.includes("miss") || result === "3") {
    outcome = "missed";
  } else if (result.includes("decline") || result.includes("reject") || result === "2") {
    outcome = "declined";
  } else if (result.includes("busy")) {
    outcome = "busy";
  }
  return { video, group, outcome };
}

/** 一覧のプレビュー用の言い方（「音声通話」「不在着信 · ビデオ通話」など） */
export function callRecordLabel(record: Partial<CallRecordKind> | null | undefined): string {
  const video = record?.video === true;
  const kind = record?.group
    ? video
      ? "グループビデオ通話"
      : "グループ通話"
    : video
      ? "ビデオ通話"
      : "音声通話";
  return record?.outcome === "missed" ? `不在着信 · ${kind}` : kind;
}
