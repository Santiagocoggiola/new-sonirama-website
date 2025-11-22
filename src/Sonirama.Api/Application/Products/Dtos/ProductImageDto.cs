namespace Sonirama.Api.Application.Products.Dtos;

public sealed class ProductImageDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string FileName { get; init; } = default!;
    public string RelativePath { get; init; } = default!;
    public string Url { get; init; } = default!;
    public DateTime UploadedAtUtc { get; init; }
}
