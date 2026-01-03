namespace Sonirama.Api.Application.Categories.Dtos;

// Update request for Category.
public sealed class CategoryUpdateRequest
{
    public string Name { get; set; } = default!;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public List<Guid> ParentIds { get; set; } = new();
}
