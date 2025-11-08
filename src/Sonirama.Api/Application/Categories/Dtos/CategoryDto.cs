namespace Sonirama.Api.Application.Categories.Dtos;

// Read DTO for Category including parent ids and child ids.
public sealed class CategoryDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = default!;
    public string Slug { get; init; } = default!;
    public string? Description { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? UpdatedAtUtc { get; init; }
    public IReadOnlyList<Guid> ParentIds { get; init; } = Array.Empty<Guid>();
    public IReadOnlyList<Guid> ChildIds { get; init; } = Array.Empty<Guid>();
}
