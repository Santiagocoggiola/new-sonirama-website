using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

public sealed class ProductImageRepository(AppDbContext db) : IProductImageRepository
{
    public async Task AddRangeAsync(IEnumerable<ProductImage> images, CancellationToken ct)
    {
        await db.ProductImages.AddRangeAsync(images, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task<ProductImage?> GetByIdAsync(Guid imageId, CancellationToken ct)
        => await db.ProductImages.FirstOrDefaultAsync(i => i.Id == imageId, ct);

    public async Task<IReadOnlyList<ProductImage>> GetByProductIdAsync(Guid productId, CancellationToken ct)
        => await db.ProductImages.Where(i => i.ProductId == productId).OrderBy(i => i.UploadedAtUtc).ToListAsync(ct);

    public async Task RemoveAsync(ProductImage image, CancellationToken ct)
    {
        db.ProductImages.Remove(image);
        await db.SaveChangesAsync(ct);
    }
}
