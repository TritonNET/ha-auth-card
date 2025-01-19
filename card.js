// Download latest from https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js
import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js";

class AuthWebpageCard extends LitElement {

    static get properties() {
        return {
            hass: undefined,
            config: undefined,
            url: undefined,
        };
    }

    constructor() {
        // always call super() first
        super();

        this.url = "";
    }

    setConfig(config) {
        this.config = config;

        if (this.config.config != undefined) {
            const type = this.config.config.type;
            switch (type) {
                case "generic":
                    this.url = this.config.config.url;
                    break;
            }
        }
        
        this.setIframeCookie();
    }

    setIframeCookie() {
        try {
            const hassToken = localStorage.getItem('hassTokens');
            if (hassToken == null) {
                console.error("No hass token found in local storage");
                return;
            }

            const hassTokenJson = JSON.parse(hassToken);

            const accessToken = hassTokenJson.access_token;
            if (!accessToken) {
                console.error("No access token found in hass token");
                return;
            }

            const expiresIn = hassTokenJson.expires_in; // Token expiration in seconds
            if (!expiresIn) {
                console.error("No expiration time found in hass token");
                return;
            }

            // Calculate the expiration time in milliseconds
            const expiresInMs = expiresIn * 1000; // Convert seconds to milliseconds
            const expiresAt = new Date(Date.now() + expiresInMs).toUTCString();

            // Set the cookie
            document.cookie = `haatc=${accessToken}; path=/; domain=.${location.hostname}; expires=${expiresAt}; Secure; SameSite=None`;
            console.log(`Cookie set with expiration at ${expiresAt}`);

            // Schedule the cookie refresh based on the expires_in value
            setTimeout(() => {
                console.log("Refreshing cookie...");
                this.setIframeCookie(); // Re-read the latest token from localStorage
            }, expiresInMs - 500); // Refresh 500ms before it expires for safety
        } catch (error) {
            console.error("Error setting iframe cookie:", error);
        }
    }

    collectProps(o, sourceName) {
        if (o && typeof o === "object" && !seen.has(o)) {
            seen.add(o);

            Object.getOwnPropertyNames(o).forEach((key) => {
                if (dataProperties.hasOwnProperty(key)) return;

                try {
                    const descriptor = Object.getOwnPropertyDescriptor(o, key);
                    const value = descriptor?.value;

                    if (key === "localStorage") {
                        // Special handling for localStorage
                        dataProperties[key] = this.getLocalStorageContents();
                    } else if (value && typeof value === "object") {
                        // Handle objects without deep traversal
                        if (seen.has(value)) {
                            dataProperties[key] = `[Circular: ${sourceName}]`;
                        } else {
                            dataProperties[key] = `[Object: ${key}]`;
                        }
                    } else if (typeof value !== "function") {
                        // Include data properties
                        dataProperties[key] = value;
                    }
                } catch {
                    dataProperties[key] = "[Error accessing]";
                }
            });

            this.collectProps(Object.getPrototypeOf(o), sourceName); // Traverse the prototype chain
        }
    }

    getAllDataProperties(obj) {
        const seen = new WeakSet();
        const dataProperties = {};
    
        this.collectProps(obj, "this");
        this.collectProps(window, "window"); // Explicitly traverse window
        return dataProperties;
    }
    
    getLocalStorageContents() {
        try {
            const localStorageData = {};
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                localStorageData[key] = window.localStorage.getItem(key);
            }
            return localStorageData;
        } catch (err) {
            return "[Error accessing localStorage]";
        }
    }




    render() {
        try {
            const allDataProperties = this.getAllDataProperties(this);
            return html`<p>${JSON.stringify(allDataProperties, null, 2)}</p>`;
        } catch (error) {
            console.error("Error rendering data properties:", error);
            return html`<p>Error rendering object and window data.</p>`;
        }
        //return html`
        //      <iframe class="chart-frame" src="${this.url}"></iframe>
        //    `;
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

customElements.define('auth-webpage', AuthWebpageCard);
