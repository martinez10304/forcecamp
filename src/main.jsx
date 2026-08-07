import React from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convexClient } from "./lib/convex.js";
import ForceCamp from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convexClient}>
      <ForceCamp />
    </ConvexAuthProvider>
  </React.StrictMode>
);
