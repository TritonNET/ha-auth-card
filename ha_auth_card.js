// Download latest from https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js
import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js";

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
        // always call super() first
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
            }
        }
        
        await this.setIframeCookie();
    }

    async setIframeCookie()
    {
        try
        {
            this.error = undefined;

            const _hassCon = await this.hassConnection;

            const accessToken = _hassCon.auth.data.access_token;
            if (!accessToken) {
                this.error = "No hass token found";
                return;
            }

            const expiresIn = _hassCon.auth.data.expires_in;
            if (!expiresIn) {
                this.error = "No expiration time found in hass token";
                return;
            }

            // Calculate the expiration time in milliseconds
            const expiresInMs = expiresIn * 1000; // Convert seconds to milliseconds
            const expiresAt = new Date(Date.now() + expiresInMs).toUTCString();

            // Set the cookie
            document.cookie = `testc=testv; path=/; domain=${location.hostname}; expires=${expiresAt}; Secure; SameSite=None`;
            console.log(`Cookie set with expiration at ${expiresAt}`);

            // Schedule the cookie refresh based on the expires_in value
            setTimeout(() =>
            {
                console.log("Refreshing cookie...");
                this.setIframeCookie(); // Re-read the latest token from localStorage
            }, expiresInMs - 500); // Refresh 500ms before it expires for safety
        }
        catch (error)
        {
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
}

customElements.define('ha-auth-webpage', HomeAssistantAuthWebpageCard);
