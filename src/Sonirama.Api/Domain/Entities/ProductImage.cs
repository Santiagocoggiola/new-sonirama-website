namespace Sonirama.Api.Domain.Entities;

public sealed class ProductImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;
    public string FileName { get; set; } = default!;
    public string RelativePath { get; set; } = default!;
    public string Url { get; set; } = default!;
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
}
