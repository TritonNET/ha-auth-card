import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js";

export class HomeAssistantAuthWebpageEditor extends LitElement {
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
                <ha-select id="type" @change="${this.handleTypeChange}" .value="${this.selectedType}">
                    <mwc-list-item value="generic">Generic</mwc-list-item>
                    <mwc-list-item value="grafana">Grafana</mwc-list-item>
                </ha-select>

                ${this.selectedType === "generic"
                ? html`
                          <div>
                              <label for="generic-url">URL:</label>
                              <ha-textfield
                                  id="generic-url"
                                  .value="${this.genericUrl}"
                                  @input="${this.handleGenericUrlChange}"
                              ></ha-textfield>
                          </div>
                      `
                : html`
                          <div>
                              <label for="domain">Domain:</label>
                              <ha-textfield
                                  id="domain"
                                  .value="${this.grafanaConfig.domain}"
                                  @input="${(e) => this.handleGrafanaConfigChange("domain", e)}"
                              ></ha-textfield>
                              <label for="id">ID:</label>
                              <ha-textfield
                                  id="id"
                                  .value="${this.grafanaConfig.id}"
                                  @input="${(e) => this.handleGrafanaConfigChange("id", e)}"
                              ></ha-textfield>
                              <label for="name">Name:</label>
                              <ha-textfield
                                  id="name"
                                  .value="${this.grafanaConfig.name}"
                                  @input="${(e) => this.handleGrafanaConfigChange("name", e)}"
                              ></ha-textfield>
                              <label for="orgId">Org ID:</label>
                              <ha-textfield
                                  id="orgId"
                                  .value="${this.grafanaConfig.orgId}"
                                  @input="${(e) => this.handleGrafanaConfigChange("orgId", e)}"
                              ></ha-textfield>
                              <label for="panelId">Panel ID:</label>
                              <ha-textfield
                                  id="panelId"
                                  .value="${this.grafanaConfig.panelId}"
                                  @input="${(e) => this.handleGrafanaConfigChange("panelId", e)}"
                              ></ha-textfield>
                              <label for="scheme">Scheme:</label>
                              <ha-select id="scheme" @change="${(e) => this.handleGrafanaConfigChange("scheme", e)}" .value="${this.grafanaConfig.scheme}">
                                  <mwc-list-item value="https">https</mwc-list-item>
                                  <mwc-list-item value="http">http</mwc-list-item>
                              </ha-select>
                          </div>
                      `}

                <mwc-button @click="${this.saveConfig}" raised>Save</mwc-button>
            </div>
        `;
    }

    static get styles() {
        return css`
            label {
                display: block;
                margin: 5px 0;
            }

            ha-select,
            ha-textfield {
                margin-bottom: 10px;
                width: 100%;
            }

            mwc-button {
                margin-top: 10px;
            }
        `;
    }
}

customElements.define("ha-auth-webpage-editor", HomeAssistantAuthWebpageEditor);
