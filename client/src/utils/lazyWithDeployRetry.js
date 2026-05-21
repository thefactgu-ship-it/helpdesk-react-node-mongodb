import { lazy } from "react";

const DEPLOY_RELOAD_KEY = "helpdesk:deploy-reload-attempted";

export function lazyWithDeployRetry(importer) {
  return lazy(async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(DEPLOY_RELOAD_KEY);
      return module;
    } catch (error) {
      const message = String(error?.message || error || "");
      const isMissingChunk =
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("Importing a module script failed") ||
        message.includes("error loading dynamically imported module");

      if (isMissingChunk && !sessionStorage.getItem(DEPLOY_RELOAD_KEY)) {
        sessionStorage.setItem(DEPLOY_RELOAD_KEY, "true");
        window.location.reload();
      }

      throw error;
    }
  });
}
