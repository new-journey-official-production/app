import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, X, Upload, ChevronUp, ChevronDown, Star } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, API_BASE } from "@/lib/api";
import type { ApiRow } from "@/types";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const empty = {
  name: "", slug: "", description: "", short_description: "",
  category_slug: "", price: 0, discount_price: null, stock: 0,
  color_variants: [], colors: [], hero_image: "", images: [], tags: [], featured: false, is_active: true,
  seo_title: "", seo_description: "",
};

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState<ApiRow>({ ...empty });
  const [categories, setCategories] = useState(CATEGORIES);
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#888888");
  const [imgInput, setImgInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    api.get("/categories")
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        if (list.length > 0) {
          setCategories(list);
          setF((prev) => ({ ...prev, category_slug: prev.category_slug || list[0].slug }));
        }
      })
      .catch(() => setCategories(CATEGORIES));
  }, []);

  useEffect(() => {
    if (id) {
      api.get(`/products/${id}`).then((r) => setF({ ...empty, ...r.data.product }));
    }
  }, [id]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/admin/media/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (data?.id) urls.push(`${API_BASE}/admin/media/${data.id}`);
      }
      if (urls.length) {
        setF((prev) => ({
          ...prev,
          images: [...(prev.images || []), ...urls],
          hero_image: prev.hero_image || urls[0],
        }));
        toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const buildPayload = (): ApiRow => {
    const payload: ApiRow = {
      name: f.name,
      description: f.description,
      short_description: f.short_description,
      category_slug: f.category_slug,
      price: Number(f.price),
      stock: Number(f.stock),
      color_variants: (f.colors || []).map((c) => c.name),
      colors: f.colors || [],
      hero_image: f.hero_image || f.images?.[0] || "",
      images: f.images || [],
      tags: f.tags || [],
      featured: !!f.featured,
      is_active: !!f.is_active,
      seo_title: f.seo_title || "",
      seo_description: f.seo_description || "",
    };
    if (f.slug?.trim()) payload.slug = f.slug.trim();
    if (f.discount_price === "" || f.discount_price == null) payload.discount_price = null;
    else payload.discount_price = Number(f.discount_price);
    return payload;
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = buildPayload();

      if (isEdit) await api.patch(`/products/${id}`, payload);
      else await api.post("/products", payload);
      toast.success(isEdit ? "Product updated" : "Product created");
      nav("/admin/products");
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  const addColor = () => {
    if (!colorName.trim()) return;
    const entry = { name: colorName.trim(), hex: colorHex };
    setF({ ...f, colors: [...(f.colors || []), entry], color_variants: [...(f.color_variants || []), colorName.trim()] });
    setColorName("");
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    const imgs = [...(f.images || [])];
    const next = index + dir;
    if (next < 0 || next >= imgs.length) return;
    [imgs[index], imgs[next]] = [imgs[next], imgs[index]];
    setF({ ...f, images: imgs, hero_image: f.hero_image === f.images[index] ? imgs[index] : f.hero_image });
  };

  const setHero = (url: string) => setF({ ...f, hero_image: url });

  const removeImage = (index: number) => {
    const imgs = (f.images || []).filter((_, j) => j !== index);
    const removed = f.images[index];
    setF({
      ...f,
      images: imgs,
      hero_image: f.hero_image === removed ? (imgs[0] || "") : f.hero_image,
    });
  };

  const addImg = () => { if (imgInput) { setF({ ...f, images: [...(f.images || []), imgInput], hero_image: f.hero_image || imgInput }); setImgInput(""); } };

  return (
    <div className="p-6 lg:p-8">
      <Link to="/admin/products" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Back to products</Link>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{isEdit ? "Edit product" : "New product"}</h1>

      <form onSubmit={save} className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6" data-testid="product-form">
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-6 space-y-3">
            <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} required />
            <Field label="Short description" value={f.short_description} onChange={(v) => setF({ ...f, short_description: v })} />
            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Full description</Label>
              <textarea rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 grid sm:grid-cols-2 gap-3">
            <Field label="Price" type="number" value={f.price} onChange={(v) => setF({ ...f, price: v })} required />
            <Field label="Discount price (optional)" type="number" value={f.discount_price ?? ""} onChange={(v) => setF({ ...f, discount_price: v })} />
            <Field label="Stock" type="number" value={f.stock} onChange={(v) => setF({ ...f, stock: v })} />
            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Category</Label>
              <Select value={f.category_slug || categories[0]?.slug} onValueChange={(v) => setF({ ...f, category_slug: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <Label className="text-xs text-muted-foreground block mb-2">Available colours</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              <input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="Colour name" className="flex-1 min-w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-9 w-12 rounded border border-input cursor-pointer" />
              <Button type="button" onClick={addColor} variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(f.colors || []).map((c, i) => (
                <span key={i} className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs">
                  <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hex || "#888" }} />
                  {c.name}
                  <button type="button" onClick={() => setF({ ...f, colors: f.colors.filter((_, j) => j !== i), color_variants: f.color_variants.filter((_, j) => j !== i) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <Label className="text-xs text-muted-foreground block mb-2">Product images (first = hero unless set)</Label>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => uploadFiles(e.target.files)} />
            <div className="flex flex-wrap gap-2 mb-3">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
                <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload from computer"}
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(f.images || []).length === 0 ? (
                <p className="col-span-full text-xs text-muted-foreground py-2">No images yet — upload photos above.</p>
              ) : (f.images || []).map((img, i) => (
                <div key={`${img}-${i}`} className="relative rounded-lg overflow-hidden border border-border bg-white dark:bg-zinc-900">
                  <div className="aspect-square flex items-center justify-center p-1">
                    <img src={img} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveImage(i, -1)} className="rounded bg-black/60 text-white p-0.5" disabled={i === 0}><ChevronUp className="h-3 w-3" /></button>
                    <button type="button" onClick={() => moveImage(i, 1)} className="rounded bg-black/60 text-white p-0.5" disabled={i === (f.images?.length || 0) - 1}><ChevronDown className="h-3 w-3" /></button>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    <button type="button" onClick={() => setHero(img)} title="Set as hero" className={`rounded p-0.5 ${f.hero_image === img ? "bg-orange-600 text-white" : "bg-black/60 text-white"}`}><Star className="h-3 w-3" /></button>
                    <button type="button" onClick={() => removeImage(i)} className="rounded bg-black/60 text-white p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                  <div className="text-[10px] text-center py-0.5 bg-muted/80">{i + 1}{f.hero_image === img ? " · Hero" : ""}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <ToggleRow label="Active" value={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} />
            <ToggleRow label="Featured" value={f.featured} onChange={(v) => setF({ ...f, featured: v })} />
          </section>

          <section className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div className="font-display font-semibold text-sm">SEO</div>
            <Field label="SEO title" value={f.seo_title || ""} onChange={(v) => setF({ ...f, seo_title: v })} />
            <div>
              <Label className="text-xs text-muted-foreground block mb-1">SEO description</Label>
              <textarea rows={3} value={f.seo_description || ""} onChange={(e) => setF({ ...f, seo_description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </section>

          <Button type="submit" disabled={busy || uploading} className="w-full bg-orange-600 hover:bg-orange-700" data-testid="save-product-btn">
            {busy ? "Saving…" : isEdit ? "Update product" : "Create product"}
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, ...rest }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground block mb-1">{label}</Label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...rest} />
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
