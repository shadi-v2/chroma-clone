export interface EmailWrapperConfig {
  enabled: boolean;
  theme: "emerald" | "royal-gold" | "parchment" | "midnight" | "clean" | "custom";
  borderRadius: "sharp" | "subtle" | "rounded" | "extra";
  headerBadgeShape: "pill" | "plaque" | "diamond" | "minimal";
  borderStyle: "subtle" | "accent-top" | "double" | "none";
  outerBgColor: string;
  cardBgColor: string;
  accentColor: string;
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  showFooterLinks: boolean;
}

export const DEFAULT_WRAPPER_CONFIG: EmailWrapperConfig = {
  enabled: true,
  theme: "emerald",
  borderRadius: "rounded",
  headerBadgeShape: "plaque",
  borderStyle: "subtle",
  outerBgColor: "#fcfbf7",
  cardBgColor: "#ffffff",
  accentColor: "#022c22",
  headerTitle: "CHROMA DIARIES",
  headerSubtitle: "Web Magazine • Official Dispatch Desk",
  footerText: "Chroma Diaries Web Magazine • Mentored & Supported by Sabeelul Hidaya Islamic College",
  showFooterLinks: true,
};

export const WRAPPER_THEMES: Record<
  string,
  {
    name: string;
    description: string;
    config: Partial<EmailWrapperConfig>;
  }
> = {
  emerald: {
    name: "Emerald Editorial",
    description: "Signature Chroma Diaries dark emerald seal and classical typography",
    config: {
      theme: "emerald",
      outerBgColor: "#fcfbf7",
      cardBgColor: "#ffffff",
      accentColor: "#022c22",
      headerBadgeShape: "plaque",
      borderRadius: "rounded",
      borderStyle: "subtle",
      headerSubtitle: "Web Magazine • Official Dispatch Desk",
    },
  },
  "royal-gold": {
    name: "Royal Honors & Gold",
    description: "Celebratory golden amber banner with capsule pill badges",
    config: {
      theme: "royal-gold",
      outerBgColor: "#fffdf5",
      cardBgColor: "#ffffff",
      accentColor: "#b45309",
      headerBadgeShape: "pill",
      borderRadius: "extra",
      borderStyle: "accent-top",
      headerSubtitle: "Official Honors & Editorial Distinction",
    },
  },
  parchment: {
    name: "Literary Parchment",
    description: "Classical double-framed vintage serif parchment look",
    config: {
      theme: "parchment",
      outerBgColor: "#f7f4ec",
      cardBgColor: "#fdfbf7",
      accentColor: "#1c1917",
      headerBadgeShape: "diamond",
      borderRadius: "sharp",
      borderStyle: "double",
      headerSubtitle: "A Sanctuary for Stories & Philosophical Prose",
    },
  },
  midnight: {
    name: "Midnight Obsidian",
    description: "Deep dark ambient frame with crisp white inner reader",
    config: {
      theme: "midnight",
      outerBgColor: "#091e19",
      cardBgColor: "#ffffff",
      accentColor: "#047857",
      headerBadgeShape: "pill",
      borderRadius: "rounded",
      borderStyle: "subtle",
      headerSubtitle: "Literary Collective • Midnight Dispatch",
    },
  },
  clean: {
    name: "Clean Minimalist",
    description: "Modern, minimal, header text-only format",
    config: {
      theme: "clean",
      outerBgColor: "#f9fafb",
      cardBgColor: "#ffffff",
      accentColor: "#111827",
      headerBadgeShape: "minimal",
      borderRadius: "subtle",
      borderStyle: "subtle",
      headerSubtitle: "Official Communication Desk",
    },
  },
};

