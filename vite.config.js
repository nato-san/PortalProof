import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { paymentRelay } from "./scripts/payment-relay.mjs";

export default defineConfig({
  base: "./",
  plugins: [react(), paymentRelay()]
});
