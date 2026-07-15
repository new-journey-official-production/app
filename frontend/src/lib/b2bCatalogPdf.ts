/**
 * B2B wholesale catalog PDF generator — multi-template product pages with branding.
 */
import jsPDF from "jspdf";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { BRAND_NAME, BRAND_STUDIO, BRAND_PHONE, BRAND_WEBSITE } from "@/lib/brand";

export type B2bPdfTemplate = "modern" | "luxury" | "corporate" | "minimal" | "dark";

export interface B2bCatalogPdfOptions {
  products: ApiRow[];
  settings?: ApiRow | null;
  template?: B2bPdfTemplate;
  title?: string;
}

interface TemplateTheme {
  accent: [number, number, number];
  bg: [number, number, number];
  text: [number, number, number];
  muted: [number, number, number];
  headerBg: [number, number, number];
  headerText: [number, number, number];
}

const THEMES: Record<B2bPdfTemplate, TemplateTheme> = {
  modern: {
    accent: [234, 88, 12],
    bg: [255, 255, 255],
    text: [24, 24, 27],
    muted: [113, 113, 122],
    headerBg: [24, 24, 27],
    headerText: [255, 255, 255],
  },
  luxury: {
    accent: [180, 140, 60],
    bg: [250, 248, 245],
    text: [30, 25, 20],
    muted: [120, 110, 100],
    headerBg: [30, 25, 20],
    headerText: [250, 248, 245],
  },
  corporate: {
    accent: [37, 99, 235],
    bg: [255, 255, 255],
    text: [15, 23, 42],
    muted: [100, 116, 139],
    headerBg: [15, 23, 42],
    headerText: [255, 255, 255],
  },
  minimal: {
    accent: [63, 63, 70],
    bg: [255, 255, 255],
    text: [39, 39, 42],
    muted: [161, 161, 170],
    headerBg: [255, 255, 255],
    headerText: [39, 39, 42],
  },
  dark: {
    accent: [251, 146, 60],
    bg: [24, 24, 27],
    text: [250, 250, 250],
    muted: [161, 161, 170],
    headerBg: [9, 9, 11],
    headerText: [250, 250, 250],
  },
};

