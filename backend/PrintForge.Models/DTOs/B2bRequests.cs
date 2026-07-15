using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using PrintForge.Models.Entities;

namespace PrintForge.Models.DTOs;

public class B2bCategoryRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Slug { get; set; }

    [JsonPropertyName("parent_id")]
    public string? ParentId { get; set; }

    [JsonPropertyName("short_description")]
    public string ShortDescription { get; set; } = string.Empty;

    [JsonPropertyName("long_description")]
    public string LongDescription { get; set; } = string.Empty;

    public string Banner { get; set; } = string.Empty;

    [JsonPropertyName("cover_image")]
    public string CoverImage { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    [JsonPropertyName("seo_title")]
    public string? SeoTitle { get; set; }

    [JsonPropertyName("seo_description")]
    public string? SeoDescription { get; set; }

    public string Status { get; set; } = "active";

    [JsonPropertyName("display_order")]
    public int DisplayOrder { get; set; }

    public bool Featured { get; set; }

    public string Visibility { get; set; } = "visible";
}

public class B2bProductRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string Sku { get; set; } = string.Empty;
    public string? Slug { get; set; }

    [JsonPropertyName("category_id")]
    public string? CategoryId { get; set; }

    [JsonPropertyName("subcategory_id")]
    public string? SubcategoryId { get; set; }

    public string Brand { get; set; } = string.Empty;
    public string Status { get; set; } = "draft";
    public bool Featured { get; set; }

    [JsonPropertyName("best_seller")]
    public bool BestSeller { get; set; }

    [JsonPropertyName("new_arrival")]
    public bool NewArrival { get; set; }

    [JsonPropertyName("retail_price")]
    public double RetailPrice { get; set; }

    [JsonPropertyName("wholesale_price")]
    public double WholesalePrice { get; set; }

    [JsonPropertyName("dealer_price")]
    public double DealerPrice { get; set; }

    [JsonPropertyName("min_order_qty")]
    public int MinOrderQty { get; set; } = 1;

    [JsonPropertyName("recommended_moq")]
    public int RecommendedMoq { get; set; } = 1;

    [JsonPropertyName("gst_percent")]
    public double GstPercent { get; set; } = 18;

    [JsonPropertyName("discount_percent")]
    public double DiscountPercent { get; set; }

    [JsonPropertyName("offer_price")]
    public double? OfferPrice { get; set; }

    public string Material { get; set; } = string.Empty;
    public string Printer { get; set; } = string.Empty;

    [JsonPropertyName("printing_technology")]
    public string PrintingTechnology { get; set; } = string.Empty;

    [JsonPropertyName("layer_height")]
    public string LayerHeight { get; set; } = string.Empty;

    [JsonPropertyName("nozzle_size")]
    public string NozzleSize { get; set; } = string.Empty;

    public string Infill { get; set; } = string.Empty;

    [JsonPropertyName("weight_g")]
    public double? WeightG { get; set; }

    public string? Dimensions { get; set; }

    [JsonPropertyName("production_time")]
    public string ProductionTime { get; set; } = string.Empty;

    [JsonPropertyName("lead_time")]
    public string LeadTime { get; set; } = string.Empty;

    public string Packaging { get; set; } = string.Empty;

    [JsonPropertyName("country_of_origin")]
    public string CountryOfOrigin { get; set; } = "India";

    public List<B2bColor> Colors { get; set; } = [];
    public B2bCustomization Customization { get; set; } = new();

    [JsonPropertyName("hero_image")]
    public string HeroImage { get; set; } = string.Empty;

    public List<string> Gallery { get; set; } = [];

    [JsonPropertyName("lifestyle_images")]
    public List<string> LifestyleImages { get; set; } = [];

    [JsonPropertyName("white_bg_images")]
    public List<string> WhiteBgImages { get; set; } = [];

    [JsonPropertyName("transparent_images")]
    public List<string> TransparentImages { get; set; } = [];

    [JsonPropertyName("images_360")]
    public List<string> Images360 { get; set; } = [];

    public List<string> Videos { get; set; } = [];
    public string Overview { get; set; } = string.Empty;
    public string Features { get; set; } = string.Empty;
    public string Applications { get; set; } = string.Empty;
    public string Benefits { get; set; } = string.Empty;
    public string Specifications { get; set; } = string.Empty;

    [JsonPropertyName("package_contents")]
    public string PackageContents { get; set; } = string.Empty;

    [JsonPropertyName("care_instructions")]
    public string CareInstructions { get; set; } = string.Empty;

    public List<B2bFaq> Faqs { get; set; } = [];

    [JsonPropertyName("is_visible")]
    public bool IsVisible { get; set; } = true;

    [JsonPropertyName("is_downloadable")]
    public bool IsDownloadable { get; set; } = true;

    [JsonPropertyName("show_price")]
    public bool ShowPrice { get; set; } = true;

    [JsonPropertyName("show_moq")]
    public bool ShowMoq { get; set; } = true;

    [JsonPropertyName("show_lead_time")]
    public bool ShowLeadTime { get; set; } = true;

    public bool Recommended { get; set; }

    [JsonPropertyName("coming_soon")]
    public bool ComingSoon { get; set; }

    [JsonPropertyName("seo_title")]
    public string? SeoTitle { get; set; }

    [JsonPropertyName("seo_description")]
    public string? SeoDescription { get; set; }

    [JsonPropertyName("seo_keywords")]
    public string? SeoKeywords { get; set; }

    [JsonPropertyName("og_image")]
    public string? OgImage { get; set; }

    [JsonPropertyName("twitter_card")]
    public string? TwitterCard { get; set; }

    [JsonPropertyName("canonical_url")]
    public string? CanonicalUrl { get; set; }
}

