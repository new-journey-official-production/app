/**
 * B2B wholesale catalog PDF — grayscale layout for thermal/office printers.
 */
import jsPDF from "jspdf";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { API_BASE } from "@/config/env";
import { BRAND_NAME, BRAND_STUDIO, BRAND_PHONE, BRAND_WEBSITE } from "@/lib/brand";

export type B2bPdfTemplate = "modern" | "luxury" | "corporate" | "minimal" | "dark";

export interface B2bCatalogPdfOptions {
  products: ApiRow[];
  settings?: ApiRow | null;
  template?: B2bPdfTemplate;
  title?: string;
}

const BLACK: [number, number, number] = [0, 0, 0];
const GRAY: [number, number, number] = [82, 82, 91];
const LIGHT: [number, number, number] = [220, 220, 220];
const WHITE: [number, number, number] = [255, 255, 255];

/** Resolves relative media URLs and loads images with cookie auth (admin media requires credentials). */
async function loadImageDataUrl(url: string): Promise<string | null> {
  if (!url?.trim()) return null;
  const base = API_BASE.replace(/\/api$/, "");
  const fullUrl = url.startsWith("http")
    ? url
    : `${base}${url.startsWith("/") ? "" : "/"}${url}`;

  try {
    const res = await fetch(fullUrl, { credentials: "include" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Picks the first usable image URL from a B2B product row. */
function productImageUrl(product: ApiRow): string {
  const hero = String(product.hero_image || "").trim();
  if (hero) return hero;
  const gallery = product.gallery;
  if (Array.isArray(gallery) && gallery.length > 0) return String(gallery[0]);
  if (typeof gallery === "string" && gallery.trim()) return gallery.trim();
  const lifestyle = product.lifestyle_images;
  if (Array.isArray(lifestyle) && lifestyle.length > 0) return String(lifestyle[0]);
  return "";
}

/** Loads a QR code PNG for embedding in the PDF. */
async function loadQrDataUrl(data: string, size = 120): Promise<string | null> {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png&margin=1`;
  return loadImageDataUrl(qrUrl);
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

function drawCoverPage(doc: jsPDF, title: string, settings: ApiRow, productCount: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(...BLACK);
  doc.rect(0, 0, w, 55, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text(settings.company_name || BRAND_STUDIO, w / 2, 28, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(settings.tagline || "Bulk Manufacturing & Wholesale 3D Printing Solutions", w / 2, 38, { align: "center", maxWidth: w - 40 });

  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, w / 2, 85, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${productCount} product${productCount === 1 ? "" : "s"}`, w / 2, 96, { align: "center" });
  doc.text(BRAND_WEBSITE, w / 2, 106, { align: "center" });

  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.8);
  doc.line(w / 2 - 35, h - 45, w / 2 + 35, h - 45);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`${BRAND_NAME} · ${settings.sales_phone || BRAND_PHONE}`, w / 2, h - 35, { align: "center" });
}

async function drawProductPage(
  doc: jsPDF,
  product: ApiRow,
  settings: ApiRow,
  pageNum: number,
  totalPages: number,
  imageData: string | null,
  qrData: string | null,
) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const origin = typeof window !== "undefined" ? window.location.origin : BRAND_WEBSITE.replace(/\/$/, "");
  const slug = product.slug || product.id;
  const productUrl = `${origin}/b2b/product/${slug}`;
  const whatsapp = String(settings.whatsapp_number || BRAND_PHONE).replace(/\D/g, "");
  const footerTop = h - 38;

  doc.setFillColor(...BLACK);
  doc.rect(0, 0, w, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(settings.company_name || BRAND_STUDIO, 14, 8);
  doc.text(`Page ${pageNum} / ${totalPages}`, w - 14, 8, { align: "right" });

  let y = 18;
  const imgW = 72;
  const imgH = 54;

  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.3);
  if (imageData) {
    try {
      doc.addImage(imageData, "JPEG", 14, y, imgW, imgH);
      doc.rect(14, y, imgW, imgH);
    } catch {
      doc.setFillColor(...LIGHT);
      doc.rect(14, y, imgW, imgH, "FD");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text("Image unavailable", 14 + imgW / 2, y + imgH / 2, { align: "center" });
    }
  } else {
    doc.setFillColor(...LIGHT);
    doc.rect(14, y, imgW, imgH, "FD");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("Image unavailable", 14 + imgW / 2, y + imgH / 2, { align: "center" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BLACK);
  const titleLines = doc.splitTextToSize(String(product.name || "Product"), w - 100);
  doc.text(titleLines.slice(0, 2), 92, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  let metaY = y + 8 + titleLines.slice(0, 2).length * 5 + 2;
  if (product.sku) { doc.text(`SKU: ${product.sku}`, 92, metaY); metaY += 4; }
  if (product.material) doc.text(`Material: ${product.material}`, 92, metaY);

  y += imgH + 6;

  doc.setFillColor(...BLACK);
  doc.rect(14, y, w - 28, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  const retail = Number(product.retail_price || 0);
  const wholesale = Number(product.wholesale_price || product.offer_price || 0);
  doc.text(`Retail: ${formatCurrency(retail)}`, 18, y + 8);
  doc.text(`Wholesale: ${formatCurrency(wholesale)}`, 78, y + 8);
  doc.text(`MOQ: ${product.min_order_qty ?? product.recommended_moq ?? 1}`, w - 18, y + 8, { align: "right" });
  y += 16;

  const maxY = footerTop - 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("Overview", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  const overview = String(product.overview || product.features || "—").slice(0, 500);
  const overviewLines = doc.splitTextToSize(overview, w - 70);
  const maxOverviewLines = Math.max(2, Math.floor((maxY - y) / 3.5) - 2);
  doc.text(overviewLines.slice(0, maxOverviewLines), 14, y);
  y += overviewLines.slice(0, maxOverviewLines).length * 3.5 + 3;

  if (product.specifications && y < maxY - 12) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text("Specifications", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const specLines = doc.splitTextToSize(String(product.specifications).slice(0, 250), w - 70);
    const maxSpec = Math.max(1, Math.floor((maxY - y) / 3.5));
    doc.text(specLines.slice(0, maxSpec), 14, y);
    y += specLines.slice(0, maxSpec).length * 3.5 + 3;
  }

  const custLabels = customizationLabels(product.customization as ApiRow);
  if (custLabels.length && y < maxY - 8) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    doc.text("Customization", 14, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text(custLabels.join(" · "), 14, y, { maxWidth: w - 70 });
  }

  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.line(14, footerTop, w - 14, footerTop);

  const qrSize = 24;
  const qrX = w - 14 - qrSize;
  const qrY = footerTop + 3;
  if (qrData) {
    try {
      doc.addImage(qrData, "PNG", qrX, qrY, qrSize, qrSize);
    } catch {
      doc.rect(qrX, qrY, qrSize, qrSize);
    }
  } else {
    doc.rect(qrX, qrY, qrSize, qrSize);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text("Scan for product", qrX + qrSize / 2, qrY + qrSize + 3.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(`WhatsApp: +${whatsapp}`, 14, footerTop + 8);
  doc.text(String(settings.sales_email || ""), 14, footerTop + 13);
  doc.text(productUrl.length > 52 ? productUrl.slice(0, 49) + "…" : productUrl, 14, footerTop + 18, { maxWidth: w - 50 });
}

/** Generates and downloads a multi-page B2B catalog PDF. */
export async function downloadB2bCatalog({
  products,
  settings = {},
  title,
}: B2bCatalogPdfOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const settingsRow = settings ?? {};
  const catalogTitle = title || settingsRow.catalog_cover_title || "Wholesale Catalog";
  const totalPages = products.length + 1;

  drawCoverPage(doc, catalogTitle, settingsRow, products.length);

  for (let i = 0; i < products.length; i += 1) {
    doc.addPage();
    const p = products[i];
    const imgUrl = productImageUrl(p);
    const origin = typeof window !== "undefined" ? window.location.origin : BRAND_WEBSITE.replace(/\/$/, "");
    const productUrl = `${origin}/b2b/product/${p.slug || p.id}`;
    const [imageData, qrData] = await Promise.all([
      loadImageDataUrl(imgUrl),
      loadQrDataUrl(productUrl, 120),
    ]);
    await drawProductPage(doc, p, settingsRow, i + 2, totalPages, imageData, qrData);
  }

  const safeName = catalogTitle.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);
  doc.save(`${safeName || "B2B-Catalog"}.pdf`);
}
