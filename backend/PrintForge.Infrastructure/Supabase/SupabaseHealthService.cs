using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Options;
using PrintForge.Infrastructure.Configuration;

namespace PrintForge.Infrastructure.Supabase;

/// <summary>Verifies Supabase REST connectivity using the publishable API key.</summary>
public class SupabaseHealthService(IHttpClientFactory httpClientFactory, IOptions<AppSettings> settings)
{
    public async Task<SupabaseHealthResult> CheckAsync(CancellationToken cancellationToken = default)
    {
        var cfg = settings.Value;
        if (string.IsNullOrWhiteSpace(cfg.SupabaseUrl) || string.IsNullOrWhiteSpace(cfg.SupabasePublishableKey))
        {
            return new SupabaseHealthResult(false, "SupabaseUrl or SupabasePublishableKey is not configured");
        }

        var baseUrl = cfg.SupabaseUrl.TrimEnd('/');
        var requestUri = $"{baseUrl}/rest/v1/modules?select=module_id&limit=1";

        using var client = httpClientFactory.CreateClient(nameof(SupabaseHealthService));
        using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        request.Headers.Add("apikey", cfg.SupabasePublishableKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cfg.SupabasePublishableKey);

        try
        {
            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                return new SupabaseHealthResult(false, $"Supabase REST returned {(int)response.StatusCode}: {body}");
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var moduleCount = document.RootElement.ValueKind == JsonValueKind.Array
                ? document.RootElement.GetArrayLength()
                : 0;

            return new SupabaseHealthResult(true, null, moduleCount);
        }
        catch (Exception ex)
        {
            return new SupabaseHealthResult(false, ex.Message);
        }
    }
}

public sealed record SupabaseHealthResult(bool Ok, string? Error, int SampleModuleCount = 0);
