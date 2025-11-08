namespace Sonirama.Api.Domain.Entities;

// Join entity representing parent-child relation between categories (self-referencing many-to-many).
public sealed class CategoryRelation
{
    public Guid ParentId { get; set; }
    public Category Parent { get; set; } = default!;

    public Guid ChildId { get; set; }
    public Category Child { get; set; } = default!;
}
