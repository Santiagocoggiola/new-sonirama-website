using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Dtos; // PagedResult
using Sonirama.Api.Application.Common.Models; // ProductListFilter
using Sonirama.Api.Application.Products.Dtos;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Application.Common.Exceptions;

namespace Sonirama.Api.Application.Products;

public sealed class ProductService : IProductService
{
    private const string NotFoundMessage = "Producto no encontrado.";
    private readonly IProductRepository _productRepo;
    private readonly IMapper _mapper;

    public ProductService(IProductRepository productRepo, IBulkDiscountRepository discountRepo, IMapper mapper)
    {
        _productRepo = productRepo;
        _mapper = mapper;
        // discountRepo reservado para futura lógica (no usado aún)
        _ = discountRepo;
    }
    public async Task<ProductDto> CreateAsync(ProductCreateRequest request, CancellationToken ct)
    {
        if (await _productRepo.ExistsAsync(request.Code, ct))
            throw new ConflictException($"Ya existe un producto con el código '{request.Code}'.");

        var product = new Product
        {
            Code = request.Code.Trim(),
            Name = request.Name.Trim(),
            Category = request.Category?.Trim(),
            Price = request.Price,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        await _productRepo.AddAsync(product, ct);
        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, ProductUpdateRequest request, CancellationToken ct)
    {
    var product = await _productRepo.GetByIdAsync(id, ct) ?? throw new NotFoundException(NotFoundMessage);

        // Código es inmutable; actualizamos resto de propiedades.
        product.Name = request.Name.Trim();
        product.Description = request.Description?.Trim();
        product.Category = request.Category?.Trim();
        product.Price = request.Price;
        product.Currency = request.Currency;
        product.StockQuantity = request.StockQuantity;
        product.IsActive = request.IsActive;
        product.UpdatedAtUtc = DateTime.UtcNow;

        await _productRepo.UpdateAsync(product, ct);
        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var product = await _productRepo.GetByIdAsync(id, ct) ?? throw new NotFoundException(NotFoundMessage);
        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> GetByCodeAsync(string code, CancellationToken ct)
    {
        var product = await _productRepo.GetByCodeAsync(code, ct) ?? throw new NotFoundException(NotFoundMessage);
        return _mapper.Map<ProductDto>(product);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var product = await _productRepo.GetByIdAsync(id, ct) ?? throw new NotFoundException(NotFoundMessage);
        await _productRepo.DeleteAsync(product, ct);
    }

    public async Task<PagedResult<ProductDto>> ListAsync(ProductFilterRequest filter, CancellationToken ct)
    {
        var repoFilter = new ProductListFilter
        {
            Page = filter.Page,
            PageSize = filter.PageSize,
            Query = filter.Query,
            Category = filter.Category,
            PriceMin = filter.PriceMin,
            PriceMax = filter.PriceMax,
            IsActive = filter.IsActive,
            SortBy = filter.SortBy,
            SortDir = filter.SortDir
        };
        var page = await _productRepo.ListAsync(repoFilter, ct);
        return new PagedResult<ProductDto>
        {
            Page = page.Page,
            PageSize = page.PageSize,
            TotalCount = page.TotalCount,
            Items = page.Items.Select(_mapper.Map<ProductDto>).ToList()
        };
    }
}
