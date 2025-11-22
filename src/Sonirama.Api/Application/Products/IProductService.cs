using Microsoft.AspNetCore.Http;
using Sonirama.Api.Application.Products.Dtos;
using Sonirama.Api.Application.Common.Dtos; // PagedResult
using System.Collections.Generic;

namespace Sonirama.Api.Application.Products;

public interface IProductService
{
    Task<ProductDto> CreateAsync(ProductCreateRequest request, CancellationToken ct);
    Task<ProductDto> UpdateAsync(Guid id, ProductUpdateRequest request, CancellationToken ct);
    Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct);
    Task<ProductDto> GetByCodeAsync(string code, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
    Task<PagedResult<ProductDto>> ListAsync(ProductFilterRequest filter, CancellationToken ct);
    Task<IReadOnlyList<ProductImageDto>> UploadImagesAsync(Guid productId, IEnumerable<IFormFile> files, CancellationToken ct);
    Task DeleteImageAsync(Guid productId, Guid imageId, CancellationToken ct);
}
