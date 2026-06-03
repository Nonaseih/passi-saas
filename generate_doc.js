const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageNumber, ExternalHyperlink
} = require('docx');
const fs = require('fs');

// ── Helpers ──────────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 100, bottom: 100, left: 160, right: 160 };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'Arial', color: 'C0356A' })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Arial', color: '2C2C2C' })]
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, font: 'Arial', ...opts })]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: 'Arial' })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun('')] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E8E8E8', space: 1 } },
    children: [new TextRun('')]
  });
}

function tableRow(label, value, isHeader = false) {
  const shade = isHeader
    ? { fill: 'F5D0E2', type: ShadingType.CLEAR }
    : { fill: 'FFFFFF', type: ShadingType.CLEAR };
  return new TableRow({
    children: [
      new TableCell({
        borders, shading: isHeader ? { fill: 'C0356A', type: ShadingType.CLEAR } : shade,
        margins: cellMargins,
        width: { size: 3200, type: WidthType.DXA },
        children: [new Paragraph({
          children: [new TextRun({ text: label, size: 20, font: 'Arial', bold: isHeader, color: isHeader ? 'FFFFFF' : '333333' })]
        })]
      }),
      new TableCell({
        borders, shading: shade,
        margins: cellMargins,
        width: { size: 6160, type: WidthType.DXA },
        children: [new Paragraph({
          children: [new TextRun({ text: value, size: 20, font: 'Arial', color: '333333' })]
        })]
      }),
    ]
  });
}

function makeTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 6160],
    rows
  });
}

