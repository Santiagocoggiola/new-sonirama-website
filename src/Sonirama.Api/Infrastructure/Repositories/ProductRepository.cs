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
        => await db.Products.Include(p => p.BulkDiscounts).FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Product?> GetByCodeAsync(string code, CancellationToken ct)
        => await db.Products.Include(p => p.BulkDiscounts).FirstOrDefaultAsync(p => p.Code == code, ct);

    public async Task<bool> ExistsAsync(string code, CancellationToken ct)
        => await db.Products.AnyAsync(p => p.Code == code, ct);

    public async Task<PagedResult<Product>> ListAsync(ProductListFilter filter, CancellationToken ct)
    {
        var q = db.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Query))
        {
            var term = filter.Query.ToLowerInvariant();
            q = q.Where(p => p.Code.ToLower().Contains(term) || p.Name.ToLower().Contains(term) || (p.Category != null && p.Category.ToLower().Contains(term)));
        }
        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            q = q.Where(p => p.Category == filter.Category);
        }
        if (filter.PriceMin.HasValue)
        {
            q = q.Where(p => p.Price >= filter.PriceMin.Value);
        }
        if (filter.PriceMax.HasValue)
        {
            q = q.Where(p => p.Price <= filter.PriceMax.Value);
        }
        if (filter.IsActive.HasValue)
        {
            q = q.Where(p => p.IsActive == filter.IsActive.Value);
        }

        // Filter by CategoryIds (including descendants) using ProductCategories + CategoryRelations.
        if (filter.CategoryIds != null && filter.CategoryIds.Count > 0)
        {
            // Build full set (provided + descendants) via BFS over CategoryRelations.
            var targetIds = new HashSet<Guid>(filter.CategoryIds);
            var queue = new Queue<Guid>(filter.CategoryIds);
            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                var children = await db.CategoryRelations
                    .Where(r => r.ParentId == current)
                    .Select(r => r.ChildId)
                    .ToListAsync(ct);
                foreach (var child in children)
                {
                    if (targetIds.Add(child)) queue.Enqueue(child);
                }
            }

            q = q.Where(p => db.ProductCategories.Any(pc => pc.ProductId == p.Id && targetIds.Contains(pc.CategoryId)));
        }

        var sortDir = (filter.SortDir ?? "DESC").ToUpperInvariant();
        q = (filter.SortBy ?? "CreatedAt") switch
        {
            "Code" => sortDir == "ASC" ? q.OrderBy(p => p.Code) : q.OrderByDescending(p => p.Code),
            "Name" => sortDir == "ASC" ? q.OrderBy(p => p.Name) : q.OrderByDescending(p => p.Name),
            "Price" => sortDir == "ASC" ? q.OrderBy(p => p.Price) : q.OrderByDescending(p => p.Price),
            _ => sortDir == "ASC" ? q.OrderBy(p => p.CreatedAtUtc) : q.OrderByDescending(p => p.CreatedAtUtc)
        };

        var total = await q.CountAsync(ct);
        var items = await q
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Include(p => p.BulkDiscounts)
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
