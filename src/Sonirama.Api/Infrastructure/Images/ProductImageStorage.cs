using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Images;

public sealed class ProductImageStorage(IWebHostEnvironment environment) : IProductImageStorage
{
    private static readonly string[] AllowedContentTypes =
    [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    private static readonly WebpEncoder DefaultWebpEncoder = new()
    {
        Quality = 80
    };

    private readonly IWebHostEnvironment _environment = environment;

    public async Task<ProductImage> SaveAsync(string productCode, IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            throw new ValidationException("La imagen está vacía.");
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            throw new ValidationException("Formato de imagen no soportado. Usa JPG, PNG o WEBP.");
        }

        var sanitizedCode = SanitizeSegment(productCode);
        var needsWebpConversion = NeedsWebpConversion(file);
        var extension = needsWebpConversion ? ".webp" : ResolveExtension(file);

        var fileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{extension}";
        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }

        var productFolder = Path.Combine(webRoot, "images", "products", sanitizedCode);
        Directory.CreateDirectory(productFolder);
        var filePath = Path.Combine(productFolder, fileName);

        if (needsWebpConversion)
        {
            await SaveAsWebpAsync(file, filePath, ct);
        }
        else
        {
            await using var stream = File.Create(filePath);
            await file.CopyToAsync(stream, ct);
        }

        var relativePath = Path.Combine("images", "products", sanitizedCode, fileName).Replace("\\", "/");
        var url = string.Concat(Path.AltDirectorySeparatorChar, relativePath);

        return new ProductImage
        {
            FileName = fileName,
            RelativePath = relativePath,
            Url = url,
            UploadedAtUtc = DateTime.UtcNow
        };
    }

    public Task DeleteAsync(ProductImage image, CancellationToken ct)
    {
        if (image is null) return Task.CompletedTask;
        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }
        var absolutePath = Path.Combine(webRoot, image.RelativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (File.Exists(absolutePath))
        {
            File.Delete(absolutePath);
        }

        return Task.CompletedTask;
    }

    private static string SanitizeSegment(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "unknown";
        }

        var normalized = value.Trim().ToLowerInvariant();
        normalized = Regex.Replace(normalized, "[^a-z0-9-_]", "-");
        normalized = Regex.Replace(normalized, "-+", "-");
        return normalized.Trim('-');
    }

    private static bool NeedsWebpConversion(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName);
        var contentType = file.ContentType?.ToLowerInvariant();
        return !(string.Equals(ext, ".webp", StringComparison.OrdinalIgnoreCase) || contentType == "image/webp");
    }

    private static string ResolveExtension(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        if (!string.IsNullOrWhiteSpace(extension))
        {
            return extension.StartsWith('.') ? extension : $".{extension}";
        }

        return file.ContentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".img"
        };
    }

    private static async Task SaveAsWebpAsync(IFormFile file, string destinationPath, CancellationToken ct)
    {
        await using var destinationStream = File.Create(destinationPath);
        await using var sourceStream = file.OpenReadStream();
        using var image = await Image.LoadAsync(sourceStream, ct);
        await image.SaveAsWebpAsync(destinationStream, DefaultWebpEncoder, ct);
    }
}
