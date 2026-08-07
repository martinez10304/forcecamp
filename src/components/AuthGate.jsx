import React from "react";
import AuthForm from "./AuthForm.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function AuthGate({ onGuest }) {
  const { signIn } = useAuth();
  return (
    <div className="bc">
      <div className="authwrap">
        <div className="eyebrow">Platform Administrator &middot; ADM-201</div>
        <h1 className="h1" style={{ fontSize: "clamp(36px,9vw,56px)" }}>Force<em style={{ color: "var(--gold)" }}>camp</em></h1>
        <p className="lede">Sign in to save your XP and progress to the cloud, or keep it local-only as a guest.</p>
        <div className="authcard">
          <AuthForm signIn={signIn} />
        </div>
        <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
          <button className="btn ghost" onClick={onGuest}>Continue as guest</button>
        </div>
      </div>
    </div>
  );
}
