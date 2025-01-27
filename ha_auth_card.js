// Download latest from https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js
import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js";

class HomeAssistantAuthWebpageCard extends LitElement {

    static get properties() {
        return {
            hass: undefined,
            config: undefined,
            url: undefined,
            error: undefined,
            styles: undefined
        };
    }

    constructor() {
        // always call super() first
        super();

        this.url = "";
        this.error = undefined;
        this.styles = undefined;
    }

    async setConfig(config) {
        this.config = config;
        this.url = this.config.url;
        this.styles = this.config.styles;

        await this.setIframeCookieAsync();
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
            //console.log(`Cookie set with expiration at ${expiresAt}`);

            // Schedule the cookie refresh based on the expires_in value
            setTimeout(() => {
                //console.log("Refreshing cookie...");
                this.setIframeCookieAsync().catch((error) => {
                    console.error("Error refreshing the cookie:", error);
                }); // Re-read the latest token from localStorage
            }, expiresInMs - 500); // Refresh 500ms before it expires for safety
        }
        catch (error) {
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
        if (this.styles == undefined) {
            return css`
              .chart-frame {
                border: none; 
                margin: 0; 
                padding: 0;
                width: 100%;
                height: 100%;
              }      
            `;
        }

        return css`${this.styles}`;
    }
}

customElements.define('ha-auth-webpage', HomeAssistantAuthWebpageCard);
