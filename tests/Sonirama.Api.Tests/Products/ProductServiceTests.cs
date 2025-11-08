using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Application.Products;
using Sonirama.Api.Application.Products.Dtos;
using Sonirama.Api.Application.Products.Mapping;
using Sonirama.Api.Domain.Entities;
using Xunit;

namespace Sonirama.Api.Tests.Products;

public class ProductServiceTests
{
    private readonly Mock<IProductRepository> _products = new();
    private readonly Mock<IBulkDiscountRepository> _discounts = new();
    private readonly IMapper _mapper;

    public ProductServiceTests()
    {
        var cfg = new MapperConfiguration(c => c.AddProfile(new ProductProfile()));
        _mapper = cfg.CreateMapper();
    }

    private ProductService CreateSut() => new(_products.Object, _discounts.Object, _mapper);

    [Fact]
    public async Task CreateAsync_ShouldCreate_WhenUniqueCode()
    {
        _products.Setup(r => r.ExistsAsync("P001", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _products.Setup(r => r.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask)
                 .Callback<Product, CancellationToken>((p, _) => p.Id = Guid.NewGuid());

        var sut = CreateSut();
        var dto = await sut.CreateAsync(new ProductCreateRequest
        {
            Code = "P001",
            Name = "Producto 1",
            Price = 100m
        }, CancellationToken.None);

        dto.Code.Should().Be("P001");
        _products.Verify(r => r.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ShouldFail_WhenDuplicateCode()
    {
        _products.Setup(r => r.ExistsAsync("P001", It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var sut = CreateSut();
        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(new ProductCreateRequest
        {
            Code = "P001",
            Name = "Producto 1",
            Price = 100m
        }, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ShouldThrow_NotFound()
    {
        _products.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((Product?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.UpdateAsync(Guid.NewGuid(), new ProductUpdateRequest
        {
            Name = "Nuevo",
            Price = 10m,
            Currency = "ARS",
            StockQuantity = 5,
            IsActive = true
        }, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteAsync_ShouldInvokeRepository_WhenExists()
    {
        var product = new Product { Id = Guid.NewGuid(), Code = "P001", Name = "Nombre", Price = 10m, IsActive = true };
        _products.Setup(r => r.GetByIdAsync(product.Id, It.IsAny<CancellationToken>())).ReturnsAsync(product);
        _products.Setup(r => r.DeleteAsync(product, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        var sut = CreateSut();
        await sut.DeleteAsync(product.Id, CancellationToken.None);
        _products.Verify(r => r.DeleteAsync(product, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListAsync_ShouldMapPagedResult()
    {
        var entities = new List<Product> { new() { Id = Guid.NewGuid(), Code = "P001", Name = "N1", Price = 50m, IsActive = true } };
        var paged = new PagedResult<Product>
        {
            Page = 1,
            PageSize = 10,
            TotalCount = 1,
            Items = entities
        };
        _products.Setup(r => r.ListAsync(It.IsAny<ProductListFilter>(), It.IsAny<CancellationToken>())).ReturnsAsync(paged);
        var sut = CreateSut();
        var result = await sut.ListAsync(new ProductFilterRequest { Page = 1, PageSize = 10 }, CancellationToken.None);
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items[0].Code.Should().Be("P001");
    }
}
