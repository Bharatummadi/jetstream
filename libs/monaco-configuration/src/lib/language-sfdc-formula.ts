import type * as monaco from 'monaco-editor';
import { conf as tsConfig, language as tsLanguage } from 'monaco-editor/esm/vs/basic-languages/typescript/typescript';
type Monaco = typeof monaco;

export function configureSfdcFormulaLanguage(monaco: Monaco) {
  monaco.languages.register({ id: 'sfdc-formula' });
  monaco.languages.setLanguageConfiguration('sfdc-formula', languageConfiguration);
  monaco.languages.setMonarchTokensProvider('sfdc-formula', language);

  // TODO: format formula (maybe call to server an use prettier?)
  // monaco.languages.registerDocumentFormattingEditProvider('sfdc-formula', {
  //   provideDocumentFormattingEdits: async (model, options, token) => {
  //     return [
  //       {
  //         range: model.getFullModelRange(),
  //         text: (await soqlParserJs).formatQuery(model.getValue()),
  //       },
  //     ];
  //   },
  // });
}

export const languageConfiguration: monaco.languages.LanguageConfiguration = {
  // eslint-disable-next-line no-useless-escape
  wordPattern: tsConfig.wordPattern,
  comments: tsConfig.comments,
  brackets: [
    ['{', '}'],
    ['(', ')'],
  ],
  onEnterRules: tsConfig.onEnterRules,
  autoClosingPairs: tsConfig.autoClosingPairs,
  colorizedBracketPairs: [
    ['{', '}'],
    ['(', ')'],
  ],
};

export const language = <monaco.languages.IMonarchLanguage>{
  defaultToken: '',
  tokenPostfix: '.formula',
  ignoreCase: true,
  keywords: [
    'ABS',
    'ACOS',
    'ADDMONTHS',
    'AND',
    'ASCII',
    'ASIN',
    'ATAN',
    'ATAN2',
    'BEGINS',
    'BLANKVALUE',
    'BR',
    'CASE',
    'CASESAFEID',
    'CEILING',
    'CHR',
    'CONTAINS',
    'COS',
    'CURRENCYRATE',
    'DATE',
    'DATETIMEVALUE',
    'DATEVALUE',
    'DAY',
    'DAYOFYEAR',
    'DISTANCE',
    'EXP',
    'FIND',
    'FLOOR',
    'FORMATDURATION',
    'FROMUNIXTIME',
    'GEOLOCATION',
    'GETRECORDIDS',
    'GETSESSIONID',
    'HOUR',
    'HTMLENCODE',
    'HYPERLINK',
    'IF',
    'IMAGE',
    'IMAGEPROXYURL',
    'INCLUDE',
    'INCLUDES',
    'INITCAP',
    'ISBLANK',
    'ISCHANGED',
    'ISCLONE',
    'ISNEW',
    'ISNULL',
    'ISNUMBER',
    'ISOWEEK',
    'ISOYEAR',
    'ISPICKVAL',
    'JSENCODE',
    'JSINHTMLENCOD',
    'JUNCTIONIDLIST',
    'LEFT',
    'LEN',
    'LINKTO',
    'LN',
    'LOG',
    'LOWER',
    'LPAD',
    'MAX',
    'MCEILING',
    'MFLOOR',
    'MID',
    'MILLISECOND',
    'MIN',
    'MINUTE',
    'MOD',
    'MONTH',
    'NOT',
    'NOW',
    'NULLVALUE',
    'OR',
    'PARENTGROUPVAL',
    'PI',
    'PICKLISTCOUNT',
    'PREDICT',
    'PREVGROUPVAL',
    'PRIORVALUE',
    'REGEX',
    'REQUIRESCRIPT',
    'REVERSE',
    'RIGHT',
    'ROUND',
    'RPAD',
    'SECOND',
    'SIN',
    'SQRT',
    'SUBSTITUTE',
    'TAN',
    'TEXT',
    'TIMENOW',
    'TIMEVALUE',
    'TODAY',
    'TRIM',
    'TRUNC',
    'UNIXTIMESTAMP',
    'UPPER',
    'URLENCODE',
    'URLFOR',
    'VALUE',
    'VLOOKUP',
    'WEEKDAY',
    'YEAR',
    '$Api',
    '$CustomMetadata',
    '$Label',
    '$Organization',
    '$Permission',
    '$Profile',
    '$Setup',
    '$System',
    '$User',
    '$UserRole',
  ],
  operators: ['+', '-', '*', '/', '^', '=', '==', '<>', '!=', '<', '>', '<=', '>=', '&&', '||', '&'],
  typeKeywords: [],
  symbols: tsLanguage.symbols,
  escapes: tsLanguage.escapes,
  digits: tsLanguage.digits,
  octaldigits: tsLanguage.octaldigits,
  binarydigits: tsLanguage.binarydigits,
  hexdigits: tsLanguage.hexdigits,
  regexpctl: tsLanguage.regexpctl,
  regexpesc: tsLanguage.regexpesc,
  tokenizer: tsLanguage.tokenizer,
};