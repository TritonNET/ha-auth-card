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

class HomeAssistantAuthWebpageEditor extends LitElement {
    static get properties() {
        return {
            config: { type: Object },
            selectedType: { type: String },
            genericUrl: { type: String },
            grafanaConfig: { type: Object }
        };
    }

    constructor() {
        super();
        this.config = {};
        this.selectedType = "generic";
        this.genericUrl = "";
        this.grafanaConfig = {
            domain: "",
            id: "",
            name: "",
            orgId: "",
            panelId: "",
            scheme: "https"
        };
    }

    setConfig(config) {
        this.config = config;
        this.selectedType = config.type || "generic";

        if (this.selectedType === "generic") {
            this.genericUrl = config.url || "";
        } else if (this.selectedType === "grafana") {
            this.grafanaConfig = {
                domain: config.domain || "",
                id: config.id || "",
                name: config.name || "",
                orgId: config.orgId || "",
                panelId: config.panelId || "",
                scheme: config.scheme || "https"
            };
        }
    }

    handleTypeChange(event) {
        this.selectedType = event.target.value;
        this.config = {}; // Reset config
        this.requestUpdate();
    }

    handleGenericUrlChange(event) {
        this.genericUrl = event.target.value;
    }

    handleGrafanaConfigChange(field, event) {
        this.grafanaConfig = { ...this.grafanaConfig, [field]: event.target.value };
    }

    saveConfig() {
        const config = { type: this.selectedType };

        if (this.selectedType === "generic") {
            config.url = this.genericUrl;
        } else if (this.selectedType === "grafana") {
            config.domain = this.grafanaConfig.domain;
            config.id = this.grafanaConfig.id;
            config.name = this.grafanaConfig.name;
            config.orgId = this.grafanaConfig.orgId;
            config.panelId = this.grafanaConfig.panelId;
            config.scheme = this.grafanaConfig.scheme;
        }

        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div>
                <label for="type">Select Type:</label>
                <select id="type" @change="${this.handleTypeChange}">
                    <option value="generic" ?selected="${this.selectedType === "generic"}">Generic</option>
                    <option value="grafana" ?selected="${this.selectedType === "grafana"}">Grafana</option>
                </select>

                ${this.selectedType === "generic"
                ? html`
                          <div>
                              <label for="generic-url">URL:</label>
                              <input
                                  id="generic-url"
                                  type="text"
                                  .value="${this.genericUrl}"
                                  @input="${this.handleGenericUrlChange}"
                              />
                          </div>
                      `
                : html`
                          <div>
                              <label for="domain">Domain:</label>
                              <input
                                  id="domain"
                                  type="text"
                                  .value="${this.grafanaConfig.domain}"
                                  @input="${(e) => this.handleGrafanaConfigChange("domain", e)}"
                              />
                              <label for="id">ID:</label>
                              <input
                                  id="id"
                                  type="text"
                                  .value="${this.grafanaConfig.id}"
                                  @input="${(e) => this.handleGrafanaConfigChange("id", e)}"
                              />
                              <label for="name">Name:</label>
                              <input
                                  id="name"
                                  type="text"
                                  .value="${this.grafanaConfig.name}"
                                  @input="${(e) => this.handleGrafanaConfigChange("name", e)}"
                              />
                              <label for="orgId">Org ID:</label>
                              <input
                                  id="orgId"
                                  type="text"
                                  .value="${this.grafanaConfig.orgId}"
                                  @input="${(e) => this.handleGrafanaConfigChange("orgId", e)}"
                              />
                              <label for="panelId">Panel ID:</label>
                              <input
                                  id="panelId"
                                  type="text"
                                  .value="${this.grafanaConfig.panelId}"
                                  @input="${(e) => this.handleGrafanaConfigChange("panelId", e)}"
                              />
                              <label for="scheme">Scheme:</label>
                              <input
                                  id="scheme"
                                  type="text"
                                  .value="${this.grafanaConfig.scheme}"
                                  @input="${(e) => this.handleGrafanaConfigChange("scheme", e)}"
                              />
                          </div>
                      `}

                <button @click="${this.saveConfig}">Save</button>
            </div>
        `;
    }

    static get styles() {
        return css`
            label {
                display: block;
                margin: 5px 0;
            }

            input {
                margin-bottom: 10px;
                width: 100%;
                padding: 5px;
                box-sizing: border-box;
            }

            button {
                margin-top: 10px;
                padding: 10px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }

            button:hover {
                background-color: #0056b3;
            }
        `;
    }
}

customElements.define("ha-auth-webpage", HomeAssistantAuthWebpageCard);
customElements.define("ha-auth-webpage-editor", HomeAssistantAuthWebpageEditor);