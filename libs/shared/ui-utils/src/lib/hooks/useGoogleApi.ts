import { logger } from '@jetstream/shared/client-logger';
import addSeconds from 'date-fns/addSeconds';
import isAfter from 'date-fns/isAfter';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getUseInjectScript } from './useInjectScript';
import { useNonInitialEffect } from './useNonInitialEffect';
import { useRollbar } from './useRollbar';

const useInjectScriptGapi = getUseInjectScript('https://apis.google.com/js/api.js');
const useInjectScriptGis = getUseInjectScript('https://accounts.google.com/gsi/client');

let _apiLoaded = false;
let _tokenClient: google.accounts.oauth2.TokenClient;
let _tokenResponse: google.accounts.oauth2.TokenResponse;
let _tokenExpiration: Date;

export const SCOPES = {
  'drive.file': 'https://www.googleapis.com/auth/drive.file',
};

export interface GoogleApiClientConfig {
  appId: string;
  apiKey: string;
  clientId: string;
  scopes?: string[];
}

/**
 * Handles loading Google API via script tag and loading individual libraries
 * @returns
 */
export function useGoogleApi({ clientId, scopes = [SCOPES['drive.file']] }: GoogleApiClientConfig) {
  const isMounted = useRef(null);
  const rollbar = useRollbar();
  const tokenClient = useRef<google.accounts.oauth2.TokenClient>(_tokenClient);
  const tokenResponse = useRef<google.accounts.oauth2.TokenResponse>(_tokenResponse);
  const tokenCallback = useRef<{
    resolve: (value: google.accounts.oauth2.TokenResponse) => void;
    reject: (reason?: any) => void;
  }>();
  const tokenExpiration = useRef<Date>(_tokenExpiration);
  const [gapiScriptLoaded, gapiScriptLoadError] = useInjectScriptGapi();
  const [gisScriptLoaded, gisScriptLoadError] = useInjectScriptGis();
  const [loading, setLoading] = useState(!_apiLoaded);
  const [error, setError] = useState<string>();
  const [hasApisLoaded, setHasApisLoaded] = useState(_apiLoaded);

  const scriptLoaded = gapiScriptLoaded && gisScriptLoaded;
  const scriptLoadedError = gapiScriptLoadError || gisScriptLoadError;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // get the apis from googleapis
  useEffect(() => {
    if (scriptLoaded && !scriptLoadedError && !hasApisLoaded) {
      loadApis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded, scriptLoadedError, hasApisLoaded]);

  useEffect(() => {
    if (gapiScriptLoadError || gisScriptLoadError) {
      setError('There was an error initializing Google');
      rollbar?.critical('Error loading Google API script from Network');
    }
  }, [gapiScriptLoadError, gisScriptLoadError, rollbar]);

  const callback = useCallback((response: google.accounts.oauth2.TokenResponse) => {
    logger.log('[GOOGLE] access token obtained');
    tokenResponse.current = response;
    _tokenResponse = tokenResponse.current;

    if (response.error !== undefined) {
      _tokenExpiration = null;
      tokenExpiration.current = _tokenExpiration;
      setError(response.error);
      if (tokenCallback.current) {
        tokenCallback.current.reject(response);
        tokenCallback.current = null;
      }
    } else {
      _tokenExpiration = addSeconds(new Date(), Number(response.expires_in));
      tokenExpiration.current = _tokenExpiration;
      setError(null);
      if (tokenCallback.current) {
        tokenCallback.current.resolve(response);
        tokenCallback.current = null;
      }
    }
  }, []);

  useNonInitialEffect(() => {
    if (hasApisLoaded && gapi) {
      tokenClient.current = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: scopes.join(' '),
        prompt: 'select_account',
        callback,
      });
      _tokenClient = tokenClient.current;
    }
  }, [hasApisLoaded, callback, clientId, scopes]);

  // load the Drive and picker apis - this is called right after scripts are loaded in browser
  const loadApis = useCallback(async () => {
    if (!_apiLoaded && gapi) {
      try {
        // https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#js-client-library_4

        await new Promise((resolve, reject) => {
          gapi.load('client', { callback: resolve, onerror: reject });
        });

        // Init client and load libraries
        await gapi.client.init({}).then(async () => {
          // Load the Drive/Picker API discovery document
          await gapi.client.load('drive', 'v3');
        });

        await new Promise((resolve, reject) => {
          gapi.load('picker', { callback: resolve, onerror: reject });
        });

        setHasApisLoaded(true);
        _apiLoaded = true;
      } catch (ex) {
        logger.error('[GOOGLE] Error loading library', ex);
        setError('There was a problem loading Google');
        rollbar?.critical('Google Sign In error', { message: ex.message || ex.error, stack: ex.stack, ex: ex });
      } finally {
        setLoading(false);
      }
    }
  }, [rollbar]);

  const isTokenValid = useCallback(() => {
    return !!tokenClient.current && !!tokenResponse.current && !!tokenExpiration.current && isAfter(tokenExpiration.current, new Date());
  }, []);

  const getToken = useCallback(() => {
    return new Promise<google.accounts.oauth2.TokenResponse>((resolve, reject) => {
      if (tokenResponse.current && isTokenValid()) {
        return resolve(tokenResponse.current);
      }
      tokenClient.current.requestAccessToken();
      tokenCallback.current = {
        resolve,
        reject,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revokeToken = useCallback(async () => {
    if (tokenResponse.current !== null) {
      google.accounts.oauth2.revoke(tokenResponse.current.access_token, () => {
        logger.log('Revoked: ' + tokenResponse.current.access_token);
      });
    }
    tokenResponse.current = null;
    _tokenResponse = tokenResponse.current;
    _tokenExpiration = null;
    tokenExpiration.current = _tokenExpiration;
  }, []);

  return {
    loading,
    error,
    isTokenValid,
    getToken,
    revokeToken,
  };
}