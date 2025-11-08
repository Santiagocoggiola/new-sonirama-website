using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

// Repository abstraction for products.
public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Product?> GetByCodeAsync(string code, CancellationToken ct);
    Task<bool> ExistsAsync(string code, CancellationToken ct);
    Task<PagedResult<Product>> ListAsync(ProductListFilter filter, CancellationToken ct);
    Task AddAsync(Product product, CancellationToken ct);
    Task UpdateAsync(Product product, CancellationToken ct);
    Task DeleteAsync(Product product, CancellationToken ct); // soft delete
}
