using System.Text.Json.Serialization;

namespace PrintForge.Models.Entities;

/// <summary>B2B catalog color variant with optional hex preview.</summary>
public class B2bColor
{
    public string Name { get; set; } = string.Empty;
    public string Hex { get; set; } = "#000000";
    public string Preview { get; set; } = string.Empty;
}

/// <summary>B2B product customization toggles.</summary>
public class B2bCustomization
{
    public bool CustomLogo { get; set; }
    public bool CustomName { get; set; }
    public bool CustomText { get; set; }
    public bool UploadImage { get; set; }
    public bool BusinessBranding { get; set; }
    public bool PrivateLabel { get; set; }
    public bool PackagingBranding { get; set; }
}

/// <summary>FAQ entry on a B2B product.</summary>
public class B2bFaq
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

/// <summary>Nested B2B category — independent of retail categories.</summary>
public class B2bCategory
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ParentId { get; set; }
    public string ShortDescription { get; set; } = string.Empty;
    public string LongDescription { get; set; } = string.Empty;
    public string Banner { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string Status { get; set; } = "active";
    public int DisplayOrder { get; set; }
    public bool Featured { get; set; }
    public string Visibility { get; set; } = "visible";
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

/// <summary>Wholesale/B2B catalog product — separate from retail products.</summary>
public class B2bProduct
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public string? SubcategoryId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Status { get; set; } = "draft";
    public bool Featured { get; set; }
    public bool BestSeller { get; set; }
    public bool NewArrival { get; set; }
    public double RetailPrice { get; set; }
    public double WholesalePrice { get; set; }
    public double DealerPrice { get; set; }
    public int MinOrderQty { get; set; } = 1;
    public int RecommendedMoq { get; set; } = 1;
    public double GstPercent { get; set; } = 18;
    public double DiscountPercent { get; set; }
    public double? OfferPrice { get; set; }
    public string Material { get; set; } = string.Empty;
    public string Printer { get; set; } = string.Empty;
    public string PrintingTechnology { get; set; } = string.Empty;
    public string LayerHeight { get; set; } = string.Empty;
    public string NozzleSize { get; set; } = string.Empty;
    public string Infill { get; set; } = string.Empty;
    public double? WeightG { get; set; }
    public string? Dimensions { get; set; }
    public string ProductionTime { get; set; } = string.Empty;
    public string LeadTime { get; set; } = string.Empty;
    public string Packaging { get; set; } = string.Empty;
    public string CountryOfOrigin { get; set; } = "India";
    public List<B2bColor> Colors { get; set; } = [];
    public B2bCustomization Customization { get; set; } = new();
    public string HeroImage { get; set; } = string.Empty;
    public List<string> Gallery { get; set; } = [];
    public List<string> LifestyleImages { get; set; } = [];
    public List<string> WhiteBgImages { get; set; } = [];
    public List<string> TransparentImages { get; set; } = [];
    [JsonPropertyName("images_360")]
    public List<string> Images360 { get; set; } = [];
    public List<string> Videos { get; set; } = [];
    public string Overview { get; set; } = string.Empty;
    public string Features { get; set; } = string.Empty;
    public string Applications { get; set; } = string.Empty;
    public string Benefits { get; set; } = string.Empty;
    public string Specifications { get; set; } = string.Empty;
    public string PackageContents { get; set; } = string.Empty;
    public string CareInstructions { get; set; } = string.Empty;
    public List<B2bFaq> Faqs { get; set; } = [];
    public bool IsVisible { get; set; } = true;
    public bool IsDownloadable { get; set; } = true;
    public bool ShowPrice { get; set; } = true;
    public bool ShowMoq { get; set; } = true;
    public bool ShowLeadTime { get; set; } = true;
    public bool Recommended { get; set; }
    public bool ComingSoon { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SeoKeywords { get; set; }
    public string? OgImage { get; set; }
    public string? TwitterCard { get; set; }
    public string? CanonicalUrl { get; set; }
    public long ViewsCount { get; set; }
    public long DownloadsCount { get; set; }
    public long QuoteRequestsCount { get; set; }
    public long SharesCount { get; set; }
    public long WhatsappClicksCount { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class B2bQuoteRequest
{
    public string Id { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Gst { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public string Customization { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string AdminNotes { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class B2bDealer
{
    public string Id { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Gst { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string BusinessType { get; set; } = string.Empty;
    public List<string> Categories { get; set; } = [];
    public string MonthlyPurchaseVolume { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string AdminNotes { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class B2bAnalyticsEvent
{
    public string Id { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string? ProductId { get; set; }
    public string? CategoryId { get; set; }
    public Dictionary<string, object?> Metadata { get; set; } = new();
    public string Device { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string IpHash { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class B2bSettings
{
    public string Id { get; set; } = "default";
    public string CompanyName { get; set; } = "New Journey Studio";
    public string Tagline { get; set; } = "Bulk Manufacturing & Wholesale 3D Printing Solutions";
    public string WhatsappNumber { get; set; } = string.Empty;
    public string SalesEmail { get; set; } = string.Empty;
    public string SalesPhone { get; set; } = string.Empty;
    public string CatalogCoverTitle { get; set; } = "Wholesale Catalog";
    public string DefaultPdfTemplate { get; set; } = "modern";
    public bool ShowDealerPricePublic { get; set; }
    public string HeroImage { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}
