import { IOS_SAFARI_UA } from '../shared/protocol';

type Rule = chrome.declarativeNetRequest.Rule;

/** エミュレーター画面のタブ内で発生する、トップレベル以外のすべての通信 */
const SUBRESOURCE_TYPES = [
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'object',
  'xmlhttprequest',
  'ping',
  'csp_report',
  'media',
  'websocket',
  'webtransport',
  'webbundle',
  'other',
] as chrome.declarativeNetRequest.ResourceType[];

const REMOVE_FRAME_BLOCKERS = [
  { header: 'x-frame-options', operation: 'remove' as chrome.declarativeNetRequest.HeaderOperation },
  { header: 'content-security-policy', operation: 'remove' as chrome.declarativeNetRequest.HeaderOperation },
];

/**
 * エミュレーター画面のタブ専用のセッションルールを作る。
 * 1. iframe 内の通信を iPhone の Safari として送る（User-Agent を差し替え、Safari が送らない Client Hints を外す）
 * 2. iframe への埋め込みを拒む応答ヘッダー（X-Frame-Options と CSP）を外す。外すのは次の2つだけ:
 *    - エミュレーター画面が端末の iframe に読み込ませたページ（initiator が自分の拡張機能）
 *    - 端末の iframe の中で、同じサイトのページへ移ったとき（firstParty）
 *    表示中のページがさらに別サイトを埋め込む iframe には、元のヘッダーを残す（クリックジャッキング対策）。
 * どのルールも tabIds で対象のタブに限るので、ほかのタブの通信には影響しない。
 */
export function buildRulesForTab(tabId: number, firstRuleId: number, extensionId: string): Rule[] {
  return [
    {
      id: firstRuleId,
      priority: 1,
      action: {
        type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
        requestHeaders: [
          { header: 'user-agent', operation: 'set' as chrome.declarativeNetRequest.HeaderOperation, value: IOS_SAFARI_UA },
          { header: 'sec-ch-ua', operation: 'remove' as chrome.declarativeNetRequest.HeaderOperation },
          { header: 'sec-ch-ua-mobile', operation: 'remove' as chrome.declarativeNetRequest.HeaderOperation },
          { header: 'sec-ch-ua-platform', operation: 'remove' as chrome.declarativeNetRequest.HeaderOperation },
        ],
      },
      condition: { tabIds: [tabId], resourceTypes: SUBRESOURCE_TYPES },
    },
    {
      id: firstRuleId + 1,
      priority: 1,
      action: { type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType, responseHeaders: REMOVE_FRAME_BLOCKERS },
      condition: {
        tabIds: [tabId],
        resourceTypes: ['sub_frame' as chrome.declarativeNetRequest.ResourceType],
        initiatorDomains: [extensionId],
      },
    },
    {
      id: firstRuleId + 2,
      priority: 1,
      action: { type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType, responseHeaders: REMOVE_FRAME_BLOCKERS },
      condition: {
        tabIds: [tabId],
        resourceTypes: ['sub_frame' as chrome.declarativeNetRequest.ResourceType],
        domainType: 'firstParty' as chrome.declarativeNetRequest.DomainType,
      },
    },
  ];
}

/** 既存のセッションルールのうち、指定タブ向けのものの ID */
export function ruleIdsForTab(rules: Rule[], tabId: number): number[] {
  return rules.filter((r) => r.condition.tabIds?.includes(tabId)).map((r) => r.id);
}

export function nextRuleId(rules: Rule[]): number {
  return rules.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}