/** Attempts to load an image URL into a data URL for jsPDF embedding. */
async function loadImageDataUrl(url: string): Promise<string | null> {
  if (!url?.trim()) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function customizationLabels(custom: ApiRow | undefined): string[] {
  if (!custom) return [];
  const map: [string, string][] = [
    ["custom_logo", "Custom Logo"],
    ["custom_name", "Custom Name"],
    ["custom_text", "Custom Text"],
    ["upload_image", "Upload Image"],
    ["business_branding", "Business Branding"],
    ["private_label", "Private Label"],
    ["packaging_branding", "Packaging Branding"],
  ];
  return map.filter(([k]) => custom[k]).map(([, label]) => label);
}

function drawQrPlaceholder(doc: jsPDF, x: number, y: number, size: number, url: string, theme: TemplateTheme) {
  doc.setDrawColor(...theme.muted);
  doc.setLineWidth(0.3);
  doc.rect(x, y, size, size);
  // Simple QR-like grid pattern
  const cell = size / 7;
  doc.setFillColor(...theme.text);
  for (let r = 0; r < 7; r += 1) {
    for (let c = 0; c < 7; c += 1) {
      if ((r + c) % 2 === 0 || (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2)) {
        doc.rect(x + c * cell, y + r * cell, cell, cell, "F");
      }
    }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...theme.muted);
  const short = url.length > 42 ? url.slice(0, 39) + "…" : url;
  doc.text(short, x, y + size + 4, { maxWidth: size + 40 });
}

function drawCoverPage(
  doc: jsPDF,
  title: string,
  settings: ApiRow,
  theme: TemplateTheme,
  template: B2bPdfTemplate,
  productCount: number,
) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...theme.bg);
  doc.rect(0, 0, w, h, "F");

  if (template !== "minimal") {
    doc.setFillColor(...theme.headerBg);
    doc.rect(0, 0, w, template === "luxury" ? 90 : 70, "F");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(template === "luxury" ? 28 : 24);
  doc.setTextColor(template === "minimal" ? theme.text[0] : theme.headerText[0], template === "minimal" ? theme.text[1] : theme.headerText[1], template === "minimal" ? theme.text[2] : theme.headerText[2]);
  doc.text(settings.company_name || BRAND_STUDIO, w / 2, template === "minimal" ? 50 : 35, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...theme.muted);
  doc.text(settings.tagline || "Bulk Manufacturing & Wholesale 3D Printing Solutions", w / 2, template === "minimal" ? 62 : 48, { align: "center", maxWidth: w - 40 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...theme.accent);
  doc.text(title, w / 2, h / 2 - 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...theme.text);
  doc.text(`${productCount} product${productCount === 1 ? "" : "s"}`, w / 2, h / 2 + 4, { align: "center" });
  doc.text(BRAND_WEBSITE, w / 2, h / 2 + 14, { align: "center" });

  doc.setDrawColor(...theme.accent);
  doc.setLineWidth(1);
  doc.line(w / 2 - 30, h - 40, w / 2 + 30, h - 40);
  doc.setFontSize(8);
  doc.setTextColor(...theme.muted);
  doc.text(`${BRAND_NAME} · ${settings.sales_phone || BRAND_PHONE}`, w / 2, h - 32, { align: "center" });
}

function drawProductPage(
  doc: jsPDF,
  product: ApiRow,
  settings: ApiRow,
  theme: TemplateTheme,
  pageNum: number,
  totalPages: number,
  imageData: string | null,
) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const origin = typeof window !== "undefined" ? window.location.origin : BRAND_WEBSITE.replace(/\/$/, "");
  const slug = product.slug || product.id;
  const productUrl = `${origin}/b2b/product/${slug}`;
  const whatsapp = String(settings.whatsapp_number || BRAND_PHONE).replace(/\D/g, "");

  doc.setFillColor(...theme.bg);
  doc.rect(0, 0, w, h, "F");

  // Header bar
  doc.setFillColor(...theme.headerBg);
  doc.rect(0, 0, w, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...theme.headerText);
  doc.text(settings.company_name || BRAND_STUDIO, 14, 9);
  doc.text(`Page ${pageNum} / ${totalPages}`, w - 14, 9, { align: "right" });

  let y = 22;

  // Hero image
  const imgW = 80;
  const imgH = 60;
  if (imageData) {
    try {
      doc.addImage(imageData, "JPEG", 14, y, imgW, imgH);
    } catch {
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y, imgW, imgH, "F");
    }
  } else {
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y, imgW, imgH, "F");
    doc.setFontSize(8);
    doc.setTextColor(...theme.muted);
    doc.text("Image unavailable", 14 + imgW / 2, y + imgH / 2, { align: "center" });
  }

  // Title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...theme.text);
  doc.text(String(product.name || "Product"), 100, y + 8, { maxWidth: w - 114 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...theme.muted);
  if (product.sku) doc.text(`SKU: ${product.sku}`, 100, y + 16);
  if (product.material) doc.text(`Material: ${product.material}`, 100, y + 22);

  y += imgH + 8;

  // Pricing row
  doc.setFillColor(...theme.accent);
  doc.rect(14, y, w - 28, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const retail = Number(product.retail_price || 0);
  const wholesale = Number(product.wholesale_price || product.offer_price || 0);
  doc.text(`Retail: ${formatCurrency(retail)}`, 18, y + 9);
  doc.text(`Wholesale: ${formatCurrency(wholesale)}`, 80, y + 9);
  doc.text(`MOQ: ${product.min_order_qty ?? product.recommended_moq ?? 1}`, w - 18, y + 9, { align: "right" });
  y += 20;

  // Overview
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...theme.text);
  doc.text("Overview", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...theme.muted);
  const overview = String(product.overview || product.features || "").slice(0, 400);
  const overviewLines = doc.splitTextToSize(overview || "—", w - 28);
  doc.text(overviewLines.slice(0, 6), 14, y);
  y += overviewLines.slice(0, 6).length * 4 + 4;

  // Specs snippet
  if (product.specifications) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...theme.text);
    doc.text("Specifications", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const specLines = doc.splitTextToSize(String(product.specifications).slice(0, 300), w - 28);
    doc.text(specLines.slice(0, 4), 14, y);
    y += specLines.slice(0, 4).length * 4 + 4;
  }

  // Customization flags
  const custLabels = customizationLabels(product.customization as ApiRow);
  if (custLabels.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...theme.text);
    doc.text("Customization", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(custLabels.join(" · "), 14, y, { maxWidth: w - 100 });
    y += 8;
  }

  // QR + contact footer area
  drawQrPlaceholder(doc, w - 54, h - 52, 28, productUrl, theme);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...theme.text);
  doc.text("Scan / visit product page", w - 54, h - 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...theme.muted);
  doc.text(`WhatsApp: +${whatsapp}`, 14, h - 20);
  doc.text(settings.sales_email || "", 14, h - 15);
  doc.text(BRAND_WEBSITE, 14, h - 10);

  doc.setDrawColor(...theme.accent);
  doc.setLineWidth(0.5);
  doc.line(14, h - 26, w - 14, h - 26);
}

/** Generates and downloads a multi-page B2B catalog PDF. */
export async function downloadB2bCatalog({
  products,
  settings = {},
  template = "modern",
  title,
}: B2bCatalogPdfOptions) {
  const theme = THEMES[template] || THEMES.modern;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const settingsRow = settings ?? {};
  const catalogTitle = title || settingsRow.catalog_cover_title || "Wholesale Catalog";
  const totalPages = products.length + 1;

  drawCoverPage(doc, catalogTitle, settingsRow, theme, template, products.length);

  for (let i = 0; i < products.length; i += 1) {
    doc.addPage();
    const p = products[i];
    const imgUrl = p.hero_image || p.gallery?.[0] || "";
    const imageData = await loadImageDataUrl(imgUrl);
    drawProductPage(doc, p, settingsRow, theme, i + 2, totalPages, imageData);
  }

  const safeName = catalogTitle.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);
  doc.save(`${safeName || "B2B-Catalog"}.pdf`);
}
