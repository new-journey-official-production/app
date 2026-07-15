import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, API_BASE } from "@/lib/api";
import type { ApiRow } from "@/types";
import { MATERIALS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const emptyCustomization: ApiRow = {
  custom_logo: false,
  custom_name: false,
  custom_text: false,
  upload_image: false,
  business_branding: false,
  private_label: false,
  packaging_branding: false,
};

const emptyProduct: ApiRow = {
  name: "",
  sku: "",
  slug: "",
  category_id: null,
  subcategory_id: null,
  brand: "",
  status: "draft",
  featured: false,
  best_seller: false,
  new_arrival: false,
  retail_price: 0,
  wholesale_price: 0,
  dealer_price: 0,
  min_order_qty: 1,
  recommended_moq: 1,
  gst_percent: 18,
  discount_percent: 0,
  offer_price: null,
  material: "",
  printer: "",
  printing_technology: "",
  layer_height: "",
  nozzle_size: "",
  infill: "",
  weight_g: null,
  dimensions: "",
  production_time: "",
  lead_time: "",
  packaging: "",
  country_of_origin: "India",
  colors: [],
  customization: { ...emptyCustomization },
  hero_image: "",
  gallery: [],
  lifestyle_images: [],
  white_bg_images: [],
  transparent_images: [],
  images_360: [],
  videos: [],
  overview: "",
  features: "",
  applications: "",
  benefits: "",
  specifications: "",
  package_contents: "",
  care_instructions: "",
  faqs: [],
  is_visible: true,
  is_downloadable: true,
  show_price: true,
  show_moq: true,
  show_lead_time: true,
  recommended: false,
  coming_soon: false,
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  og_image: "",
  twitter_card: "",
  canonical_url: "",
};

/** Full tabbed B2B product form — create and edit wholesale catalog items. */
export default function B2bProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState<ApiRow>({ ...emptyProduct, customization: { ...emptyCustomization } });
  const [categories, setCategories] = useState<ApiRow[]>([]);
  const [imgInput, setImgInput] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    api.get("/admin/b2b/categories", { params: { tree: false } })
      .then((r) => setCategories(r.data.flat || r.data.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      api.get(`/admin/b2b/products/${id}`)
        .then((r) => {
          const p = r.data.product || r.data;
          setF({
            ...emptyProduct,
            ...p,
            customization: { ...emptyCustomization, ...(p.customization || {}) },
            colors: p.colors || [],
            gallery: p.gallery || [],
            faqs: p.faqs || [],
          });
        })
        .catch((e) => toast.error(apiError(e)));
    }
  }, [id]);

  const uploadFiles = async (files: FileList | null, field: string) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/admin/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        if (data?.id) urls.push(`${API_BASE}/admin/media/${data.id}`);
      }
      if (urls.length) {
        setF((prev) => {
          const list = [...(prev[field] || []), ...urls];
          const patch: ApiRow = { [field]: list };
          if (field === "gallery" && !prev.hero_image) patch.hero_image = urls[0];
          return { ...prev, ...patch };
        });
        toast.success(`${urls.length} file(s) uploaded`);
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const buildPayload = (): ApiRow => ({
    name: f.name,
    sku: f.sku || "",
    category_id: f.category_id || null,
    subcategory_id: f.subcategory_id || null,
    brand: f.brand || "",
    status: f.status || "draft",
    featured: !!f.featured,
    best_seller: !!f.best_seller,
    new_arrival: !!f.new_arrival,
    retail_price: Number(f.retail_price) || 0,
    wholesale_price: Number(f.wholesale_price) || 0,
    dealer_price: Number(f.dealer_price) || 0,
    min_order_qty: Number(f.min_order_qty) || 1,
    recommended_moq: Number(f.recommended_moq) || 1,
    gst_percent: Number(f.gst_percent) || 18,
    discount_percent: Number(f.discount_percent) || 0,
    offer_price: f.offer_price === "" || f.offer_price == null ? null : Number(f.offer_price),
    material: f.material || "",
    printer: f.printer || "",
    printing_technology: f.printing_technology || "",
    layer_height: f.layer_height || "",
    nozzle_size: f.nozzle_size || "",
    infill: f.infill || "",
    weight_g: f.weight_g === "" || f.weight_g == null ? null : Number(f.weight_g),
    dimensions: f.dimensions || "",
    production_time: f.production_time || "",
    lead_time: f.lead_time || "",
    packaging: f.packaging || "",
    country_of_origin: f.country_of_origin || "India",
    colors: f.colors || [],
    customization: f.customization || emptyCustomization,
    hero_image: f.hero_image || "",
    gallery: f.gallery || [],
    lifestyle_images: f.lifestyle_images || [],
    white_bg_images: f.white_bg_images || [],
    transparent_images: f.transparent_images || [],
    images_360: f.images_360 || [],
    videos: f.videos || [],
    overview: f.overview || "",
    features: f.features || "",
    applications: f.applications || "",
    benefits: f.benefits || "",
    specifications: f.specifications || "",
    package_contents: f.package_contents || "",
    care_instructions: f.care_instructions || "",
    faqs: f.faqs || [],
    is_visible: !!f.is_visible,
    is_downloadable: !!f.is_downloadable,
    show_price: !!f.show_price,
    show_moq: !!f.show_moq,
    show_lead_time: !!f.show_lead_time,
    recommended: !!f.recommended,
    coming_soon: !!f.coming_soon,
    seo_title: f.seo_title || "",
    seo_description: f.seo_description || "",
    seo_keywords: f.seo_keywords || "",
    og_image: f.og_image || "",
    twitter_card: f.twitter_card || "",
    canonical_url: f.canonical_url || "",
    ...(f.slug?.trim() ? { slug: f.slug.trim() } : {}),
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name?.trim()) { toast.error("Product name is required"); return; }
    setBusy(true);
    try {
      const payload = buildPayload();
      if (isEdit) await api.patch(`/admin/b2b/products/${id}`, payload);
      else await api.post("/admin/b2b/products", payload);
      toast.success(isEdit ? "Product updated" : "Product created");
      nav("/admin/b2b/products");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const addGalleryUrl = () => {
    if (!imgInput.trim()) return;
    setF({ ...f, gallery: [...(f.gallery || []), imgInput.trim()], hero_image: f.hero_image || imgInput.trim() });
    setImgInput("");
  };

  const addColor = () => {
    if (!colorName.trim()) return;
    setF({ ...f, colors: [...(f.colors || []), { name: colorName.trim(), hex: colorHex, preview: "" }] });
    setColorName("");
    setColorHex("#000000");
  };

  const addFaq = () => {
    if (!faqQ.trim()) return;
    setF({ ...f, faqs: [...(f.faqs || []), { question: faqQ.trim(), answer: faqA.trim() }] });
    setFaqQ("");
    setFaqA("");
  };

  const setCustom = (key: string, val: boolean) => {
    setF({ ...f, customization: { ...(f.customization as ApiRow), [key]: val } });
  };

  if (isEdit && !f.name && !busy) {
    return <div className="p-8"><div className="h-96 rounded-xl shimmer" /></div>;
  }

  return (
    <div className="p-6 lg:p-8">
      <Link to="/admin/b2b/products" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to B2B products
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{isEdit ? "Edit B2B product" : "New B2B product"}</h1>

      <form onSubmit={save} className="mt-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="customization">Customization</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            {isEdit && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="rounded-xl border border-border bg-card p-6 space-y-4">
            <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} required />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="SKU" value={f.sku} onChange={(v) => setF({ ...f, sku: v })} />
              <Field label="Slug (optional)" value={f.slug} onChange={(v) => setF({ ...f, slug: v })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={f.category_id || "__none__"} onValueChange={(v) => setF({ ...f, category_id: v === "__none__" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Brand" value={f.brand} onChange={(v) => setF({ ...f, brand: v })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={f.status || "draft"} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-6">
              <ToggleRow label="Featured" value={!!f.featured} onChange={(v) => setF({ ...f, featured: v })} />
              <ToggleRow label="Best seller" value={!!f.best_seller} onChange={(v) => setF({ ...f, best_seller: v })} />
              <ToggleRow label="New arrival" value={!!f.new_arrival} onChange={(v) => setF({ ...f, new_arrival: v })} />
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="rounded-xl border border-border bg-card p-6 grid sm:grid-cols-2 gap-3">
            <Field label="Retail price" type="number" value={f.retail_price} onChange={(v) => setF({ ...f, retail_price: v })} />
            <Field label="Wholesale price" type="number" value={f.wholesale_price} onChange={(v) => setF({ ...f, wholesale_price: v })} />
            <Field label="Dealer price" type="number" value={f.dealer_price} onChange={(v) => setF({ ...f, dealer_price: v })} />
            <Field label="Offer price (optional)" type="number" value={f.offer_price ?? ""} onChange={(v) => setF({ ...f, offer_price: v })} />
            <Field label="Min order qty" type="number" value={f.min_order_qty} onChange={(v) => setF({ ...f, min_order_qty: v })} />
            <Field label="Recommended MOQ" type="number" value={f.recommended_moq} onChange={(v) => setF({ ...f, recommended_moq: v })} />
            <Field label="GST %" type="number" value={f.gst_percent} onChange={(v) => setF({ ...f, gst_percent: v })} />
            <Field label="Discount %" type="number" value={f.discount_percent} onChange={(v) => setF({ ...f, discount_percent: v })} />
          </TabsContent>

          <TabsContent value="manufacturing" className="rounded-xl border border-border bg-card p-6 grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Material</Label>
              <Select value={f.material || "__none__"} onValueChange={(v) => setF({ ...f, material: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select</SelectItem>
                  {MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Field label="Printer" value={f.printer} onChange={(v) => setF({ ...f, printer: v })} />
            <Field label="Printing technology" value={f.printing_technology} onChange={(v) => setF({ ...f, printing_technology: v })} />
            <Field label="Layer height" value={f.layer_height} onChange={(v) => setF({ ...f, layer_height: v })} />
            <Field label="Nozzle size" value={f.nozzle_size} onChange={(v) => setF({ ...f, nozzle_size: v })} />
            <Field label="Infill" value={f.infill} onChange={(v) => setF({ ...f, infill: v })} />
            <Field label="Weight (g)" type="number" value={f.weight_g ?? ""} onChange={(v) => setF({ ...f, weight_g: v })} />
            <Field label="Dimensions" value={f.dimensions} onChange={(v) => setF({ ...f, dimensions: v })} />
            <Field label="Production time" value={f.production_time} onChange={(v) => setF({ ...f, production_time: v })} />
            <Field label="Lead time" value={f.lead_time} onChange={(v) => setF({ ...f, lead_time: v })} />
            <Field label="Packaging" value={f.packaging} onChange={(v) => setF({ ...f, packaging: v })} />
            <Field label="Country of origin" value={f.country_of_origin} onChange={(v) => setF({ ...f, country_of_origin: v })} />
          </TabsContent>

          <TabsContent value="colors" className="rounded-xl border border-border bg-card p-6">
            <div className="flex gap-2 mb-3">
              <input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="Color name" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-9 w-12 rounded border border-input" />
              <Button type="button" variant="outline" size="icon" onClick={addColor}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(f.colors as ApiRow[] || []).map((c, i) => (
                <span key={i} className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
                  <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hex }} />
                  {c.name}
                  <button type="button" onClick={() => setF({ ...f, colors: (f.colors as ApiRow[]).filter((_, j) => j !== i) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="customization" className="rounded-xl border border-border bg-card p-6 space-y-3">
            {[
              ["custom_logo", "Custom logo"],
              ["custom_name", "Custom name"],
              ["custom_text", "Custom text"],
              ["upload_image", "Upload image"],
              ["business_branding", "Business branding"],
              ["private_label", "Private label"],
              ["packaging_branding", "Packaging branding"],
            ].map(([key, label]) => (
              <ToggleRow key={key} label={label} value={!!(f.customization as ApiRow)?.[key]} onChange={(v) => setCustom(key, v)} />
            ))}
          </TabsContent>

          <TabsContent value="gallery" className="rounded-xl border border-border bg-card p-6 space-y-4">
            <Field label="Hero image URL" value={f.hero_image} onChange={(v) => setF({ ...f, hero_image: v })} />
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => uploadFiles(e.target.files, "gallery")} />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload images"}
            </Button>
            <div className="flex gap-2">
              <input value={imgInput} onChange={(e) => setImgInput(e.target.value)} placeholder="Or paste image URL" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Button type="button" variant="outline" size="icon" onClick={addGalleryUrl}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(f.gallery as string[] || []).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-zinc-100 dark:bg-zinc-800">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setF({ ...f, gallery: (f.gallery as string[]).filter((_, j) => j !== i) })} className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="description" className="rounded-xl border border-border bg-card p-6 space-y-4">
            {[
              ["overview", "Overview"],
              ["features", "Features"],
              ["applications", "Applications"],
              ["benefits", "Benefits"],
              ["specifications", "Specifications"],
              ["package_contents", "Package contents"],
              ["care_instructions", "Care instructions"],
            ].map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <textarea rows={3} value={f[key] || ""} onChange={(e) => setF({ ...f, [key]: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
              </div>
            ))}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">FAQs</Label>
              <div className="flex gap-2 mb-2">
                <input value={faqQ} onChange={(e) => setFaqQ(e.target.value)} placeholder="Question" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <input value={faqA} onChange={(e) => setFaqA(e.target.value)} placeholder="Answer" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <Button type="button" variant="outline" size="icon" onClick={addFaq}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                {(f.faqs as ApiRow[] || []).map((faq, i) => (
                  <div key={i} className="rounded-lg border p-3 text-sm flex justify-between gap-2">
                    <div><div className="font-medium">{faq.question}</div><div className="text-muted-foreground">{faq.answer}</div></div>
                    <button type="button" onClick={() => setF({ ...f, faqs: (f.faqs as ApiRow[]).filter((_, j) => j !== i) })}><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="visibility" className="rounded-xl border border-border bg-card p-6 space-y-3">
            <ToggleRow label="Visible in catalog" value={!!f.is_visible} onChange={(v) => setF({ ...f, is_visible: v })} />
            <ToggleRow label="Downloadable PDF" value={!!f.is_downloadable} onChange={(v) => setF({ ...f, is_downloadable: v })} />
            <ToggleRow label="Show price" value={!!f.show_price} onChange={(v) => setF({ ...f, show_price: v })} />
            <ToggleRow label="Show MOQ" value={!!f.show_moq} onChange={(v) => setF({ ...f, show_moq: v })} />
            <ToggleRow label="Show lead time" value={!!f.show_lead_time} onChange={(v) => setF({ ...f, show_lead_time: v })} />
            <ToggleRow label="Recommended" value={!!f.recommended} onChange={(v) => setF({ ...f, recommended: v })} />
            <ToggleRow label="Coming soon" value={!!f.coming_soon} onChange={(v) => setF({ ...f, coming_soon: v })} />
          </TabsContent>

          <TabsContent value="seo" className="rounded-xl border border-border bg-card p-6 space-y-3">
            <Field label="SEO title" value={f.seo_title} onChange={(v) => setF({ ...f, seo_title: v })} />
            <div>
              <Label className="text-xs text-muted-foreground">SEO description</Label>
              <textarea rows={3} value={f.seo_description || ""} onChange={(e) => setF({ ...f, seo_description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <Field label="SEO keywords" value={f.seo_keywords} onChange={(v) => setF({ ...f, seo_keywords: v })} />
            <Field label="OG image URL" value={f.og_image} onChange={(v) => setF({ ...f, og_image: v })} />
            <Field label="Canonical URL" value={f.canonical_url} onChange={(v) => setF({ ...f, canonical_url: v })} />
          </TabsContent>

          {isEdit && (
            <TabsContent value="analytics" className="rounded-xl border border-border bg-card p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  ["views_count", "Views"],
                  ["downloads_count", "Downloads"],
                  ["quote_requests_count", "Quote requests"],
                  ["shares_count", "Shares"],
                  ["whatsapp_clicks_count", "WhatsApp clicks"],
                ].map(([key, label]) => (
                  <div key={key} className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
                    <div className="font-mono-data text-2xl font-bold mt-1">{f[key] ?? 0}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">Analytics counters are read-only and updated automatically.</p>
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={busy || uploading} className="bg-orange-600 hover:bg-orange-700 min-w-[160px]">
            {busy ? "Saving…" : isEdit ? "Update product" : "Create product"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string | number | null | undefined; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}{required ? " *" : ""}</Label>
      <input type={type} value={value ?? ""} required={required} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
