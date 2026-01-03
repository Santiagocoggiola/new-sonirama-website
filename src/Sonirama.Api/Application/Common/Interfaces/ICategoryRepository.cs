using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Categories.Dtos;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

// Repository abstraction for categories with recursive relations.
public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<bool> ExistsBySlugAsync(string slug, CancellationToken ct);
    Task<bool> ExistsByNameAsync(string name, CancellationToken ct);
    Task<PagedResult<Category>> ListAsync(CategoryListFilter filter, CancellationToken ct);
    Task AddAsync(Category category, IEnumerable<Guid> parentIds, CancellationToken ct);
    Task UpdateAsync(Category category, IEnumerable<Guid> parentIds, CancellationToken ct);
    Task DeleteAsync(Category category, CancellationToken ct); // soft delete
    Task PurgeAsync(Category category, CancellationToken ct); // hard delete

    // Hierarchy helpers
    Task<IReadOnlyList<Guid>> GetDescendantIdsAsync(Guid categoryId, CancellationToken ct);
}
