// Used SQL as a starting point
// https://github.com/microsoft/monaco-languages/blob/main/src/sql/sql.ts
// TODO: consider open sourcing the apex part
import type * as monaco from 'monaco-editor';

// lazy load to ensure not in main bundle
const soqlParserJs = import('soql-parser-js');

type Monaco = typeof monaco;

export function configureSoqlLanguage(monaco: Monaco) {
  monaco.languages.register({ id: 'soql' });
  monaco.languages.setLanguageConfiguration('soql', languageConfiguration);
  monaco.languages.setMonarchTokensProvider('soql', language);

  monaco.languages.registerDocumentFormattingEditProvider('soql', {
    provideDocumentFormattingEdits: async (model, options, token) => {
      return [
        {
          range: model.getFullModelRange(),
          text: (await soqlParserJs).formatQuery(model.getValue()),
        },
      ];
    },
  });
}

export const languageConfiguration: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: "'", close: "'" },
  ],
};

export const language = <monaco.languages.IMonarchLanguage>{
  defaultToken: '',
  tokenPostfix: '.soql',
  ignoreCase: true,

  brackets: [
    { open: '[', close: ']', token: 'delimiter.square' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' },
  ],
  keywords: [
    'ALLPRIVATE',
    'AS',
    'ASC',
    'AT',
    'BELOW',
    'BY',
    'BY',
    'CALENDAR_MONTH',
    'CALENDAR_QUARTER',
    'CALENDAR_YEAR',
    'CATEGORY',
    'CONVERTCURRENCY',
    'CONVERTTIMEZONE',
    'COUNT_DISTINCT',
    'CUSTOM',
    'DATA',
    'DAY_IN_MONTH',
    'DAY_IN_WEEK',
    'DAY_IN_YEAR',
    'DAY_ONLY',
    'DELEGATED',
    'DESC',
    'DISTANCE',
    'ELSE',
    'END',
    'EVERYTHING',
    'EXCLUDES',
    'FALSE',
    'FIELDS',
    'FIRST',
    'FISCAL_MONTH',
    'FISCAL_QUARTER',
    'FISCAL_YEAR',
    'FOR',
    'FROM',
    'GEOLOCATION',
    'GROUP',
    'HAVING',
    'HOUR_IN_DAY',
    'INCLUDES',
    'LAST_90_DAYS',
    'LAST_FISCAL_QUARTER',
    'LAST_FISCAL_YEAR',
    'LAST_MONTH',
    'LAST_N_DAYS',
    'LAST_N_FISCAL_QUARTERS',
    'LAST_N_FISCAL_YEARS',
    'LAST_N_MONTHS',
    'LAST_N_QUARTERS',
    'LAST_N_WEEKS',
    'LAST_N_YEARS',
    'LAST_QUARTER',
    'LAST_WEEK',
    'LAST_YEAR',
    'LAST',
    'LIMIT',
    'MINE',
    'MINEANDMYGROUPS',
    'MY_TEAM_TERRITORY',
    'MY_TERRITORY',
    'N_DAYS_AGO',
    'N_FISCAL_QUARTERS_AGO',
    'N_FISCAL_YEARS_AGO',
    'N_MONTHS_AGO',
    'N_QUARTERS_AGO',
    'N_WEEKS_AGO',
    'N_YEARS_AGO',
    'NEXT_90_DAYS',
    'NEXT_FISCAL_QUARTER',
    'NEXT_FISCAL_YEAR',
    'NEXT_MONTH',
    'NEXT_N_DAYS',
    'NEXT_N_FISCAL_QUARTERS',
    'NEXT_N_FISCAL_YEARS',
    'NEXT_N_MONTHS',
    'NEXT_N_QUARTERS',
    'NEXT_N_WEEKS',
    'NEXT_N_YEARS',
    'NEXT_QUARTER',
    'NEXT_WEEK',
    'NEXT_YEAR',
    'NULLS',
    'OFFSET',
    'ORDER',
    'REFERENCE',
    'ROLLUP',
    'SCOPE',
    'SECURITY_ENFORCED',
    'SELECT',
    'STANDARD',
    'TEAM',
    'THEN',
    'THIS_FISCAL_QUARTER',
    'THIS_FISCAL_YEAR',
    'THIS_MONTH',
    'THIS_QUARTER',
    'THIS_WEEK',
    'THIS_YEAR',
    'TODAY',
    'TOLABEL',
    'TOMORROW',
    'TRACKING',
    'TRUE',
    'TYPEOF',
    'UPDATE',
    'USING',
    'VIEW',
    'VIEWSTAT',
    'WEEK_IN_MONTH',
    'WEEK_IN_YEAR',
    'WHEN',
    'WHERE',
    'WITH',
    'YESTERDAY',
  ],
  operators: ['ABOVE_OR_BELOW', 'ABOVE', 'ALL', 'AND', 'IN', 'LIKE', 'NOT IN', 'NOT', 'NULL', 'OR'],
  builtinFunctions: ['AVG', 'COUNT', 'CUBE', 'FORMAT', 'GROUPING', 'MAX', 'MIN', 'SUM', 'UPDATE'],
  tokenizer: {
    root: [
      { include: '@comments' },
      { include: '@whitespace' },
      { include: '@numbers' },
      { include: '@strings' },
      { include: '@complexIdentifiers' },
      { include: '@scopes' },
      [/[;,.]/, 'delimiter'],
      [/[()]/, '@brackets'],
      [
        /[\w@#$]+/,
        {
          cases: {
            '@keywords': 'keyword',
            '@operators': 'operator',
            '@builtinFunctions': 'predefined',
            '@default': 'identifier',
          },
        },
      ],
      [/[<>=!%+-]/, 'operator'],
    ],
    whitespace: [[/\s+/, 'white']],
    comments: [
      [/\/\/+.*/, 'comment'],
      [/\/\*/, { token: 'comment.quote', next: '@comment' }],
    ],
    comment: [
      [/[^*/]+/, 'comment'],
      [/\*\//, { token: 'comment.quote', next: '@pop' }],
      [/./, 'comment'],
    ],
    numbers: [
      [/0[xX][0-9a-fA-F]*/, 'number'],
      [/[$][+-]*\d*(\.\d*)?/, 'number'],
      [/((\d+(\.\d*)?)|(\.\d+))([eE][-+]?\d+)?/, 'number'],
    ],
    strings: [
      [/N'/, { token: 'string', next: '@string' }],
      [/'/, { token: 'string', next: '@string' }],
    ],
    string: [
      [/[^']+/, 'string'],
      [/''/, 'string'],
      [/'/, { token: 'string', next: '@pop' }],
    ],
    complexIdentifiers: [
      [/\[/, { token: 'identifier.quote', next: '@bracketedIdentifier' }],
      [/"/, { token: 'identifier.quote', next: '@quotedIdentifier' }],
    ],
    bracketedIdentifier: [
      [/[^\]]+/, 'identifier'],
      [/]]/, 'identifier'],
      [/]/, { token: 'identifier.quote', next: '@pop' }],
    ],
    quotedIdentifier: [
      [/[^"]+/, 'identifier'],
      [/""/, 'identifier'],
      [/"/, { token: 'identifier.quote', next: '@pop' }],
    ],
    scopes: [
      [/(BEGIN|CASE)\b/i, { token: 'keyword.block' }],
      [/TYPEOF\b/i, { token: 'keyword.block' }],
      [/END\b/i, { token: 'keyword.block' }],
      [/WHEN\b/i, { token: 'keyword.choice' }],
      [/THEN\b/i, { token: 'keyword.choice' }],
      [/ELSE\b/i, { token: 'keyword.choice' }],
    ],
  },
};
