using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

public sealed class BulkDiscountRepository(AppDbContext db) : IBulkDiscountRepository
{
    public async Task<IReadOnlyList<BulkDiscount>> GetByProductAsync(Guid productId, CancellationToken ct)
        => await db.BulkDiscounts.Where(d => d.ProductId == productId).OrderBy(d => d.MinQuantity).ToListAsync(ct);

    public async Task<BulkDiscount?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.BulkDiscounts.FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task AddAsync(BulkDiscount discount, CancellationToken ct)
    {
        await db.BulkDiscounts.AddAsync(discount, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(BulkDiscount discount, CancellationToken ct)
    {
        db.BulkDiscounts.Update(discount);
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(BulkDiscount discount, CancellationToken ct)
    {
        db.BulkDiscounts.Remove(discount);
        await db.SaveChangesAsync(ct);
    }
}
