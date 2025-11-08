using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

public sealed class UserRepository(AppDbContext db) : IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct)
        => await db.Users.Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == email, ct);

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.Users.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task AddAsync(User user, CancellationToken ct)
    {
        await db.Users.AddAsync(user, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(User user, CancellationToken ct)
    {
        db.Users.Update(user);
        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> ExistsAsync(string email, CancellationToken ct)
        => await db.Users.AnyAsync(u => u.Email == email, ct);

    public async Task<PagedResult<User>> ListAsync(UserListFilter filter, CancellationToken ct)
    {
        var queryable = db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Query))
        {
            var q = filter.Query.ToLower();
            queryable = queryable.Where(u =>
                u.Email.ToLower().Contains(q) ||
                u.FirstName.ToLower().Contains(q) ||
                u.LastName.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(filter.Role))
        {
            queryable = queryable.Where(u => u.Role == filter.Role);
        }

        if (filter.IsActive is not null)
        {
            queryable = queryable.Where(u => u.IsActive == filter.IsActive);
        }

        // Sorting
        var sortDir = (filter.SortDir ?? "DESC").ToUpperInvariant();
        queryable = (filter.SortBy ?? "CreatedAt") switch
        {
            "Email" => sortDir == "ASC" ? queryable.OrderBy(u => u.Email) : queryable.OrderByDescending(u => u.Email),
            "FirstName" => sortDir == "ASC" ? queryable.OrderBy(u => u.FirstName) : queryable.OrderByDescending(u => u.FirstName),
            "LastName" => sortDir == "ASC" ? queryable.OrderBy(u => u.LastName) : queryable.OrderByDescending(u => u.LastName),
            _ => sortDir == "ASC" ? queryable.OrderBy(u => u.CreatedAtUtc) : queryable.OrderByDescending(u => u.CreatedAtUtc)
        };

        var total = await queryable.CountAsync(ct);
        var items = await queryable
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return new PagedResult<User>
        {
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = total,
            Items = items
        };
    }

    public async Task DeleteAsync(User user, CancellationToken ct)
    {
        user.IsActive = false;
        db.Users.Update(user);
        await db.SaveChangesAsync(ct);
    }
}

