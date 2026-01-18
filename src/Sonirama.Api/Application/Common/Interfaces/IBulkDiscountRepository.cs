using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

// Repository abstraction for bulk discounts.
public interface IBulkDiscountRepository
{
    Task<IReadOnlyList<BulkDiscount>> GetByProductAsync(Guid productId, CancellationToken ct);
    Task<PagedResult<BulkDiscount>> GetByProductPagedAsync(Guid productId, int page, int pageSize, CancellationToken ct);
    Task<BulkDiscount?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(BulkDiscount discount, CancellationToken ct);
    Task UpdateAsync(BulkDiscount discount, CancellationToken ct);
    Task DeleteAsync(BulkDiscount discount, CancellationToken ct);
}
