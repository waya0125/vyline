import { callRecordLabel } from "@vyline/types";
import type { CallMessageMeta } from "./store-types.js";

/**
 * 通話の記録の一覧用の表示。バックエンドの一覧のプレビューと同じ言い方にそろえる
 * （開いているトークは画面側、開いていないトークはバックエンドがプレビューを作るため）。
 * 種類の読み方（parseCallMeta）も言い方も @vyline/types の共通の規則を使う。
 */
export function callPreviewLabel(meta: CallMessageMeta | undefined): string {
  return callRecordLabel(meta);
}
