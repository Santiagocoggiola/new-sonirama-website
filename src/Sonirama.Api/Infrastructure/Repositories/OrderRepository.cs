using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

public sealed class OrderRepository(AppDbContext db) : IOrderRepository
{
    public async Task AddAsync(Order order, CancellationToken ct)
    {
        await db.Orders.AddAsync(order, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Order order, CancellationToken ct)
    {
        db.Orders.Update(order);
        await db.SaveChangesAsync(ct);
    }

    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.Orders.FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<Order?> GetDetailedByIdAsync(Guid id, CancellationToken ct)
        => await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<PagedResult<Order>> ListAsync(OrderListFilter filter, CancellationToken ct)
    {
        var query = db.Orders.Include(o => o.Items).AsQueryable();

        if (!filter.IncludeAllUsers && filter.UserId.HasValue)
        {
            query = query.Where(o => o.UserId == filter.UserId.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(o => o.Status == filter.Status.Value);
        }

        if (filter.CreatedFromUtc.HasValue)
        {
            query = query.Where(o => o.CreatedAtUtc >= filter.CreatedFromUtc.Value);
        }

        if (filter.CreatedToUtc.HasValue)
        {
            query = query.Where(o => o.CreatedAtUtc <= filter.CreatedToUtc.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Query))
        {
            var text = filter.Query.Trim().ToUpperInvariant();
            query = query.Where(o => o.Number.ToUpper().Contains(text) || o.Items.Any(i => i.ProductName.ToUpper().Contains(text)));
        }

        query = ApplySorting(query, filter.SortBy, filter.SortDir);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return new PagedResult<Order>
        {
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = total,
            Items = items
        };
    }

    private static IQueryable<Order> ApplySorting(IQueryable<Order> query, string? sortBy, string? sortDir)
    {
        var dir = string.Equals(sortDir, "ASC", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";
        return (sortBy?.ToLowerInvariant()) switch
        {
            "number" => dir == "ASC" ? query.OrderBy(o => o.Number) : query.OrderByDescending(o => o.Number),
            "status" => dir == "ASC" ? query.OrderBy(o => o.Status) : query.OrderByDescending(o => o.Status),
            "total" => dir == "ASC" ? query.OrderBy(o => o.Total) : query.OrderByDescending(o => o.Total),
            _ => dir == "ASC" ? query.OrderBy(o => o.CreatedAtUtc) : query.OrderByDescending(o => o.CreatedAtUtc)
        };
    }
}
