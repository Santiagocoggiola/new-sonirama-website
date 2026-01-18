using AutoMapper;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Products.Discounts.Dtos;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Products.Discounts;

public sealed class BulkDiscountService(
    IProductRepository productRepo,
    IBulkDiscountRepository discountRepo,
    IMapper mapper) : IBulkDiscountService
{
    public async Task<PagedResult<BulkDiscountDto>> ListByProductAsync(Guid productId, BulkDiscountListRequest request, CancellationToken ct)
    {
        // Ensure product exists
        _ = await productRepo.GetByIdAsync(productId, ct) ?? throw new NotFoundException("Producto no encontrado.");
        var page = await discountRepo.GetByProductPagedAsync(productId, request.Page, request.PageSize, ct);
        return new PagedResult<BulkDiscountDto>
        {
            Page = page.Page,
            PageSize = page.PageSize,
            TotalCount = page.TotalCount,
            Items = page.Items.Select(mapper.Map<BulkDiscountDto>).ToList()
        };
    }

    public async Task<BulkDiscountDto> CreateAsync(Guid productId, BulkDiscountCreateRequest request, CancellationToken ct)
    {
        var product = await productRepo.GetByIdAsync(productId, ct) ?? throw new NotFoundException("Producto no encontrado.");
        // rule: no same MinQuantity for the same product
        var existing = await discountRepo.GetByProductAsync(productId, ct);
        if (existing.Any(d => d.MinQuantity == request.MinQuantity))
            throw new ConflictException($"Ya existe un descuento para cantidad mínima {request.MinQuantity}.");

        var entity = new BulkDiscount
        {
            ProductId = product.Id,
            MinQuantity = request.MinQuantity,
            DiscountPercent = request.DiscountPercent,
            StartsAtUtc = request.StartsAt,
            EndsAtUtc = request.EndsAt,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow
        };
        await discountRepo.AddAsync(entity, ct);
        return mapper.Map<BulkDiscountDto>(entity);
    }

    public async Task<BulkDiscountDto> UpdateAsync(Guid id, BulkDiscountUpdateRequest request, CancellationToken ct)
    {
        var entity = await discountRepo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Descuento no encontrado.");
        var siblings = await discountRepo.GetByProductAsync(entity.ProductId, ct);
        if (siblings.Any(d => d.Id != id && d.MinQuantity == request.MinQuantity))
            throw new ConflictException($"Ya existe un descuento para cantidad mínima {request.MinQuantity}.");

    entity.MinQuantity = request.MinQuantity;
    entity.DiscountPercent = request.DiscountPercent;
    entity.StartsAtUtc = request.StartsAt;
    entity.EndsAtUtc = request.EndsAt;
    entity.IsActive = request.IsActive;
    entity.UpdatedAtUtc = DateTime.UtcNow;
        await discountRepo.UpdateAsync(entity, ct);
        return mapper.Map<BulkDiscountDto>(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var entity = await discountRepo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Descuento no encontrado.");
        await discountRepo.DeleteAsync(entity, ct);
    }
}
