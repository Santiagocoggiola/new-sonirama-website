using Sonirama.Api.Application.Products.Discounts.Dtos;

namespace Sonirama.Api.Application.Products.Discounts;

public interface IBulkDiscountService
{
    Task<IReadOnlyList<BulkDiscountDto>> ListByProductAsync(Guid productId, CancellationToken ct);
    Task<BulkDiscountDto> CreateAsync(Guid productId, BulkDiscountCreateRequest request, CancellationToken ct);
    Task<BulkDiscountDto> UpdateAsync(Guid id, BulkDiscountUpdateRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}
