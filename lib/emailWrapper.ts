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
  enabled: false,
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

// ── LOGO ARRANGEMENT TYPES & ENGINE ──

export type LogoVariant = "logo" | "logo-white" | "icon" | "icon-white";
export type LogoAlignment = "left" | "center" | "right";
export type LogoPlacement = "top" | "cursor" | "bottom";

export interface LogoArrangementConfig {
  variant: LogoVariant;
  alignment: LogoAlignment;
  placement: LogoPlacement;
  width: number;
  spacing: number;
  linkUrl: string;
  altText: string;
}

export const DEFAULT_LOGO_CONFIG: LogoArrangementConfig = {
  variant: "logo",
  alignment: "center",
  placement: "top",
  width: 165,
  spacing: 24,
  linkUrl: "https://chromadiaries.in",
  altText: "Chroma Diaries",
};

export const LOGO_VARIANTS_INFO: Record<
  LogoVariant,
  { name: string; description: string; path: string; darkBg?: boolean }
> = {
  logo: {
    name: "Primary Dark Logo",
    description: "Classic dark emerald Chroma Diaries logotype for light backgrounds",
    path: "https://chromadiaries.in/logo.png",
    darkBg: false,
  },
  "logo-white": {
    name: "White Brand Logo",
    description: "Crisp white logotype designed for dark cards and ambient headers",
    path: "https://chromadiaries.in/logo-white.png",
    darkBg: true,
  },
  icon: {
    name: "Monogram Emblem Icon",
    description: "Compact brand seal & monogram emblem for minimal or vintage layouts",
    path: "https://chromadiaries.in/icon.png",
    darkBg: false,
  },
  "icon-white": {
    name: "White Monogram Emblem",
    description: "White emblem seal for dark plaques or footer badges",
    path: "https://chromadiaries.in/icon-white.png",
    darkBg: true,
  },
};

/**
 * Generates an email-client bulletproof HTML block for the Chromadiaries logo.
 */
export function generateLogoHtml(config: LogoArrangementConfig): string {
  const logoUrl = LOGO_VARIANTS_INFO[config.variant]?.path || "https://chromadiaries.in/logo.png";

  let alignStyle = "text-align: center;";
  let imgMargin = "margin: 0 auto;";
  if (config.alignment === "left") {
    alignStyle = "text-align: left;";
    imgMargin = "margin: 0;";
  } else if (config.alignment === "right") {
    alignStyle = "text-align: right;";
    imgMargin = "margin: 0 0 0 auto;";
  }

  return `<!-- CD_LOGO_START -->
<div data-chromadiaries-logo="true" style="${alignStyle} margin-top: ${config.spacing}px; margin-bottom: ${config.spacing}px; padding: 0;">
  <a href="${config.linkUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
    <img src="${logoUrl}" alt="${config.altText}" width="${config.width}" style="display: block; width: ${config.width}px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none; ${imgMargin}" />
  </a>
</div>
<!-- CD_LOGO_END -->`;
}

/**
 * Removes any existing Chromadiaries logo from HTML content.
 */
export function removeLogoFromHtml(html: string): string {
  if (!html) return "";
  let cleaned = html.replace(/<!--\s*CD_LOGO_START\s*-->[\s\S]*?<!--\s*CD_LOGO_END\s*-->/gi, "");
  cleaned = cleaned.replace(/<div[^>]*data-chromadiaries-logo="true"[^>]*>[\s\S]*?<\/div>/gi, "");
  cleaned = cleaned.replace(
    /<div[^>]*>\s*<a[^>]*>\s*<img[^>]*src="[^"]*(?:logo|icon)[^"]*\.png"[^>]*>\s*<\/a>\s*<\/div>/gi,
    "",
  );
  return cleaned.trim();
}

/**
 * Detects if a Chroma Diaries logo is present in the HTML and returns its configuration.
 */
