(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RiftPlayFab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  'use strict';

  const DEVICE_ID_KEY = 'rift-playfab-device-id';
  const SESSION_KEY = 'rift-playfab-session-v1';

  function randomId(randomBytes) {
    if (typeof randomBytes === 'function') return randomBytes();
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return `rift-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function safeStorage(storage) {
    return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function' && typeof storage.removeItem === 'function' ? storage : null;
  }

  function createClient(options = {}) {
    const config = options.config || root.RIFT_PLAYFAB_CONFIG || {};
    const storage = safeStorage(options.storage || root.localStorage);
    const fetchImpl = options.fetch || root.fetch;
    const log = typeof options.log === 'function' ? options.log : () => {};
    let session = null;

    function titleId() { return String(config.titleId || '').trim(); }
    function configured() { return /^[A-Za-z0-9]+$/.test(titleId()); }
    function deviceId() {
      if (!storage) return randomId(options.randomId);
      const existing = storage.getItem(DEVICE_ID_KEY);
      if (existing && /^[A-Za-z0-9-]{16,128}$/.test(existing)) return existing;
      const created = randomId(options.randomId);
      storage.setItem(DEVICE_ID_KEY, created);
      return created;
    }
    function publicSession(result) {
      return Object.freeze({
        playFabId: result.PlayFabId,
        entityId: result.EntityToken && result.EntityToken.Entity ? result.EntityToken.Entity.Id : null,
        entityType: result.EntityToken && result.EntityToken.Entity ? result.EntityToken.Entity.Type : null,
        displayName: result.InfoResultPayload && result.InfoResultPayload.PlayerProfile ? result.InfoResultPayload.PlayerProfile.DisplayName || null : null,
        sessionTicket: result.SessionTicket || null,
        entityToken: result.EntityToken ? result.EntityToken.EntityToken || null : null
      });
    }
    async function login() {
      if (!configured()) {
        log('login-skipped', { reason: 'missing-title-id' });
        return null;
      }
      if (typeof fetchImpl !== 'function') throw new Error('playfab-fetch-unavailable');
      log('login-started', { titleId: titleId(), environment: config.environment || 'development' });
      const response = await fetchImpl(`https://${titleId()}.playfabapi.com/Client/LoginWithCustomID`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TitleId: titleId(),
          CustomId: deviceId(),
          CreateAccount: true,
          InfoRequestParameters: { GetPlayerProfile: true }
        })
      });
      let payload = null;
      try { payload = await response.json(); } catch (_) { throw new Error('playfab-invalid-response'); }
      if (!response.ok || !payload || payload.code !== 200 || !payload.data) {
        const error = new Error(payload && payload.error ? `playfab-${payload.error}` : 'playfab-login-failed');
        error.status = response.status;
        log('login-failed', { status: response.status, code: payload && payload.errorCode || null });
        throw error;
      }
      session = publicSession(payload.data);
      if (storage) storage.setItem(SESSION_KEY, JSON.stringify({ playFabId: session.playFabId, entityId: session.entityId }));
      log('login-succeeded', { playFabId: session.playFabId, entityId: session.entityId });
      return session;
    }
    function currentSession() { return session; }
    function clearLocalIdentity() {
      if (!storage) return;
      storage.removeItem(DEVICE_ID_KEY);
      storage.removeItem(SESSION_KEY);
      session = null;
    }
    return Object.freeze({ configured, deviceId, login, currentSession, clearLocalIdentity });
  }

  const singleton = createClient({ log: (event, fields) => console.info('[RIFT PlayFab]', event, fields) });
  return Object.freeze({ ...singleton, createClient, DEVICE_ID_KEY, SESSION_KEY });
});
