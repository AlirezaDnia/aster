export interface ExtensionStates {
    rtl: boolean;
    vazir: boolean;
    dark: boolean;
}

export const DEFAULT_EXTENSION_STATES: ExtensionStates = {
    rtl: false,
    vazir: false,
    dark: false,
};

export function buildScript(states: ExtensionStates): string {
    const isRtl = Boolean(states.rtl);
    const isVazir = Boolean(states.vazir);
    const isDark = Boolean(states.dark);

    return `
(function() {
    try {
        const docHead = document.head || document.documentElement;

        const rtlId = '__ext_rtl_style__';
        let rtlEl = document.getElementById(rtlId);
        if (${isRtl}) {
            if (!rtlEl) {
                rtlEl = document.createElement('style');
                rtlEl.id = rtlId;
                rtlEl.textContent = \`
                    html, body, p, span, h1, h2, h3, h4, h5, h6, input, textarea, button, a, li, div, td, th {
                        direction: rtl !important;
                        text-align: right !important;
                    }
                \`;
                docHead.appendChild(rtlEl);
                document.documentElement.setAttribute('dir', 'rtl');
            }
        } else {
            if (rtlEl) rtlEl.remove();
            if (document.documentElement.getAttribute('dir') === 'rtl') {
                document.documentElement.removeAttribute('dir');
            }
        }

        const vazirId = '__ext_vazir_style__';
        let vazirEl = document.getElementById(vazirId);
        if (${isVazir}) {
            if (!vazirEl) {
                vazirEl = document.createElement('style');
                vazirEl.id = vazirId;
                vazirEl.textContent = \`
                    @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
                    *:not(i):not(.fa):not(.fas):not(.far):not(.material-icons) {
                        font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                    }
                \`;
                docHead.appendChild(vazirEl);
            }
        } else {
            if (vazirEl) vazirEl.remove();
        }

        const darkId = '__ext_dark_style__';
        let darkEl = document.getElementById(darkId);
        if (${isDark}) {
            if (!darkEl) {
                darkEl = document.createElement('style');
                darkEl.id = darkId;
                darkEl.textContent = \`
                    html {
                        filter: invert(0.92) hue-rotate(180deg) !important;
                        background-color: #121212 !important;
                    }
                    img, video, canvas, svg, iframe, [style*="background-image"], embed, object {
                        filter: invert(1.08) hue-rotate(180deg) !important;
                    }
                \`;
                docHead.appendChild(darkEl);
            }
        } else {
            if (darkEl) darkEl.remove();
        }
    } catch (err) {
        console.error('[Extension System] Injection error:', err);
    }
})();
    `;
}
