using System.Collections.Generic;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

public interface IProductImageRepository
{
    Task AddRangeAsync(IEnumerable<ProductImage> images, CancellationToken ct);
    Task<ProductImage?> GetByIdAsync(Guid imageId, CancellationToken ct);
    Task<IReadOnlyList<ProductImage>> GetByProductIdAsync(Guid productId, CancellationToken ct);
    Task RemoveAsync(ProductImage image, CancellationToken ct);
}
