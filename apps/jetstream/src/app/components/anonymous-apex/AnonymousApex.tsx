/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useSetTraceFlag } from '@jetstream/connected-ui';
import { logger } from '@jetstream/shared/client-logger';
import { ANALYTICS_KEYS, INDEXED_DB, LOG_LEVELS } from '@jetstream/shared/constants';
import { anonymousApex } from '@jetstream/shared/data';
import { useDebounce, useNonInitialEffect, useRollbar } from '@jetstream/shared/ui-utils';
import { ApexHistoryItem, MapOf, SalesforceOrgUi } from '@jetstream/types';
import { AutoFullHeightContainer, Badge, Card, CopyToClipboard, Grid, Icon, SalesforceLogin, Spinner } from '@jetstream/ui';
import Editor, { OnMount, useMonaco } from '@monaco-editor/react';
import localforage from 'localforage';
import type { editor } from 'monaco-editor';
import { Fragment, FunctionComponent, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import Split from 'react-split';
import { useRecoilState, useRecoilValue } from 'recoil';
import { applicationCookieState, selectedOrgState, STORAGE_KEYS } from '../../app-state';
import { useAmplitude } from '../core/analytics';
import AnonymousApexFilter from './AnonymousApexFilter';
import AnonymousApexHistory from './AnonymousApexHistory';
import * as fromApexState from './apex.state';
// import { useApexCompletions } from './useApexCompletions';

const USER_DEBUG_REGEX = /\|USER_DEBUG\|/;

// TODO: ADD COMPLETIONS - useApexCompletions() need to refactor for monaco

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AnonymousApexProps {}

export const AnonymousApex: FunctionComponent<AnonymousApexProps> = () => {
  const isMounted = useRef(null);
  const apexRef = useRef<editor.IStandaloneCodeEditor>(null);
  const logRef = useRef<editor.IStandaloneCodeEditor>(null);
  const { trackEvent } = useAmplitude();
  const rollbar = useRollbar();
  const [{ serverUrl }] = useRecoilState(applicationCookieState);
  const selectedOrg = useRecoilValue<SalesforceOrgUi>(selectedOrgState);
  const [apex, setApex] = useState(() => localStorage.getItem(STORAGE_KEYS.ANONYMOUS_APEX_STORAGE_KEY) || '');
  const [results, setResults] = useState('');
  const [resultsStatus, setResultsStatus] = useState({ hasResults: false, success: false, label: null });
  const [loading, setLoading] = useState(false);
  const [historyItems, setHistoryItems] = useRecoilState(fromApexState.apexHistoryState);
  const debouncedApex = useDebounce(apex, 1000);
  const monaco = useMonaco();

  /** Add trace for 1 hour so that any background jobs are logged even if dev console is not open */
  useSetTraceFlag(selectedOrg, 1);

  const [logLevel, setLogLevel] = useState<string>('FINEST');
  const [userDebug, setUserDebug] = useState(false);
  const [textFilter, setTextFilter] = useState<string>('');
  const [visibleResults, setVisibleResults] = useState<string>('');

  useEffect(() => {
    isMounted.current = true;
    return () => (isMounted.current = false);
  }, []);

  useNonInitialEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANONYMOUS_APEX_STORAGE_KEY, debouncedApex);
  }, [debouncedApex]);

  useNonInitialEffect(() => {
    if (apex) {
      (async () => {
        try {
          await localforage.setItem<MapOf<ApexHistoryItem>>(INDEXED_DB.KEYS.apexHistory, historyItems);
        } catch (ex) {
          logger.warn(ex);
        }
      })();
    }
  }, [historyItems]);

  useEffect(() => {
    setVisibleResults(results || '');
  }, [results]);

  useEffect(() => {
    let currResults = results.split('\n');
    // remove non user-debug lines
    if (userDebug && currResults) {
      currResults = currResults.filter((line) => USER_DEBUG_REGEX.test(line));
    }
    // apply text filter
    if (textFilter && results) {
      const textFilterRegex = new RegExp(textFilter, 'i');
      currResults = currResults.filter((line) => textFilterRegex.test(line));
    }
    setVisibleResults(currResults.join('\n'));
  }, [results, userDebug, textFilter]);

  // this is required otherwise the action has stale variables in scope
  useNonInitialEffect(() => {
    if (monaco && apexRef.current) {
      apexRef.current.addAction({
        id: 'modifier-enter',
        label: 'Submit',
        keybindings: [monaco?.KeyMod.CtrlCmd | monaco?.KeyCode.Enter],
        run: (currEditor) => {
          onSubmit(currEditor.getValue());
        },
      });
    }
  }, [selectedOrg]);

  const onSubmit = useCallback(
    async (value: string) => {
      setLoading(true);
      setResults('');
      setTextFilter('');
      setUserDebug(false);
      setResultsStatus({ hasResults: false, success: false, label: null });
      try {
        const { result, debugLog } = await anonymousApex(selectedOrg, value, logLevel);
        if (!result.success) {
          let summary = '';
          summary += `line ${result.line}, column ${result.column}\n`;
          summary += result.compileProblem ? `${result.compileProblem}\n` : '';
          summary += result.exceptionMessage ? `${result.exceptionMessage}\n` : '';
          summary += result.exceptionStackTrace ? `${result.exceptionStackTrace}\n` : '';
          if (debugLog) {
            summary += `\n${debugLog}`;
          }
          setResults(summary);
          setResultsStatus({ hasResults: true, success: false, label: result.compileProblem ? 'Compile Error' : 'Runtime Error' });
        } else {
          setResults(debugLog);
          setResultsStatus({ hasResults: true, success: true, label: 'Success' });
          fromApexState
            .initNewApexHistoryItem(selectedOrg, value)
            .then((updatedHistoryItems) => {
              setHistoryItems(updatedHistoryItems);
            })
            .catch((ex) => {
              logger.warn('[ERROR] Could not save history', ex);
              rollbar.error('Error saving apex history', ex);
            });
        }
        trackEvent(ANALYTICS_KEYS.apex_Submitted, { success: result.success });
      } catch (ex) {
        setResults(`There was a problem submitting the request\n${ex.message}`);
        trackEvent(ANALYTICS_KEYS.apex_Submitted, { success: false });
      } finally {
        setLoading(false);
      }
    },
    [historyItems, selectedOrg, logLevel, setHistoryItems, trackEvent]
  );

  function handleEditorChange(value, event) {
    setApex(value);
  }

  const handleApexEditorMount: OnMount = (currEditor, monaco) => {
    apexRef.current = currEditor;
    // this did not run on initial render if used in useEffect
    apexRef.current.addAction({
      id: 'modifier-enter',
      label: 'Submit',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: (currEditor) => {
        onSubmit(currEditor.getValue());
      },
    });
  };

  function handleLogEditorMount(ed: editor.IStandaloneCodeEditor) {
    logRef.current = ed;
  }

  function handleOpenDevConsole(event: MouseEvent<HTMLAnchorElement>, loginUrl: string) {
    event.preventDefault();
    event.stopPropagation();
    window.open(loginUrl, 'Developer Console', 'height=600,width=600');
  }

  function handleLogLevelChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setLogLevel(event.target.value);
  }

  return (
    <AutoFullHeightContainer fillHeight bottomBuffer={10} setHeightAttr className="slds-p-horizontal_x-small slds-scrollable_none">
      <Split
        sizes={[50, 50]}
        minSize={[300, 300]}
        gutterSize={10}
        className="slds-gutters"
        css={css`
          display: flex;
          flex-direction: row;
        `}
      >
        <div className="slds-p-horizontal_x-small">
          <Card
            className="h-100"
            title={
              <Fragment>
                Anonymous Apex
                <SalesforceLogin
                  className="slds-m-right_x-small"
                  serverUrl={serverUrl}
                  org={selectedOrg}
                  returnUrl="/_ui/common/apex/debug/ApexCSIPage"
                  iconPosition="right"
                  title="Open developer console"
                  onClick={handleOpenDevConsole}
                ></SalesforceLogin>
              </Fragment>
            }
            actions={
              <Fragment>
                <div className="slds-m-horizontal_x-small">
                  <select className="slds-select" onChange={handleLogLevelChange} value={logLevel}>
                    {LOG_LEVELS.map((item) => (
                      <option key={item} value={item}>
                        Log Level: {item}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="slds-button slds-button_brand" onClick={() => onSubmit(apex)}>
                  <Icon type="utility" icon="apex" className="slds-button__icon slds-button__icon_left" omitContainer />
                  Submit
                </button>
              </Fragment>
            }
          >
            <Fragment>
              <Grid>
                <AnonymousApexHistory className="slds-grow slds-m-bottom_x-small" onHistorySelected={setApex} />
              </Grid>
              <Editor
                height="80vh"
                theme="vs-dark"
                defaultLanguage="apex"
                value={apex}
                options={{ contextmenu: false }}
                onMount={handleApexEditorMount}
                onChange={handleEditorChange}
              />
            </Fragment>
          </Card>
        </div>
        <div className="slds-p-horizontal_x-small slds-is-relative">
          <Card
            className="h-100"
            title={
              <div>
                Results
                {resultsStatus.hasResults && (
                  <span className="slds-m-left_small">
                    <Badge type={resultsStatus.success ? 'success' : 'error'}>
                      <span className="slds-badge__icon slds-badge__icon_left slds-badge__icon_inverse">
                        <Icon
                          type="utility"
                          icon={resultsStatus.success ? 'success' : 'error'}
                          containerClassname="slds-icon_container slds-current-color"
                          className="slds-icon slds-icon_xx-small"
                        />
                      </span>
                      {resultsStatus.label}
                    </Badge>
                  </span>
                )}
              </div>
            }
            actions={<CopyToClipboard type="button" content={results} disabled={!results} />}
          >
            {loading && <Spinner />}
            <AnonymousApexFilter
              textFilter={textFilter}
              userDebug={userDebug}
              hasResults={!!resultsStatus.hasResults}
              onTextChange={setTextFilter}
              onDebugChange={setUserDebug}
            />
            <Editor
              height="80vh"
              theme="vs-dark"
              defaultLanguage="powershell"
              options={{
                readOnly: true,
                contextmenu: false,
              }}
              value={visibleResults}
              onMount={handleLogEditorMount}
            />
          </Card>
        </div>
      </Split>
    </AutoFullHeightContainer>
  );
};

export default AnonymousApex;