import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api.js";
import { store } from "../lib/storage.js";
import { DEFAULT_STATE } from "../lib/scoring.js";

const SAVE_DEBOUNCE_MS = 1500;
const LOCAL_KEY = "basecamp:v2";

/* Loads/saves the persisted progress blob. Signed-in: reactive Convex query for
   reads, debounced mutation for writes. Guest: the same local KV storage.js has
   always used. Also detects "signed in, but the account has no progress yet, and
   this browser has local progress" so App.jsx can offer a one-time import. */
export function useProgress(authStatus) {
  const isAuthed = authStatus === "signedIn";
  const remote = useQuery(api.progress.get, isAuthed ? {} : "skip");
  const save = useMutation(api.progress.save);

  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [importOffer, setImportOffer] = useState(null);
  const saveTimer = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  // Guards the remote row from being adopted more than once per sign-in. Convex's
  // useQuery re-fires reactively (including once to echo back our own debounced
  // saves) — if we kept syncing `remote` into local `state` on every fire, a fast
  // local edit could be clobbered by an in-flight read that predates it. Local
  // `state` is the source of truth once adopted; only the save direction stays live.
  const adoptedRef = useRef(false);

  // guest: load once from local storage
  useEffect(() => {
    if (isAuthed) return;
    let cancelled = false;
    setReady(false);
    store.get(LOCAL_KEY).then(local => {
      if (cancelled) return;
      setState(local ? { ...DEFAULT_STATE, ...local } : DEFAULT_STATE);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [isAuthed]);

  // reset the adoption guard at the start of each signed-in session
  useEffect(() => {
    if (isAuthed) { adoptedRef.current = false; setReady(false); }
  }, [isAuthed]);

  // signed in: adopt the reactive remote row exactly once, the first time it
  // resolves after sign-in, and offer an import if the account is brand new but
  // this browser has local progress.
  useEffect(() => {
    if (!isAuthed || remote === undefined || adoptedRef.current) return; // undefined = query still loading
    if (remote === null) return; // briefly possible right after sign-in; query will re-fire
    adoptedRef.current = true;

    setState(remote._isDefault ? DEFAULT_STATE : remote);
    setReady(true);

    if (remote._isDefault) {
      store.get(LOCAL_KEY).then(local => {
        if (local && (local.answered > 0 || local.xp > 0)) setImportOffer({ local });
      });
    }
  }, [isAuthed, remote]);

  // debounced save
  useEffect(() => {
    if (!ready) return;
    if (isAuthed) {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        save(stateRef.current).catch(console.error);
      }, SAVE_DEBOUNCE_MS);
      return () => clearTimeout(saveTimer.current);
    }
    store.set(LOCAL_KEY, state);
  }, [state, ready, isAuthed, save]);

  // flush a pending debounced save before the tab closes or goes to background
  useEffect(() => {
    if (!isAuthed) return;
    const flush = () => {
      clearTimeout(saveTimer.current);
      save(stateRef.current).catch(() => {});
    };
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", flush);
    };
  }, [isAuthed, save]);

  function resolveImport(action) {
    if (action === "import") setState(importOffer.local);
    else store.remove(LOCAL_KEY);
    setImportOffer(null);
  }

  return { state, setState, ready, importOffer, resolveImport };
}
