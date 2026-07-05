import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CSV_FIELDS = [
  "name", "slug", "category_slug", "material", "price", "discount_price",
  "stock", "weight_g", "dimensions", "print_time_hours",
  "color_variants", "images", "tags", "featured", "is_active",
  "short_description", "description", "seo_title", "seo_description",
];

const MANUAL_FIELDS = ["images (upload via product edit)", "color_variants (optional, pipe-separated in sheet)"];

interface ImportResult {
  created: number;
  updated: number;
  errors: { row?: number; error?: string }[];
}

interface Props {
  onDone: () => void;
}

/** Bulk product import/export dialog — CSV or Excel upload; images added manually after import. */
export default function ProductBulkImport({ onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = async () => {
    try {
      const { data } = await api.get("/admin/products/export/template", { responseType: "blob" });
      downloadBlob(data, "newjourney-product-import-template.csv");
    } catch (e) { toast.error(apiError(e)); }
  };

  const exportCatalog = async () => {
    try {
      const { data } = await api.get("/admin/products/export", { responseType: "blob" });
      downloadBlob(data, `newjourney-products-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("Catalog exported");
    } catch (e) { toast.error(apiError(e)); }
  };

  const parseFile = async (file: File): Promise<Record<string, string>[]> => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".txt")) {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return [];
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      return lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
        return row;
      });
    }

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
      return json.map((row) => {
        const normalized: Record<string, string> = {};
        Object.entries(row).forEach(([k, v]) => {
          normalized[k.trim().toLowerCase().replace(/\s+/g, "_")] = String(v ?? "").trim();
        });
        return normalized;
      });
    }

    throw new Error("Use CSV or Excel (.xlsx) file");
  };

  const upload = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const rows = await parseFile(file);
      const valid = rows.filter((r) => r.name?.trim());
      if (valid.length === 0) throw new Error("No product rows found — ensure a header row and at least one name");

      const { data } = await api.post("/admin/products/import-rows", { rows: valid });
      setResult(data);
      toast.success(`Import done: ${data.created} created, ${data.updated} updated`);
      onDone();
    } catch (e) { toast.error(apiError(e)); }
    finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="admin-bulk-import-btn">
          <FileSpreadsheet className="h-4 w-4" /> Bulk import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk product import / export</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> How it works</div>
            <p>Upload a spreadsheet with product data. Match products by <strong>slug</strong> — existing slugs are updated, new ones are created.</p>
            <p><strong>In spreadsheet:</strong> {CSV_FIELDS.slice(0, 8).join(", ")}, …</p>
            <p><strong>Add manually after import:</strong> {MANUAL_FIELDS.join("; ")}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5" /> Download template
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={exportCatalog}>
              <Download className="h-3.5 w-3.5" /> Export catalog
            </Button>
          </div>

          <label
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-orange-500 transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files[0]); }}
          >
            <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" hidden onChange={(e) => upload(e.target.files?.[0])} />
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="font-medium">{busy ? "Importing…" : "Drop CSV or Excel here"}</div>
            <div className="text-xs text-muted-foreground mt-1">.csv · .xlsx · .xls</div>
          </label>

          {result && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {result.created} created · {result.updated} updated
                {result.errors?.length ? ` · ${result.errors.length} errors` : ""}
              </div>
              {result.errors?.length > 0 && (
                <ul className="text-xs text-red-600 max-h-24 overflow-y-auto">
                  {result.errors.slice(0, 8).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
