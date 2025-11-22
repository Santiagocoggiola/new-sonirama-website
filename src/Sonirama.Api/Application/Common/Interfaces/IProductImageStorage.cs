using Microsoft.AspNetCore.Http;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

public interface IProductImageStorage
{
    Task<ProductImage> SaveAsync(string productCode, IFormFile file, CancellationToken ct);
    Task DeleteAsync(ProductImage image, CancellationToken ct);
}