public class B2bQuoteRequestDto
{
    [Required, JsonPropertyName("business_name")]
    public string BusinessName { get; set; } = string.Empty;

    [Required, JsonPropertyName("owner_name")]
    public string OwnerName { get; set; } = string.Empty;

    [Required]
    public string Phone { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string Gst { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("product_id")]
    public string? ProductId { get; set; }

    [JsonPropertyName("product_name")]
    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; } = 1;
    public string Customization { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class B2bDealerRequest
{
    [Required, JsonPropertyName("company_name")]
    public string CompanyName { get; set; } = string.Empty;

    [Required, JsonPropertyName("owner_name")]
    public string OwnerName { get; set; } = string.Empty;

    [Required]
    public string Phone { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string Gst { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("business_type")]
    public string BusinessType { get; set; } = string.Empty;

    public List<string> Categories { get; set; } = [];

    [JsonPropertyName("monthly_purchase_volume")]
    public string MonthlyPurchaseVolume { get; set; } = string.Empty;
}

public class B2bAnalyticsTrackRequest
{
    [Required, JsonPropertyName("event_type")]
    public string EventType { get; set; } = string.Empty;

    [JsonPropertyName("product_id")]
    public string? ProductId { get; set; }

    [JsonPropertyName("category_id")]
    public string? CategoryId { get; set; }

    public Dictionary<string, object?> Metadata { get; set; } = new();
    public string Device { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

public class B2bSettingsRequest
{
    [JsonPropertyName("company_name")]
    public string? CompanyName { get; set; }

    public string? Tagline { get; set; }

    [JsonPropertyName("whatsapp_number")]
    public string? WhatsappNumber { get; set; }

    [JsonPropertyName("sales_email")]
    public string? SalesEmail { get; set; }

    [JsonPropertyName("sales_phone")]
    public string? SalesPhone { get; set; }

    [JsonPropertyName("catalog_cover_title")]
    public string? CatalogCoverTitle { get; set; }

    [JsonPropertyName("default_pdf_template")]
    public string? DefaultPdfTemplate { get; set; }

    [JsonPropertyName("show_dealer_price_public")]
    public bool? ShowDealerPricePublic { get; set; }

    [JsonPropertyName("hero_image")]
    public string? HeroImage { get; set; }
}

public class B2bCatalogExportRequest
{
    /// <summary>single | selection | category | featured | complete</summary>
    public string Mode { get; set; } = "complete";

    [JsonPropertyName("product_ids")]
    public List<string>? ProductIds { get; set; }

    [JsonPropertyName("category_id")]
    public string? CategoryId { get; set; }

    public string Template { get; set; } = "modern";
}
