export const RL_LOGIN_INTENT_KEY = 'studysmart_rl_login_intent';
export const RL_LOGIN_INTENT_MAX_MS = 20 * 60 * 1000;

export function setRlLoginIntent() {
  try {
    sessionStorage.setItem(RL_LOGIN_INTENT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function hasValidRlLoginIntent() {
  try {
    const ts = sessionStorage.getItem(RL_LOGIN_INTENT_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) <= RL_LOGIN_INTENT_MAX_MS;
  } catch {
    return false;
  }
}