export function renderEmailWithWrapper(
  subject: string,
  contentHtml: string,
  wrapperConfig: Partial<EmailWrapperConfig> = {},
): string {
  const cfg = { ...DEFAULT_WRAPPER_CONFIG, ...wrapperConfig };
  if (!cfg.enabled) return contentHtml;

  const radiusMap = {
    sharp: "0px",
    subtle: "10px",
    rounded: "24px",
    extra: "36px",
  };
  const borderRadiusVal = radiusMap[cfg.borderRadius] || "24px";

  let borderCss = "border: 1px solid rgba(2, 44, 34, 0.08);";
  if (cfg.borderStyle === "accent-top") {
    borderCss = `border: 1px solid rgba(2, 44, 34, 0.08); border-top: 6px solid ${cfg.accentColor};`;
  } else if (cfg.borderStyle === "double") {
    borderCss = `border: 3px double ${cfg.accentColor};`;
  } else if (cfg.borderStyle === "none") {
    borderCss = `border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.06);`;
  }

  let headerBadgeHtml = "";
  if (cfg.headerBadgeShape === "pill") {
    headerBadgeHtml = `
      <div style="display: inline-block; background-color: ${cfg.accentColor}; color: #ffffff; font-family: Georgia, serif; font-weight: bold; font-size: 16px; padding: 8px 28px; border-radius: 9999px; letter-spacing: 2px; margin-bottom: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.12);">
        ${cfg.headerTitle}
      </div>
    `;
  } else if (cfg.headerBadgeShape === "plaque") {
    headerBadgeHtml = `
      <div style="display: inline-block; background-color: ${cfg.accentColor}; color: #ffffff; font-family: Georgia, serif; font-weight: bold; font-size: 16px; padding: 8px 24px; border-radius: 8px; letter-spacing: 2px; margin-bottom: 8px;">
        ${cfg.headerTitle}
      </div>
    `;
  } else if (cfg.headerBadgeShape === "diamond") {
    headerBadgeHtml = `
      <div style="display: inline-block; border: 2px solid ${cfg.accentColor}; color: ${cfg.accentColor}; font-family: Georgia, serif; font-weight: bold; font-size: 16px; padding: 8px 24px; border-radius: 8px; letter-spacing: 3px; margin-bottom: 8px; background-color: rgba(0,0,0,0.02);">
        ❖ ${cfg.headerTitle} ❖
      </div>
    `;
  } else {
    headerBadgeHtml = `
      <div style="font-family: Georgia, serif; font-weight: 800; font-size: 22px; color: ${cfg.accentColor}; letter-spacing: 2px; margin-bottom: 4px;">
        ${cfg.headerTitle}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${cfg.outerBgColor}; margin: 0; padding: 40px 20px;">
      <div style="max-width: 620px; margin: 0 auto; background-color: ${cfg.cardBgColor}; border-radius: ${borderRadiusVal}; ${borderCss} padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid ${cfg.accentColor}20;">
          ${headerBadgeHtml}
          ${
            cfg.headerSubtitle
              ? `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: ${cfg.accentColor}; font-weight: 600; opacity: 0.85;">${cfg.headerSubtitle}</div>`
              : ""
          }
        </div>

        <!-- Subject Line -->
        ${
          subject
            ? `<h2 style="font-family: Georgia, serif; color: ${cfg.accentColor}; font-size: 22px; margin: 0 0 20px 0; font-weight: 700; line-height: 1.4;">${subject}</h2>`
            : ""
        }
        
        <!-- Message Body -->
        <div style="color: #1f2937; font-size: 15px; line-height: 1.75; margin-bottom: 36px;">
          ${contentHtml}
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid rgba(0,0,0,0.08); padding-top: 24px; margin-top: 32px; font-size: 12px; color: #6b7280; line-height: 1.6; text-align: center;">
          <div style="font-weight: 600; color: ${cfg.accentColor}; margin-bottom: 4px;">
            ${cfg.footerText}
          </div>
          ${
            cfg.showFooterLinks
              ? `<div style="font-size: 11px; margin-top: 10px;">
                  <a href="https://chromadiaries.in" style="color: ${cfg.accentColor}; text-decoration: none; font-weight: 600;">Visit Website</a> • 
                  <a href="mailto:editorial@chromadiaries.in" style="color: ${cfg.accentColor}; text-decoration: none; font-weight: 600;">Contact Editorial Desk</a>
                </div>`
              : ""
          }
        </div>
      </div>
    </body>
    </html>
  `;
}
