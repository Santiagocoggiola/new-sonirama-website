using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

// EF Core implementation for Category repository.
public sealed class CategoryRepository(AppDbContext db) : ICategoryRepository
{
    public async Task<Category?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.Categories
            .Include(c => c.ParentsLink)
            .Include(c => c.ChildrenLink)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<bool> ExistsBySlugAsync(string slug, CancellationToken ct)
        => await db.Categories.AnyAsync(c => c.Slug == slug, ct);

    public async Task<bool> ExistsByNameAsync(string name, CancellationToken ct)
        => await db.Categories.AnyAsync(c => c.Name == name, ct);

    public async Task<PagedResult<Category>> ListAsync(CategoryListFilter filter, CancellationToken ct)
    {
        var q = db.Categories.AsQueryable();
        if (!string.IsNullOrWhiteSpace(filter.Query))
        {
            var term = filter.Query.ToLowerInvariant();
            q = q.Where(c => c.Name.ToLower().Contains(term) || c.Slug.ToLower().Contains(term));
        }
        if (filter.IsActive.HasValue)
        {
            q = q.Where(c => c.IsActive == filter.IsActive.Value);
        }
        var sortDir = (filter.SortDir ?? "DESC").ToUpperInvariant();
        q = (filter.SortBy ?? "CreatedAt") switch
        {
            "Name" => sortDir == "ASC" ? q.OrderBy(c => c.Name) : q.OrderByDescending(c => c.Name),
            "Slug" => sortDir == "ASC" ? q.OrderBy(c => c.Slug) : q.OrderByDescending(c => c.Slug),
            _ => sortDir == "ASC" ? q.OrderBy(c => c.CreatedAtUtc) : q.OrderByDescending(c => c.CreatedAtUtc)
        };

        var total = await q.CountAsync(ct);
        var items = await q
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Include(c => c.ParentsLink)
            .Include(c => c.ChildrenLink)
            .ToListAsync(ct);

        return new PagedResult<Category>
        {
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = total,
            Items = items
        };
    }

    public async Task AddAsync(Category category, IEnumerable<Guid> parentIds, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await db.Categories.AddAsync(category, ct);
        if (parentIds != null)
        {
            foreach (var pid in parentIds.Distinct())
            {
                db.CategoryRelations.Add(new CategoryRelation { ParentId = pid, ChildId = category.Id });
            }
        }
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    public async Task UpdateAsync(Category category, IEnumerable<Guid> parentIds, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        db.Categories.Update(category);
        // replace parent links
        var existing = await db.CategoryRelations.Where(r => r.ChildId == category.Id).ToListAsync(ct);
        db.CategoryRelations.RemoveRange(existing);
        if (parentIds != null)
        {
            foreach (var pid in parentIds.Distinct())
            {
                db.CategoryRelations.Add(new CategoryRelation { ParentId = pid, ChildId = category.Id });
            }
        }
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    public async Task DeleteAsync(Category category, CancellationToken ct)
    {
        category.IsActive = false;
        db.Categories.Update(category);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<Guid>> GetDescendantIdsAsync(Guid categoryId, CancellationToken ct)
    {
        // Simple BFS on relations
        var descendants = new HashSet<Guid>();
        var queue = new Queue<Guid>();
        queue.Enqueue(categoryId);
        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            var children = await db.CategoryRelations.Where(r => r.ParentId == current).Select(r => r.ChildId).ToListAsync(ct);
            foreach (var child in children)
            {
                if (descendants.Add(child)) queue.Enqueue(child);
            }
        }
        return descendants.ToList();
    }
}
