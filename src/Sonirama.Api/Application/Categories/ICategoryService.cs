using Sonirama.Api.Application.Categories.Dtos;
using Sonirama.Api.Application.Common.Dtos;

namespace Sonirama.Api.Application.Categories;

// Service contract for Category domain logic.
public interface ICategoryService
{
    Task<CategoryDto> CreateAsync(CategoryCreateRequest request, CancellationToken ct);
    Task<CategoryDto> UpdateAsync(Guid id, CategoryUpdateRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
    Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<PagedResult<CategoryDto>> ListAsync(CategoryFilterRequest filter, CancellationToken ct);
}
