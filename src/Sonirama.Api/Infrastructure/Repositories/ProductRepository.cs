using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

// EF Core implementation of product repository.
public sealed class ProductRepository(AppDbContext db) : IProductRepository
{
    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.Products
            .Include(p => p.BulkDiscounts)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Product?> GetByCodeAsync(string code, CancellationToken ct)
        => await db.Products
            .Include(p => p.BulkDiscounts)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Code == code, ct);

    public async Task<bool> ExistsAsync(string code, CancellationToken ct)
        => await db.Products.AnyAsync(p => p.Code == code, ct);

    public async Task<PagedResult<Product>> ListAsync(ProductListFilter filter, CancellationToken ct)
    {
        var query = db.Products.AsQueryable();
        query = ApplyBasicFilters(query, filter);
        query = await ApplyCategoryFilterAsync(query, filter, ct);
        query = ApplySorting(query, filter);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Include(p => p.BulkDiscounts)
            .Include(p => p.Images)
            .Include(p => p.ProductsLink)
            .ToListAsync(ct);

        return new PagedResult<Product>
        {
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = total,
            Items = items
        };
    }

    private static IQueryable<Product> ApplyBasicFilters(IQueryable<Product> query, ProductListFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Query))
        {
            var term = filter.Query.ToLowerInvariant();
            query = query.Where(p => p.Code.ToLower().Contains(term) || p.Name.ToLower().Contains(term) || (p.Category != null && p.Category.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            query = query.Where(p => p.Category == filter.Category);
        }

        if (filter.PriceMin.HasValue)
        {
            query = query.Where(p => p.Price >= filter.PriceMin.Value);
        }

        if (filter.PriceMax.HasValue)
        {
            query = query.Where(p => p.Price <= filter.PriceMax.Value);
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(p => p.IsActive == filter.IsActive.Value);
        }

        return query;
    }

    private async Task<IQueryable<Product>> ApplyCategoryFilterAsync(IQueryable<Product> query, ProductListFilter filter, CancellationToken ct)
    {
        if (filter.CategoryIds is null || filter.CategoryIds.Count == 0)
        {
            return query;
        }

        var targetIds = new HashSet<Guid>(filter.CategoryIds);
        var queue = new Queue<Guid>(filter.CategoryIds);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            var children = await db.CategoryRelations
                .Where(r => r.ParentId == current)
                .Select(r => r.ChildId)
                .ToListAsync(ct);

            foreach (var child in children.Where(child => targetIds.Add(child)))
            {
                queue.Enqueue(child);
            }
        }

        return query.Where(p => db.ProductCategories.Any(pc => pc.ProductId == p.Id && targetIds.Contains(pc.CategoryId)));
    }

    private static IQueryable<Product> ApplySorting(IQueryable<Product> query, ProductListFilter filter)
    {
        var sortDir = (filter.SortDir ?? "DESC").ToUpperInvariant();
        return (filter.SortBy ?? "CreatedAt") switch
        {
            "Code" => sortDir == "ASC" ? query.OrderBy(p => p.Code) : query.OrderByDescending(p => p.Code),
            "Name" => sortDir == "ASC" ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
            "Price" => sortDir == "ASC" ? query.OrderBy(p => p.Price) : query.OrderByDescending(p => p.Price),
            _ => sortDir == "ASC" ? query.OrderBy(p => p.CreatedAtUtc) : query.OrderByDescending(p => p.CreatedAtUtc)
        };
    }

    public async Task AddAsync(Product product, CancellationToken ct)
    {
        await db.Products.AddAsync(product, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Product product, CancellationToken ct)
    {
        db.Products.Update(product);
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Product product, CancellationToken ct)
    {
        product.IsActive = false;
        db.Products.Update(product);
        await db.SaveChangesAsync(ct);
    }
}
