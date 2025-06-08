/// <reference types="vinxi/types/client" />

import { StartClient } from "@tanstack/react-start";
import { hydrateRoot } from "react-dom/client";
import { createRouter } from "./router";
import { StrictMode } from "react";

const router = createRouter();

hydrateRoot(
  document,
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>,
);
