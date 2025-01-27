import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js";

export class HomeAssistantAuthWebpageEditor extends LitElement {
    static get properties() {
        return {
            config: { type: Object },
            selectedType: { type: String },
            genericUrl: { type: String },
            grafanaConfig: { type: Object },
            grafanaFolders: { type: Array },
            grafanaDashboards: { type: Array },
            grafanaPanels: { type: Array },
        };
    }

    constructor() {
        super();
        this.config = {};
        this.selectedType = "generic";
        this.genericUrl = "";
        this.grafanaConfig = {
            domain: "",
            scheme: "https",
        };
        this.grafanaFolders = [];
        this.grafanaDashboards = [];
        this.grafanaPanels = [];
    }

    setConfig(config) {
        this.config = config;
        this.selectedType = config.type || "generic";

        if (this.selectedType === "generic") {
            this.genericUrl = config.url || "";
        } else if (this.selectedType === "grafana") {
            this.grafanaConfig = {
                domain: config.domain || "",
                scheme: config.scheme || "https",
            };
        }
    }

    handleTypeChange(event) {
        const newType = event.target.value;
        this.selectedType = newType;

        if (newType === "generic") {
            this.config = {
                ...this.config,
                type: "generic",
                url: this.genericUrl || "",
            };
        } else if (newType === "grafana") {
            this.config = {
                ...this.config,
                type: "grafana",
                domain: this.grafanaConfig.domain || "",
                scheme: this.grafanaConfig.scheme || "https",
            };
        }

        this.requestUpdate();
    }

    handleGrafanaConfigChange(field, event) {
        this.grafanaConfig = { ...this.grafanaConfig, [field]: event.target.value };
    }

    async loadGrafanaFolders() {
        const { scheme, domain } = this.grafanaConfig;
        if (!domain) {
            console.error("Grafana domain is not specified.");
            return;
        }

        try {
            const response = await fetch(`${scheme}://${domain}/api/folders`, {
                headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    this.grafanaFolders = data;
                } else {
                    console.error("Unexpected response format for folders:", data);
                    this.grafanaFolders = [];
                }
                this.requestUpdate();
            } else {
                console.error("Failed to load folders from Grafana.");
            }
        } catch (error) {
            console.error("Error loading folders from Grafana:", error);
        }
    }

    async loadDashboards() {
        const foldersDropdown = this.shadowRoot.getElementById("folders");
        if (!foldersDropdown || foldersDropdown.selectedIndex < 0) {
            console.error("Invalid folder selected.");
            return;
        }

        const folder = this.grafanaFolders[foldersDropdown.selectedIndex];
        if (!folder || !folder.id) {
            console.error("Folder does not have a valid id. Folder data:", folder);
            return;
        }

        const { scheme, domain } = this.grafanaConfig;
        try {
            const response = await fetch(`${scheme}://${domain}/api/search?folderIds=${folder.id}`, {
                headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    this.grafanaDashboards = data;
                } else {
                    console.error("Unexpected response format for dashboards:", data);
                    this.grafanaDashboards = [];
                }
                this.requestUpdate();
            } else {
                console.error("Failed to load dashboards from Grafana.");
            }
        } catch (error) {
            console.error("Error loading dashboards from Grafana:", error);
        }
    }

    async loadPanels() {
        const dashboardsDropdown = this.shadowRoot.getElementById("dashboards");
        if (!dashboardsDropdown || dashboardsDropdown.selectedIndex < 0) {
            console.error("Invalid dashboard selected.");
            return;
        }

        const dashboard = this.grafanaDashboards[dashboardsDropdown.selectedIndex];
        if (!dashboard || !dashboard.uid) {
            console.error("Dashboard does not have a valid uid. Dashboard data:", dashboard);
            return;
        }

        const { scheme, domain } = this.grafanaConfig;
        try {
            const response = await fetch(`${scheme}://${domain}/api/dashboards/uid/${dashboard.uid}`, {
                headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.dashboard && Array.isArray(data.dashboard.panels)) {
                    this.grafanaPanels = data.dashboard.panels;
                } else {
                    console.error("Unexpected response format for panels:", data);
                    this.grafanaPanels = [];
                }
                this.requestUpdate();
            } else {
                console.error("Failed to load panels from Grafana.");
            }
        } catch (error) {
            console.error("Error loading panels from Grafana:", error);
        }
    }

    selectPanel() {
        const panelsDropdown = this.shadowRoot.getElementById("panels");
        if (!panelsDropdown || panelsDropdown.selectedIndex < 0) {
            console.error("Invalid panel selected.");
            return;
        }

        const panel = this.grafanaPanels[panelsDropdown.selectedIndex];
        if (!panel || !panel.id) {
            console.error("Panel does not have a valid id. Panel data:", panel);
            return;
        }

        this.config.url = `${this.grafanaConfig.scheme}://${this.grafanaConfig.domain}/d/${panel.id}`;
        this.dispatchEvent(
            new CustomEvent("config-changed", {
                detail: { config: this.config },
                bubbles: true,
                composed: true,
            })
        );
    }

    render() {
        return html`
            <div>
                <label for="type">Select Type:</label>
                <ha-select id="type" @change="${this.handleTypeChange}" .value="${this.selectedType}">
                    <mwc-list-item value="generic">Generic</mwc-list-item>
                    <mwc-list-item value="grafana">Grafana</mwc-list-item>
                </ha-select>

                ${this.selectedType === "grafana"
                ? html`
                          <div>
                              <ha-select
                                  @change="${(e) => this.handleGrafanaConfigChange("scheme", e)}"
                                  .value="${this.grafanaConfig.scheme}"
                              >
                                  <mwc-list-item value="https">https</mwc-list-item>
                                  <mwc-list-item value="http">http</mwc-list-item>
                              </ha-select>
                              <ha-textfield
                                  label="Grafana Domain"
                                  .value="${this.grafanaConfig.domain}"
                                  @input="${(e) => this.handleGrafanaConfigChange("domain", e)}"
                              ></ha-textfield>
                              <mwc-button @click="${this.loadGrafanaFolders}" raised>Load</mwc-button>
                          </div>
                          <div>
                              <label for="folders">Folders:</label>
                              <ha-select id="folders" @change="${this.loadDashboards}">
                                  ${this.grafanaFolders.map((folder) => html`<mwc-list-item>${folder.title}</mwc-list-item>`)}
                              </ha-select>
                              <label for="dashboards">Dashboards:</label>
                              <ha-select id="dashboards" @change="${this.loadPanels}">
                                  ${this.grafanaDashboards.map(
                    (dashboard) => html`<mwc-list-item>${dashboard.title}</mwc-list-item>`
                )}
                              </ha-select>
                              <label for="panels">Panels:</label>
                              <ha-select id="panels" @change="${this.selectPanel}">
                                  ${this.grafanaPanels.map((panel) => html`<mwc-list-item>${panel.title}</mwc-list-item>`)}
                              </ha-select>
                          </div>
                      `
                : html``}

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
