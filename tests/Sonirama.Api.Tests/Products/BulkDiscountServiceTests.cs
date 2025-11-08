using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Products.Discounts;
using Sonirama.Api.Application.Products.Discounts.Dtos;
using Sonirama.Api.Application.Products.Discounts.Mapping;
using Sonirama.Api.Domain.Entities;
using Xunit;

namespace Sonirama.Api.Tests.Products;

public class BulkDiscountServiceTests
{
    private readonly Mock<IProductRepository> _products = new();
    private readonly Mock<IBulkDiscountRepository> _discounts = new();
    private readonly IMapper _mapper;

    public BulkDiscountServiceTests()
    {
        var cfg = new MapperConfiguration(c => c.AddProfile(new BulkDiscountProfile()));
        _mapper = cfg.CreateMapper();
    }

    private BulkDiscountService CreateSut() => new(_products.Object, _discounts.Object, _mapper);

    [Fact]
    public async Task ListByProductAsync_ShouldThrow_WhenProductNotFound()
    {
        _products.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((Product?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.ListByProductAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_ShouldThrow_WhenDuplicateMinQuantity()
    {
        var productId = Guid.NewGuid();
        _products.Setup(r => r.GetByIdAsync(productId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new Product { Id = productId, Code = "P" });
        _discounts.Setup(r => r.GetByProductAsync(productId, It.IsAny<CancellationToken>()))
                  .ReturnsAsync(new List<BulkDiscount> { new() { Id = Guid.NewGuid(), ProductId = productId, MinQuantity = 5, DiscountPercent = 10m } });

        var sut = CreateSut();
        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(productId, new BulkDiscountCreateRequest
        {
            MinQuantity = 5,
            DiscountPercent = 10m,
            IsActive = true
        }, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ShouldThrow_WhenDiscountNotFound()
    {
        _discounts.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                  .ReturnsAsync((BulkDiscount?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.UpdateAsync(Guid.NewGuid(), new BulkDiscountUpdateRequest
        {
            MinQuantity = 1,
            DiscountPercent = 5m,
            IsActive = true
        }, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ShouldThrow_WhenDuplicateMinQuantity()
    {
        var productId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _discounts.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
                  .ReturnsAsync(new BulkDiscount { Id = id, ProductId = productId, MinQuantity = 3, DiscountPercent = 5m });
        _discounts.Setup(r => r.GetByProductAsync(productId, It.IsAny<CancellationToken>()))
                  .ReturnsAsync(new List<BulkDiscount>
                  {
                      new() { Id = id, ProductId = productId, MinQuantity = 3, DiscountPercent = 5m },
                      new() { Id = Guid.NewGuid(), ProductId = productId, MinQuantity = 7, DiscountPercent = 10m }
                  });

        var sut = CreateSut();
        await Assert.ThrowsAsync<ConflictException>(() => sut.UpdateAsync(id, new BulkDiscountUpdateRequest
        {
            MinQuantity = 7,
            DiscountPercent = 12m,
            IsActive = true
        }, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteAsync_ShouldThrow_WhenNotFound()
    {
        _discounts.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                  .ReturnsAsync((BulkDiscount?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.DeleteAsync(Guid.NewGuid(), CancellationToken.None));
    }
}
