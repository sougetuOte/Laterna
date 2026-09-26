// design.md §6.1 の決定「manifest JSON を明示マップ経由で直接 import する」の本実装
// (W3-script-engine-T13、SPIKE 暫定 (W1-script-engine-T4) を置換)。
// W4-script-engine-T18: 同一方式で pdf-manifest レジストリ（`pdfManifestRegistry` /
// `resolvePdfManifest`）を追加（design §8.1 decision: PDF ページ分割は compile 段で確定し
// `public/manifests/<script-id>.pdf-manifest.json` を成果物として書き出す MUST）。
//
// **新規台本追加時の手順（docs/conventions/video-creation-rules.md §8 にも記載）**:
//   1. `npm run compile:script -- <script-id>` で `public/manifests/<script-id>.manifest.json` と
//      `public/manifests/<script-id>.pdf-manifest.json` を生成
//   2. 本ファイル冒頭に
//      `import <name> from "../../../public/manifests/<script-id>.manifest.json";` と
//      `import <name>Pdf from "../../../public/manifests/<script-id>.pdf-manifest.json";` を追加
//   3. 下記 `manifestRegistry` に `"<script-id>": <name> as TimelineManifest,` を、
//      `pdfManifestRegistry` に `"<script-id>": <name>Pdf as PdfManifest,` を追加

import javaVsJs from "../../../public/manifests/java-vs-js.manifest.json";
import javaVsJsPdf from "../../../public/manifests/java-vs-js.pdf-manifest.json";
import sourceToExe from "../../../public/manifests/source-to-exe.manifest.json";
import sourceToExePdf from "../../../public/manifests/source-to-exe.pdf-manifest.json";
import type { TimelineManifest } from "../schema/timeline-manifest";
import type { PdfManifest } from "../pdf/script-pdf-manifest";

export const manifestRegistry: Record<string, TimelineManifest> = {
  "java-vs-js": javaVsJs as TimelineManifest,
  "source-to-exe": sourceToExe as TimelineManifest,
};

/** design §8.1: `public/manifests/<script-id>.pdf-manifest.json` の直接 import マップ。 */
export const pdfManifestRegistry: Record<string, PdfManifest> = {
  "java-vs-js": javaVsJsPdf as PdfManifest,
  "source-to-exe": sourceToExePdf as PdfManifest,
};

/**
 * `scriptId` に対応する manifest を解決する。design §4.4「`manifestRegistry` 未登録 `scriptId` で
 * render」の挙動（明示エラー停止、「compile 未実行」の案内メッセージ）をここで実装する。
 *
 * design §4.4 v3.5 追加: `slides` フィールドを持たない旧 manifest（schema v3.5 以前の生成物）で
 * render された場合も明示エラー停止とする（黙認続行 MUST NOT）。`schema_version` 自体は v1 のまま
 * 据え置き（design §4.3 v3.5 注記: フィールド追加は後方互換）のため、`schema_version` の値では
 * 判定できず、`slides` フィールドの有無を直接見る。
 */
export function resolveManifest(scriptId: string): TimelineManifest {
  const manifest = manifestRegistry[scriptId];
  if (!manifest) {
    const registered = Object.keys(manifestRegistry);
    throw new Error(
      `manifest for scriptId "${scriptId}" is not registered in manifestRegistry. ` +
        `compile が未実行の可能性があります。"npm run compile:script -- ${scriptId}" を実行して ` +
        `manifest を生成し、manifest-registry.ts の import マップへ追記してください。` +
        ` (登録済み scriptId: ${registered.length > 0 ? registered.join(", ") : "なし"})`,
    );
  }
  if (!Array.isArray(manifest.slides)) {
    throw new Error(
      `manifest for scriptId "${scriptId}" is missing the "slides" field. ` +
        `manifest が古い（schema v3.5 以前の生成物）可能性があります。` +
        `"npm run compile:script -- ${scriptId}" を再実行して manifest を再生成してください。`,
    );
  }
  // design §4.4 v3.6 追加: `speakers` フィールドを持たない旧 manifest も明示エラー停止（slides 欠落と同型）。
  // `Array.isArray` 拒否: `typeof [] === "object"` のため配列も素通りしてしまう。slides 検証と同等の
  // 厳密さにするため、配列（Record<string, ManifestSpeaker> ではない構造）を明示的に reject する。
  if (typeof manifest.speakers !== "object" || manifest.speakers === null || Array.isArray(manifest.speakers)) {
    throw new Error(
      `manifest for scriptId "${scriptId}" is missing the "speakers" field. ` +
        `manifest が古い（design v3.6 以前の生成物）可能性があります。` +
        `"npm run compile:script -- ${scriptId}" を再実行して manifest を再生成してください。`,
    );
  }
  return manifest;
}

/**
 * `scriptId` に対応する PDF manifest を解決する（W4-script-engine-T18、design §8.1 decision）。
 * `resolveManifest` と同型の明示エラー停止（「compile 未実行」の案内メッセージ）を行う。
 */
export function resolvePdfManifest(scriptId: string): PdfManifest {
  const manifest = pdfManifestRegistry[scriptId];
  if (!manifest) {
    const registered = Object.keys(pdfManifestRegistry);
    throw new Error(
      `pdf-manifest for scriptId "${scriptId}" is not registered in pdfManifestRegistry. ` +
        `compile が未実行の可能性があります。"npm run compile:script -- ${scriptId}" を実行して ` +
        `pdf-manifest を生成し、manifest-registry.ts の import マップへ追記してください。` +
        ` (登録済み scriptId: ${registered.length > 0 ? registered.join(", ") : "なし"})`,
    );
  }
  return manifest;
}
