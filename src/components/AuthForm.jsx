import React, { useState } from "react";

export default function AuthForm({ signIn }) {
  const [mode, setMode] = useState("signIn"); // Convex Auth's Password provider flow values: "signIn" | "signUp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password, mode);
      // success: useAuth's status flips to "signedIn" and App swaps views — no navigation here
    } catch (err) {
      setError(mode === "signIn" ? "Couldn't sign in — check your email and password." : "Couldn't create that account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <input
        className="field" type="email" placeholder="Email" autoComplete="email" required
        value={email} onChange={e => setEmail(e.target.value)}
      />
      <input
        className="field" type="password" placeholder="Password" autoComplete={mode === "signIn" ? "current-password" : "new-password"}
        required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
      />
      {error && <div className="formerr">{error}</div>}
      <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginBottom: 10 }}>
        {busy ? "Working…" : mode === "signIn" ? "Sign in" : "Create account"}
      </button>
      <button
        className="btn ghost" type="button" style={{ width: "100%" }}
        onClick={() => { setMode(m => (m === "signIn" ? "signUp" : "signIn")); setError(null); }}
      >
        {mode === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
