using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Dtos; // PagedResult
using Sonirama.Api.Application.Common.Models; // ProductListFilter
using Sonirama.Api.Application.Products.Dtos;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Application.Common.Exceptions;
using System.Collections.Generic;
using System.Linq;

namespace Sonirama.Api.Application.Products;

public sealed class ProductService : IProductService
{
    private const string NotFoundMessage = "Producto no encontrado.";
    private const string ImageNotFoundMessage = "Imagen no encontrada.";
    private const int MaxImagesPerUpload = 10;
    private readonly IProductRepository _productRepo;
    private readonly IProductImageRepository _imageRepo;
    private readonly IProductImageStorage _imageStorage;
    private readonly ICategoryRepository _categoryRepo;
    private readonly IMapper _mapper;

    public ProductService(
        IProductRepository productRepo,
        IBulkDiscountRepository discountRepo,
        IProductImageRepository imageRepo,
        IProductImageStorage imageStorage,
        ICategoryRepository categoryRepo,
        IMapper mapper)
    {
        _productRepo = productRepo;
        _imageRepo = imageRepo;
        _imageStorage = imageStorage;
        _categoryRepo = categoryRepo;
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
            Description = request.Description?.Trim(),
            Category = request.Category?.Trim(),
            Price = request.Price,
            Currency = request.Currency,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        await SyncProductCategoriesAsync(product, request.CategoryIds, request.Category, ct);

        await _productRepo.AddAsync(product, ct);
        await AddImagesAsync(product, request.Images, ct);

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
        product.IsActive = request.IsActive;
        product.UpdatedAtUtc = DateTime.UtcNow;

        await SyncProductCategoriesAsync(product, request.CategoryIds, request.Category, ct);

        await _productRepo.UpdateAsync(product, ct);
        await AddImagesAsync(product, request.Images, ct);
        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var product = await _productRepo.GetByIdAsync(id, ct) ?? throw new NotFoundException(NotFoundMessage);
        var dto = _mapper.Map<ProductDto>(product);
        await EnrichCategoryInfoAsync(dto, ct);
        return dto;
    }

    public async Task<ProductDto> GetByCodeAsync(string code, CancellationToken ct)
    {
        var product = await _productRepo.GetByCodeAsync(code, ct) ?? throw new NotFoundException(NotFoundMessage);
        var dto = _mapper.Map<ProductDto>(product);
        await EnrichCategoryInfoAsync(dto, ct);
        return dto;
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
            CategoryIds = filter.CategoryIds,
            PriceMin = filter.PriceMin,
            PriceMax = filter.PriceMax,
            IsActive = filter.IsActive,
            SortBy = filter.SortBy,
            SortDir = filter.SortDir
        };
        var page = await _productRepo.ListAsync(repoFilter, ct);
        var items = page.Items.Select(_mapper.Map<ProductDto>).ToList();
        foreach (var item in items)
        {
            await EnrichCategoryInfoAsync(item, ct);
        }

        return new PagedResult<ProductDto>
        {
            Page = page.Page,
            PageSize = page.PageSize,
            TotalCount = page.TotalCount,
            Items = items
        };
    }

    public async Task<IReadOnlyList<ProductImageDto>> UploadImagesAsync(Guid productId, IEnumerable<IFormFile> files, CancellationToken ct)
    {
        var product = await _productRepo.GetByIdAsync(productId, ct) ?? throw new NotFoundException(NotFoundMessage);
        var added = await AddImagesAsync(product, files, ct);
        return added.Select(_mapper.Map<ProductImageDto>).ToList();
    }

    public async Task DeleteImageAsync(Guid productId, Guid imageId, CancellationToken ct)
    {
        var product = await _productRepo.GetByIdAsync(productId, ct) ?? throw new NotFoundException(NotFoundMessage);
        var image = await _imageRepo.GetByIdAsync(imageId, ct) ?? throw new NotFoundException(ImageNotFoundMessage);

        if (image.ProductId != product.Id)
        {
            throw new NotFoundException(ImageNotFoundMessage);
        }

        await _imageStorage.DeleteAsync(image, ct);
        await _imageRepo.RemoveAsync(image, ct);
    }

    private async Task<IReadOnlyList<ProductImage>> AddImagesAsync(Product product, IEnumerable<IFormFile>? files, CancellationToken ct)
    {
        var fileList = files?.Where(f => f is not null).ToList() ?? new List<IFormFile>();

        if (fileList.Count == 0)
        {
            return Array.Empty<ProductImage>();
        }

        if (fileList.Count > MaxImagesPerUpload)
        {
            throw new ValidationException($"Solo puedes subir hasta {MaxImagesPerUpload} imágenes por solicitud.");
        }

        var storedImages = new List<ProductImage>(fileList.Count);

        foreach (var file in fileList)
        {
            var stored = await _imageStorage.SaveAsync(product.Code, file, ct);
            stored.ProductId = product.Id;
            storedImages.Add(stored);
        }

        await _imageRepo.AddRangeAsync(storedImages, ct);

        if (product.Images == null)
        {
            product.Images = new List<ProductImage>();
        }

        foreach (var stored in storedImages)
        {
            product.Images.Add(stored);
        }

        return storedImages;
    }

    private async Task SyncProductCategoriesAsync(Product product, IEnumerable<Guid>? categoryIds, string? categoryValue, CancellationToken ct)
    {
        if (categoryIds is not null && categoryIds.Any())
        {
            var categories = await _categoryRepo.ListAsync(new CategoryListFilter { Page = 1, PageSize = 2000, IsActive = true }, ct);
            var allowed = new HashSet<Guid>(categories.Items.Select(c => c.Id));
            var selected = categoryIds.Where(id => allowed.Contains(id)).Distinct().ToList();

            if (selected.Count == 0)
            {
                product.Category = null;
                product.ProductsLink.Clear();
                return;
            }

            var firstCategory = categories.Items.First(c => c.Id == selected[0]);
            product.Category = firstCategory.Name;
            product.ProductsLink.Clear();
            foreach (var id in selected)
            {
                product.ProductsLink.Add(new ProductCategory
                {
                    ProductId = product.Id,
                    CategoryId = id
                });
            }
            return;
        }

        if (!string.IsNullOrWhiteSpace(categoryValue) && Guid.TryParse(categoryValue, out var categoryId))
        {
            var category = await _categoryRepo.GetByIdAsync(categoryId, ct);
            if (category is null)
            {
                throw new ValidationException("Categoría no encontrada.");
            }

            product.Category = category.Name;
            product.ProductsLink.Clear();
            product.ProductsLink.Add(new ProductCategory
            {
                ProductId = product.Id,
                CategoryId = category.Id
            });
            return;
        }

        product.ProductsLink.Clear();
    }

    private async Task EnrichCategoryInfoAsync(ProductDto dto, CancellationToken ct)
    {
        if (dto.Categories is { Count: > 0 })
        {
            return;
        }

        if (!string.IsNullOrWhiteSpace(dto.Category))
        {
            if (Guid.TryParse(dto.Category, out var categoryId))
            {
                var category = await _categoryRepo.GetByIdAsync(categoryId, ct);
                if (category != null)
                {
                    dto.Category = category.Name;
                    dto.Categories = new List<ProductCategoryDto>
                    {
                        new() { Id = category.Id, Name = category.Name }
                    };
                }
                return;
            }

            dto.Categories = new List<ProductCategoryDto>
            {
                new() { Id = Guid.Empty, Name = dto.Category }
            };
        }
    }
}