// ── Document ─────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 560, hanging: 280 } } }
      }]
    }]
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } }
    }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0', space: 4 } },
          children: [new TextRun({ text: 'PassI — アイドル特典券SaaS　開発報告書', size: 18, font: 'Arial', color: '999999' })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: '- ', size: 18, color: '999999' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '999999' }),
            new TextRun({ text: ' -', size: 18, color: '999999' }),
          ]
        })]
      })
    },
    children: [

      // ── Cover ──────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200, after: 160 },
        children: [new TextRun({ text: 'PassI', size: 64, bold: true, font: 'Arial', color: 'C0356A' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'アイドル特典券SaaSプラットフォーム', size: 28, font: 'Arial', color: '555555' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 600 },
        children: [new TextRun({ text: '開発進捗報告書 / Milestone 1 完了報告 + Milestone 2 依頼事項', size: 22, font: 'Arial', color: '888888' })]
      }),

      makeTable([
        tableRow('作成日', '2026年5月26日'),
        tableRow('対象フェーズ', 'Phase 1 — Milestone 1 完了 / Milestone 2 着手準備'),
        tableRow('リポジトリ', 'https://github.com/Nonaseih/passi-saas'),
        tableRow('ステータス', 'Milestone 1 完了 ✓　Milestone 2 着手待ち'),
      ]),

      divider(),

      // ── Section 1 ──────────────────────────────────────────
      heading1('1. Milestone 1 完了報告'),
      body('以下の通り、Milestone 1（要件整理・設計・開発基盤構築）が完了しました。'),
      spacer(),

      heading2('1-1. 完了内容'),
      makeTable([
        tableRow('項目', '詳細', true),
        tableRow('DB設計・テーブル構成', '6テーブル設計・SQL実装完了（users / events / ticket_types / tickets / payments / scan_logs）'),
        tableRow('Supabase初期構築', 'プロジェクト作成・マイグレーション適用・RLSポリシー設定完了'),
        tableRow('認証基盤', 'Supabase Auth連携・fan / staff / adminロール設計・保護ルート実装'),
        tableRow('Stripe設計', 'クライアント設定・チェックアウトフロー設計・Webhookスケルトン実装'),
        tableRow('GitHub構成', 'リポジトリ作成・main / developブランチ運用開始'),
        tableRow('開発環境', 'Vite + React + TypeScript + Tailwind CSS + shadcn/ui 構築・ビルド確認済み'),
        tableRow('技術仕様書', '全項目日本語で整備済み（リポジトリ内 docs/ フォルダ）'),
      ]),
      spacer(),

      heading2('1-2. 成果物'),
      bullet('GitHubリポジトリ：https://github.com/Nonaseih/passi-saas'),
      bullet('DB設計書・マイグレーションSQL（supabase/migrations/）'),
      bullet('RLSポリシー設定（全6テーブル）'),
      bullet('認証コンテキスト・ロールベースルーティング'),
      bullet('Supabase Edge Functions スケルトン（決済・Webhook）'),
      bullet('技術仕様書（docs/M1_技術仕様書.md）'),
      bullet('ビルド確認済み開発環境（0エラー）'),

      divider(),

      // ── Section 2 ──────────────────────────────────────────
      heading1('2. Milestone 2 着手に必要な情報・素材'),
      body('Milestone 2（認証・決済・チケット発行機能）の開発着手に向けて、以下の情報・素材のご提供をお願いいたします。'),
      spacer(),

      heading2('2-1. Stripe アカウント情報（必須）'),
      body('決済機能の実装に必要です。以下のキーをご提供ください。', { bold: false }),
      spacer(),

      makeTable([
        tableRow('項目', '内容', true),
        tableRow('Stripe 公開可能キー', 'pk_test_xxxxx または pk_live_xxxxx'),
        tableRow('Stripe シークレットキー', 'sk_test_xxxxx または sk_live_xxxxx（安全な方法でご共有ください）'),
        tableRow('Stripe Webhookシークレット', 'Webhookエンドポイント設定後に発行されます（M2着手後に設定）'),
        tableRow('Stripeアカウント', 'アカウントをお持ちでない場合は stripe.com より作成をお願いします'),
      ]),
      spacer(),
      body('⚠️ シークレットキーは暗号化チャット等の安全な方法でご共有ください。メール・チャット平文での送付はお控えください。', { color: 'C0356A', bold: true }),

      spacer(),
      heading2('2-2. チケット・商品情報（必須）'),
      body('Stripe上での商品登録に使用します。'),
      spacer(),

      makeTable([
        tableRow('項目', '内容', true),
        tableRow('チケット種別名', '例：2ショットチェキ券、サイン会券 等'),
        tableRow('各チケットの価格（円）', '例：3,000円、5,000円 等'),
        tableRow('在庫数（種別ごと）', '各種別の販売上限枚数'),
        tableRow('有効期限', 'チケット利用可能期間（イベント当日のみ 等）'),
      ]),

      spacer(),
      heading2('2-3. デザインリポジトリへのアクセス（重要）'),
      body('実装精度を最大化するため、以下のデザインリポジトリへの閲覧権限（Read access）のご付与をお願いいたします。'),
      spacer(),

      makeTable([
        tableRow('対象アプリ', 'デプロイURL', true),
        tableRow('ファン向けアプリ', 'https://idol-deploy.vercel.app/'),
        tableRow('スタッフ向け / 管理画面', 'https://mobile-app-code.vercel.app/'),
      ]),
      spacer(),

      bullet('ソースコードへのアクセスにより、カラー・レイアウト・コンポーネント構成を完全に一致させることが可能です'),
      bullet('スクリーンショットベースの実装と比較して、デザイン再現精度が大幅に向上します'),
      bullet('GitHubアカウント：Nonaseih'),

      spacer(),
      heading2('2-4. メール認証・ブランド設定（推奨）'),
      makeTable([
        tableRow('項目', '内容', true),
        tableRow('会員登録時のメール確認', '必要 / 不要（どちらかご指定ください）'),
        tableRow('送信元メールアドレス', '例：noreply@passi.jp（独自ドメイン希望の場合）'),
        tableRow('サービス表示名', '例：PassI（メール件名等に使用）'),
        tableRow('本番ドメイン', '確定している場合はご共有ください（未定の場合は暫定運用）'),
      ]),

      divider(),

      // ── Section 3 ──────────────────────────────────────────
      heading1('3. 今後のスケジュール'),
      makeTable([
        tableRow('フェーズ', '内容 / 期間', true),
        tableRow('✅ Milestone 1（完了）', '要件整理・設計・開発基盤構築 — 完了'),
        tableRow('⏳ Milestone 2（着手待ち）', '認証・Stripe決済・QR発行 — 5〜7日（素材受領後即着手）'),
        tableRow('🔲 Milestone 3', 'QRスキャン・もぎり・オフライン対応 — 5〜8日'),
        tableRow('🔲 Milestone 4', '管理画面・テスト・デプロイ — 4〜6日'),
        tableRow('🎯 テストリリース目標', '2026年7月'),
      ]),

      spacer(),

      heading2('進捗状況'),
      body('現在、Milestone 2の着手準備として以下まで実装済みです：'),
      spacer(),
      bullet('ファンアプリ全画面（ログイン・登録・パスワードリセット・チケット一覧・QR表示・購入履歴）'),
      bullet('スタッフアプリ全画面（QRスキャン・もぎり処理・オフライン対応・スキャン履歴）'),
      bullet('Supabase Edge Functions（create-checkout-session / stripe-webhook）— Stripeキー挿入で即有効化可能'),
      bullet('QRコード生成・表示・スキャン機能（オフライン対応含む）'),
      spacer(),
      body('Stripeキー・デザインリポジトリアクセスの提供後、即日着手可能な状態です。', { bold: true }),

      divider(),

      // ── Footer note ────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 0 },
        children: [new TextRun({ text: 'ご不明な点がございましたらお気軽にご連絡ください。', size: 20, font: 'Arial', color: '888888' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 0 },
        children: [new TextRun({ text: 'シークレットキー等の機密情報は安全な方法でご共有ください。', size: 20, font: 'Arial', color: 'C0356A' })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('C:\\Users\\fortu\\OneDrive\\Desktop\\PassI_M1報告_M2依頼.docx', buffer);
  console.log('✅ Document created: PassI_M1報告_M2依頼.docx');
});