export function detectLogoInHtml(html: string): LogoArrangementConfig | null {
  if (!html) return null;

  const hasComment = /<!--\s*CD_LOGO_START\s*-->/i.test(html);
  const hasAttr = /data-chromadiaries-logo="true"/i.test(html);
  const hasImg = /(?:logo\.png|logo-white\.png|icon\.png|icon-white\.png)/i.test(html);

  if (!hasComment && !hasAttr && !hasImg) return null;

  let snippet = "";
  const matchComment = html.match(/<!--\s*CD_LOGO_START\s*-->([\s\S]*?)<!--\s*CD_LOGO_END\s*-->/i);
  if (matchComment) {
    snippet = matchComment[0];
  } else {
    const matchAttr = html.match(/<div[^>]*data-chromadiaries-logo="true"[^>]*>[\s\S]*?<\/div>/i);
    if (matchAttr) {
      snippet = matchAttr[0];
    } else {
      const matchImg = html.match(/<img[^>]*src="[^"]*(?:logo|icon)[^"]*\.png"[^>]*>/i);
      if (matchImg) snippet = matchImg[0];
    }
  }

  let variant: LogoVariant = "logo";
  if (/logo-white\.png/i.test(snippet)) variant = "logo-white";
  else if (/icon-white\.png/i.test(snippet)) variant = "icon-white";
  else if (/icon\.png/i.test(snippet)) variant = "icon";

  let alignment: LogoAlignment = "center";
  if (/text-align:\s*left/i.test(snippet) || /align="left"/i.test(snippet)) alignment = "left";
  else if (/text-align:\s*right/i.test(snippet) || /align="right"/i.test(snippet)) alignment = "right";

  let width = 165;
  const widthMatch = snippet.match(/width="?(\d+)"?/i) || snippet.match(/width:\s*(\d+)px/i);
  if (widthMatch) {
    const parsed = parseInt(widthMatch[1], 10);
    if (parsed > 20 && parsed < 600) width = parsed;
  }

  let placement: LogoPlacement = "top";
  const idx = html.indexOf(snippet);
  if (idx > -1 && idx > html.length * 0.7) {
    placement = "bottom";
  }

  return {
    variant,
    alignment,
    placement,
    width,
    spacing: 24,
    linkUrl: "https://chromadiaries.in",
    altText: "Chroma Diaries",
  };
}

/**
 * Arranges the Chromadiaries logo in the template HTML according to config.
 */
export function arrangeLogoInHtml(html: string, config: LogoArrangementConfig): string {
  const newLogoHtml = generateLogoHtml(config);
  const withoutOldLogo = removeLogoFromHtml(html);

  if (config.placement === "bottom") {
    const bodyCloseMatch = withoutOldLogo.match(/<\/body>/i);
    if (bodyCloseMatch && bodyCloseMatch.index !== undefined) {
      return (
        withoutOldLogo.slice(0, bodyCloseMatch.index) +
        "\n" +
        newLogoHtml +
        "\n" +
        withoutOldLogo.slice(bodyCloseMatch.index)
      );
    }
    return withoutOldLogo + "\n" + newLogoHtml;
  }

  // Top placement
  // Check if there is an inner card container (div with max-width or main table)
  const cardMatch = withoutOldLogo.match(/(<div[^>]*style="[^"]*max-width[^"]*"[^>]*>)/i);
  if (cardMatch && cardMatch.index !== undefined) {
    const insertIdx = cardMatch.index + cardMatch[0].length;
    return withoutOldLogo.slice(0, insertIdx) + "\n" + newLogoHtml + "\n" + withoutOldLogo.slice(insertIdx);
  }

  // Check for body tag
  const bodyMatch = withoutOldLogo.match(/<body[^>]*>/i);
  if (bodyMatch && bodyMatch.index !== undefined) {
    const insertIdx = bodyMatch.index + bodyMatch[0].length;
    return withoutOldLogo.slice(0, insertIdx) + "\n" + newLogoHtml + "\n" + withoutOldLogo.slice(insertIdx);
  }

  // Prepend at the beginning
  return newLogoHtml + "\n" + withoutOldLogo;
}

