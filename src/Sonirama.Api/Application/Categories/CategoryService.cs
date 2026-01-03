using System;
using System.Linq;
using AutoMapper;
using Sonirama.Api.Application.Categories.Dtos;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;

namespace Sonirama.Api.Application.Categories;

// Concrete Category service enforcing uniqueness and hierarchy rules.
public sealed class CategoryService(ICategoryRepository repo, IMapper mapper) : ICategoryService
{
    private const string NotFoundMessage = "Categoría no encontrada";

    public async Task<CategoryDto> CreateAsync(CategoryCreateRequest request, CancellationToken ct)
    {
        request.Name = request.Name?.Trim() ?? string.Empty;
        request.Slug = NormalizeSlug(request.Slug, request.Name);
        request.Description = request.Description?.Trim();

        if (await repo.ExistsBySlugAsync(request.Slug, ct)) throw new ConflictException("Slug duplicado");
        if (await repo.ExistsByNameAsync(request.Name, ct)) throw new ConflictException("Nombre duplicado");

        var entity = mapper.Map<Domain.Entities.Category>(request);
        entity.CreatedAtUtc = DateTime.UtcNow;
        var parentIds = request.ParentIds ?? Enumerable.Empty<Guid>();
        await repo.AddAsync(entity, parentIds, ct);
        return mapper.Map<CategoryDto>(entity);
    }

    public async Task<CategoryDto> UpdateAsync(Guid id, CategoryUpdateRequest request, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException(NotFoundMessage);
        request.Name = request.Name?.Trim() ?? string.Empty;
        request.Slug = NormalizeSlug(request.Slug, request.Name);
        request.Description = request.Description?.Trim();

        if (entity.Slug != request.Slug && await repo.ExistsBySlugAsync(request.Slug, ct)) throw new ConflictException("Slug duplicado");
        if (entity.Name != request.Name && await repo.ExistsByNameAsync(request.Name, ct)) throw new ConflictException("Nombre duplicado");

        // Prevent cycles: ensure none of parentIds is a descendant.
        if (request.ParentIds?.Any() == true)
        {
            var descendants = await repo.GetDescendantIdsAsync(entity.Id, ct);
            var cycle = request.ParentIds.Intersect(descendants).FirstOrDefault();
            if (cycle != Guid.Empty) throw new ValidationException("Asignación de padre crea ciclo");
        }

        mapper.Map(request, entity);
        entity.UpdatedAtUtc = DateTime.UtcNow;
        var parentIds = request.ParentIds ?? Enumerable.Empty<Guid>();
        await repo.UpdateAsync(entity, parentIds, ct);
        return mapper.Map<CategoryDto>(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException(NotFoundMessage);
        await repo.PurgeAsync(entity, ct);
    }

    public async Task<CategoryDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException(NotFoundMessage);
        return mapper.Map<CategoryDto>(entity);
    }

    public async Task<PagedResult<CategoryDto>> ListAsync(CategoryFilterRequest filter, CancellationToken ct)
    {
        var listFilter = new CategoryListFilter
        {
            Page = filter.Page,
            PageSize = filter.PageSize,
            Query = filter.Query,
            IsActive = filter.IsActive,
            SortBy = filter.SortBy,
            SortDir = filter.SortDir
        };
        var page = await repo.ListAsync(listFilter, ct);
        return new PagedResult<CategoryDto>
        {
            Page = page.Page,
            PageSize = page.PageSize,
            TotalCount = page.TotalCount,
            Items = page.Items.Select(mapper.Map<CategoryDto>).ToList()
        };
    }

    private static string NormalizeSlug(string? slug, string name)
    {
        var value = string.IsNullOrWhiteSpace(slug) ? name : slug;
        value = value.Trim().ToLowerInvariant();

        // Replace spaces with hyphens and keep alphanumerics/hyphens only
        var normalized = new string(value
            .Replace(' ', '-')
            .Select(ch => char.IsLetterOrDigit(ch) || ch == '-' ? ch : '-')
            .ToArray());

        while (normalized.Contains("--"))
        {
            normalized = normalized.Replace("--", "-");
        }

        normalized = normalized.Trim('-');
        if (string.IsNullOrWhiteSpace(normalized)) throw new ValidationException("El slug es obligatorio");
        return normalized;
    }
}
