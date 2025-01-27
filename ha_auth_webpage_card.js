import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js";
import "./ha_auth_webpage_editor.js";

class HomeAssistantAuthWebpageCard extends LitElement {
    static get properties() {
        return {
            hass: undefined,
            config: undefined,
            url: undefined,
            error: undefined
        };
    }

    constructor() {
        super();
        this.url = "";
        this.error = undefined;
    }

    async setConfig(config) {
        this.config = config;

        if (this.config.config != undefined) {
            const type = this.config.config.type;
            switch (type) {
                case "generic":
                    this.url = this.config.config.url;
                    break;
                case "grafana":
                    this.url = this.getGrafanaUrl(this.config.config);
                    break;
            }
        }

        if (this.url != undefined) {
            await this.setIframeCookieAsync();
        }
    }

    getGrafanaUrl(config) {
        const domain = config.domain;
        if (domain === undefined) {
            this.error = "No 'domain' found in config";
            return undefined;
        }

        const ID = config.id || config.ID || config.Id;
        if (ID === undefined) {
            this.error = "No 'id' found in config";
            return undefined;
        }

        const name = config.name;
        if (name === undefined) {
            this.error = "No 'name' found in config";
            return undefined;
        }

        const orgID = config.orgId || config.orgID;
        if (orgID === undefined) {
            this.error = "No 'orgId' found in config";
            return undefined;
        }

        const panelID = config.panelId || config.panelID;
        if (panelID === undefined) {
            this.error = "No 'panelID' found in config";
            return undefined;
        }

        const scheme = config.scheme || "https";

        this.error = undefined;

        return `${scheme}://${domain}/d-solo/${ID}/${name}?orgId=${orgID}&panelId=${panelID}`;
    }

    async setIframeCookieAsync() {
        try {
            this.error = undefined;

            const _hassCon = await hassConnection;

            const accessToken = _hassCon.auth.data.access_token;
            if (!accessToken) {
                this.error = "No hass token found";
                return;
            }

            let expiresIn = _hassCon.auth.data.expires_in;
            if (!expiresIn) {
                expiresIn = 3600; // Default to 1 hour if no expiration time found
            }

            // Calculate the expiration time in milliseconds
            const expiresInMs = expiresIn * 1000; // Convert seconds to milliseconds
            const expiresAt = new Date(Date.now() + expiresInMs).toUTCString();

            // Set the cookie
            document.cookie = `haatc=${accessToken}; path=/; domain=.${location.hostname}; expires=${expiresAt}; Secure; SameSite=None`;

            // Schedule the cookie refresh based on the expires_in value
            setTimeout(() => {
                this.setIframeCookieAsync().catch((error) => {
                    console.error("Error refreshing the cookie:", error);
                }); // Re-read the latest token from localStorage
            }, expiresInMs - 500); // Refresh 500ms before it expires for safety
        } catch (error) {
            this.error = "Error setting iframe cookie:" + error;
        }
    }

    render() {
        if (this.error != undefined) {
            return html`
              <ha-alert alert-type="error">${this.error}</ha-alert>
            `;
        }

        return html`
              <iframe class="chart-frame" src="${this.url}"></iframe>
            `;
    }

    static get styles() {
        return css`
          .chart-frame {
            border: none; 
            margin: 0; 
            padding: 0;
          }      
        `;
    }

    static getConfigElement() {
        return document.createElement("ha-auth-webpage-editor");
    }

    static getStubConfig() {
        return { type: "generic", url: "" };
    }
}

customElements.define("ha-auth-webpage", HomeAssistantAuthWebpageCard);