// ── HTML TEMPLATE LAYOUT STARTERS (NEVER CONSTANT - 100% EDITABLE HTML) ──

export interface LayoutStarter {
  id: string;
  name: string;
  description: string;
  category: string;
  accentColor: string;
  html: string;
}

export const EMAIL_LAYOUT_STARTERS: Record<string, LayoutStarter> = {
  emerald: {
    id: "emerald",
    name: "Emerald Editorial",
    description: "Signature Chroma Diaries dark emerald editorial card with centered logo and refined borders",
    category: "Editorial",
    accentColor: "#022c22",
    html: `<div style="background-color: #fcfbf7; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(2, 44, 34, 0.08); padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
    <!-- CD_LOGO_START -->
    <div data-chromadiaries-logo="true" style="text-align: center; margin-top: 10px; margin-bottom: 24px; padding: 0;">
      <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://chromadiaries.in/logo.png" alt="Chroma Diaries" width="165" style="display: block; width: 165px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" />
      </a>
    </div>
    <!-- CD_LOGO_END -->

    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(2, 44, 34, 0.08);">
      <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 20px; border: 1px solid #a7f3d0;">
        Editorial Dispatch Desk
      </span>
    </div>

    <h1 style="font-family: Georgia, serif; color: #022c22; font-size: 24px; margin: 0 0 16px 0; font-weight: 700; line-height: 1.3;">
      {{subject}}
    </h1>

    <div style="color: #1f2937; font-size: 15px; line-height: 1.75; margin-bottom: 28px;">
      <p>Dear {{name}},</p>
      <p>We are pleased to reach out from the Chroma Diaries editorial team with this official publication notice.</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #022c22; padding: 18px 22px; border-radius: 12px; margin: 20px 0;">
        <div style="font-weight: bold; font-size: 13px; color: #022c22; margin-bottom: 4px;">Important Note</div>
        <div style="font-size: 13px; color: #374151; line-height: 1.6;">Your manuscript has advanced to the final publication queue. Our readers are looking forward to your piece.</div>
      </div>

      <p>Thank you for your voice and dedication to creative storytelling.</p>
    </div>

    <div style="border-top: 1px solid rgba(0,0,0,0.08); padding-top: 24px; margin-top: 32px; font-size: 12px; color: #6b7280; text-align: center;">
      <div style="font-weight: 600; color: #022c22; margin-bottom: 4px;">Chroma Diaries Web Magazine</div>
      <div style="color: #6b7280; font-size: 11px;">A sanctuary for stories, artistic prose, and reflective essays.</div>
      <div style="margin-top: 10px; font-size: 11px;">
        <a href="https://chromadiaries.in" style="color: #047857; text-decoration: none; font-weight: 600;">Visit Website</a> • 
        <a href="mailto:editorial@chromadiaries.in" style="color: #047857; text-decoration: none; font-weight: 600;">Contact Editorial</a>
      </div>
    </div>
  </div>
</div>`,
  },

  royalGold: {
    id: "royalGold",
    name: "Royal Honors & Gold",
    description: "Celebratory golden amber banner with capsule distinction ribbon and award styling",
    category: "Honors",
    accentColor: "#b45309",
    html: `<div style="background-color: #fffdf5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 28px; border: 1px solid #fef3c7; border-top: 6px solid #b45309; padding: 40px; box-shadow: 0 12px 36px rgba(180, 83, 9, 0.06);">
    <!-- CD_LOGO_START -->
    <div data-chromadiaries-logo="true" style="text-align: center; margin-top: 8px; margin-bottom: 20px; padding: 0;">
      <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://chromadiaries.in/logo.png" alt="Chroma Diaries" width="160" style="display: block; width: 160px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" />
      </a>
    </div>
    <!-- CD_LOGO_END -->

    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 6px 20px; border-radius: 9999px; border: 1px solid #fde68a;">
        ★ OFFICIAL SELECTION & HONORS ★
      </span>
    </div>

    <h1 style="font-family: Georgia, serif; color: #78350f; font-size: 24px; text-align: center; margin: 0 0 18px 0; font-weight: 700; line-height: 1.35;">
      {{subject}}
    </h1>

    <div style="color: #374151; font-size: 15px; line-height: 1.75; margin-bottom: 28px;">
      <p>Dear {{name}},</p>
      <p>On behalf of the executive board, it gives us immense pleasure to honor your contributions to Chroma Diaries.</p>
      <p>Your work has been selected as a featured centerpiece in our seasonal curation.</p>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="https://chromadiaries.in" style="display: inline-block; background-color: #b45309; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 34px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(180, 83, 9, 0.25);">
        Explore the Distinction &rarr;
      </a>
    </div>

    <div style="border-top: 1px solid #fef3c7; padding-top: 24px; margin-top: 36px; font-size: 11px; color: #9ca3af; text-align: center;">
      Chroma Diaries Honors & Awards Desk • Sabeelul Hidaya Islamic College
    </div>
  </div>
</div>`,
  },

  parchment: {
    id: "parchment",
    name: "Literary Parchment",
    description: "Vintage double-framed serif parchment with emblem seal, pullquote, and classical ornament",
    category: "Literary",
    accentColor: "#1c1917",
    html: `<div style="background-color: #f7f4ec; padding: 40px 20px; font-family: Georgia, serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #fdfbf7; border: 3px double #1c1917; padding: 44px 36px; box-shadow: 0 6px 24px rgba(0,0,0,0.03);">
    <!-- CD_LOGO_START -->
    <div data-chromadiaries-logo="true" style="text-align: center; margin-top: 6px; margin-bottom: 20px; padding: 0;">
      <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://chromadiaries.in/icon.png" alt="Chroma Diaries" width="70" style="display: block; width: 70px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" />
      </a>
    </div>
    <!-- CD_LOGO_END -->

    <div style="text-align: center; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #1c1917; margin-bottom: 20px; font-weight: bold;">
      ❖ CHROMA DIARIES ❖
    </div>

    <h2 style="font-size: 22px; color: #1c1917; font-weight: 700; text-align: center; margin: 0 0 24px 0; line-height: 1.4;">
      {{subject}}
    </h2>

    <div style="color: #292524; font-size: 15px; line-height: 1.8; margin-bottom: 28px;">
      <p>Dear {{name}},</p>
      <p>Words carry an enduring cadence. We invite you to explore this thoughtful reflection from our literary archives.</p>
      
      <blockquote style="margin: 24px 0; padding: 18px 24px; background-color: #f4efe2; border-left: 3px solid #1c1917; font-style: italic; font-size: 15px; color: #1c1917; line-height: 1.6;">
        "There is no greater agony than bearing an untold story inside you."
      </blockquote>

      <p>With warm regards and poetic inspiration.</p>
    </div>

    <div style="border-top: 1px solid rgba(28, 25, 23, 0.15); padding-top: 20px; margin-top: 36px; font-size: 12px; color: #78716c; text-align: center; font-style: italic;">
      Chroma Diaries • A Sanctuary for Stories & Philosophical Prose
    </div>
  </div>
</div>`,
  },

  midnight: {
    id: "midnight",
    name: "Midnight Dark Obsidian",
    description: "Deep obsidian theme with dark emerald header bar, white logo, and glowing accents",
    category: "Modern Dark",
    accentColor: "#059669",
    html: `<div style="background-color: #061713; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0b241e; border-radius: 24px; border: 1px solid rgba(16, 185, 129, 0.2); overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
    <div style="background-color: #022c22; padding: 32px 36px; text-align: center; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
      <!-- CD_LOGO_START -->
      <div data-chromadiaries-logo="true" style="text-align: center; margin: 0; padding: 0;">
        <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
          <img src="https://chromadiaries.in/logo-white.png" alt="Chroma Diaries" width="170" style="display: block; width: 170px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" />
        </a>
      </div>
      <!-- CD_LOGO_END -->
    </div>

    <div style="padding: 36px;">
      <h1 style="font-family: Georgia, serif; color: #ecfdf5; font-size: 22px; margin: 0 0 18px 0; font-weight: 700;">
        {{subject}}
      </h1>

      <div style="color: #d1fae5; font-size: 15px; line-height: 1.75; margin-bottom: 28px;">
        <p>Dear {{name}},</p>
        <p>Welcome to the midnight edition dispatch. Here is the latest curation from our writing circles and creative essays.</p>
      </div>

      <div style="text-align: center; margin: 28px 0 14px 0;">
        <a href="https://chromadiaries.in" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 30px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);">
          Read Midnight Dispatch &rarr;
        </a>
      </div>

      <div style="border-top: 1px solid rgba(16, 185, 129, 0.15); padding-top: 20px; margin-top: 32px; font-size: 11px; color: #6ee7b7; text-align: center;">
        Chroma Diaries • Midnight Editorial Collective
      </div>
    </div>
  </div>
</div>`,
  },

  clean: {
    id: "clean",
    name: "Clean Minimalist Card",
    description: "Modern, minimal, contemporary card layout with left-aligned brand logo and clean sans-serif typography",
    category: "Minimal",
    accentColor: "#111827",
    html: `<div style="background-color: #f9fafb; padding: 36px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
    <!-- CD_LOGO_START -->
    <div data-chromadiaries-logo="true" style="text-align: left; margin-bottom: 28px; padding: 0;">
      <a href="https://chromadiaries.in" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://chromadiaries.in/logo.png" alt="Chroma Diaries" width="140" style="display: block; width: 140px; max-width: 100%; height: auto; border: 0; outline: none;" />
      </a>
    </div>
    <!-- CD_LOGO_END -->

    <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px 0; font-weight: 700;">
      {{subject}}
    </h2>

    <div style="color: #374151; font-size: 14px; line-height: 1.7; margin-bottom: 24px;">
      <p>Hello {{name}},</p>
      <p>This is a clean, modern communication from Chroma Diaries. You can customize this layout completely to fit any announcement or update.</p>
    </div>

    <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 28px; font-size: 11px; color: #9ca3af;">
      Chroma Diaries Official Communication Desk • <a href="https://chromadiaries.in" style="color: #111827; text-decoration: none; font-weight: 600;">chromadiaries.in</a>
    </div>
  </div>
</div>`,
  },
};

/**
 * Pure template renderer:
 * The email layout comes directly from the HTML template.
 * There is never anything constant forced in all templates (no forced constant header, subject heading, or footer).
 */
export function renderEmailTemplate(subject: string, htmlContent: string): string {
  if (!htmlContent) return "";

  // If already a complete HTML document, return as-is
  if (/<html[\s>]/i.test(htmlContent) || /<!doctype/i.test(htmlContent)) {
    return htmlContent;
  }

  // Minimal neutral email wrapper for HTML fragments to satisfy email clients,
  // without injecting ANY constant headers, subject titles, badges, or footers
  const safeSubject = subject ? subject.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Chroma Diaries";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeSubject}</title>
</head>
<body style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  ${htmlContent}
</body>
</html>`;
}

/**
 * Backwards compatibility wrapper renderer.
 * If config.enabled is false, it returns the pure template HTML with zero constant layout elements.
 */
export function renderEmailWithWrapper(
  subject: string,
  contentHtml: string,
  wrapperConfig: Partial<EmailWrapperConfig> = {},
): string {
  const cfg = { ...DEFAULT_WRAPPER_CONFIG, ...wrapperConfig };
  if (!cfg.enabled) {
    return renderEmailTemplate(subject, contentHtml);
  }

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
