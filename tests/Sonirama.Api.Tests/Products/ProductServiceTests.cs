using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using Microsoft.AspNetCore.Http;
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
    private readonly Mock<IProductImageRepository> _images = new();
    private readonly Mock<IProductImageStorage> _imageStorage = new();
    private readonly IMapper _mapper;

    public ProductServiceTests()
    {
        var cfg = new MapperConfiguration(c => c.AddProfile(new ProductProfile()));
        _mapper = cfg.CreateMapper();
    }

    private ProductService CreateSut() => new(_products.Object, _discounts.Object, _images.Object, _imageStorage.Object, _mapper);

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

    [Fact]
    public async Task UpdateAsync_ShouldSucceed_AndPreserveCode()
    {
        var id = Guid.NewGuid();
        var entity = new Product { Id = id, Code = "P001", Name = "Old", Price = 10m, IsActive = true };
        _products.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _products.Setup(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var dto = await sut.UpdateAsync(id, new ProductUpdateRequest
        {
            Name = "New",
            Description = "Desc",
            Category = "Cat",
            Price = 20m,
            Currency = "ARS",
            IsActive = true
        }, CancellationToken.None);

        dto.Code.Should().Be("P001");
        dto.Name.Should().Be("New");
        _products.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ShouldMarkInactive()
    {
        var id = Guid.NewGuid();
        var entity = new Product { Id = id, Code = "P001", Name = "X", Price = 10m, IsActive = true };
        _products.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _products.Setup(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask)
                 .Callback<Product, CancellationToken>((p, _) => p.IsActive = false);

        var sut = CreateSut();
        await sut.DeleteAsync(id, CancellationToken.None);
        entity.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task ListAsync_ShouldApplyFilters_AndSorting()
    {
        var paged = new PagedResult<Product> { Page = 1, PageSize = 10, TotalCount = 0, Items = new List<Product>() };
        _products.Setup(r => r.ListAsync(It.Is<ProductListFilter>(f => f.PriceMin == 10m && f.PriceMax == 100m && f.IsActive == true && f.Query == "pro" && f.SortBy == "Price" && f.SortDir == "ASC"), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(paged);

        var sut = CreateSut();
        var result = await sut.ListAsync(new ProductFilterRequest { Page = 1, PageSize = 10, PriceMin = 10m, PriceMax = 100m, IsActive = true, Query = "pro", SortBy = "Price", SortDir = "ASC" }, CancellationToken.None);
        result.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task ListAsync_ShouldPassCategoryIds_WithDescendants()
    {
        var paged = new PagedResult<Product> { Page = 1, PageSize = 10, TotalCount = 0, Items = new List<Product>() };
        var cat = Guid.NewGuid();
        _products.Setup(r => r.ListAsync(It.Is<ProductListFilter>(f => f.CategoryIds != null && System.Linq.Enumerable.Any(f.CategoryIds, x => x == cat)), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(paged);

        var sut = CreateSut();
        var result = await sut.ListAsync(new ProductFilterRequest { Page = 1, PageSize = 10, CategoryIds = new List<Guid> { cat } }, CancellationToken.None);
        result.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task UploadImagesAsync_ShouldPersistAndReturnMetadata()
    {
        var productId = Guid.NewGuid();
        var product = new Product { Id = productId, Code = "P001", Name = "Prod", Price = 10m, IsActive = true };
        _products.Setup(r => r.GetByIdAsync(productId, It.IsAny<CancellationToken>())).ReturnsAsync(product);

        _imageStorage.Setup(s => s.SaveAsync(product.Code, It.IsAny<IFormFile>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                FileName = "img.jpg",
                RelativePath = "images/products/p001/img.jpg",
                Url = "/images/products/p001/img.jpg",
                UploadedAtUtc = DateTime.UtcNow
            });

        _images.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<ProductImage>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var files = new List<IFormFile> { Mock.Of<IFormFile>() };
        var sut = CreateSut();

        var result = await sut.UploadImagesAsync(productId, files, CancellationToken.None);

        result.Should().HaveCount(1);
        result[0].Url.Should().Contain("/images/products/");
        _images.Verify(r => r.AddRangeAsync(It.Is<IEnumerable<ProductImage>>(imgs => imgs.Any()), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadImagesAsync_ShouldThrow_WhenNoFiles()
    {
        var productId = Guid.NewGuid();
        _products.Setup(r => r.GetByIdAsync(productId, It.IsAny<CancellationToken>())).ReturnsAsync(new Product { Id = productId, Code = "P001", Name = "Prod", Price = 10m });

        var sut = CreateSut();

        await Assert.ThrowsAsync<ValidationException>(() => sut.UploadImagesAsync(productId, Array.Empty<IFormFile>(), CancellationToken.None));
    }

    [Fact]
    public async Task DeleteImageAsync_ShouldRemoveFileAndRecord()
    {
        var productId = Guid.NewGuid();
        var imageId = Guid.NewGuid();
        var product = new Product { Id = productId, Code = "P001", Name = "Prod", Price = 10m };
        var image = new ProductImage { Id = imageId, ProductId = productId, FileName = "img.jpg", RelativePath = "images/products/p001/img.jpg", Url = "/images/products/p001/img.jpg" };

        _products.Setup(r => r.GetByIdAsync(productId, It.IsAny<CancellationToken>())).ReturnsAsync(product);
        _images.Setup(r => r.GetByIdAsync(imageId, It.IsAny<CancellationToken>())).ReturnsAsync(image);
        _images.Setup(r => r.RemoveAsync(image, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _imageStorage.Setup(s => s.DeleteAsync(image, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        await sut.DeleteImageAsync(productId, imageId, CancellationToken.None);

        _imageStorage.Verify(s => s.DeleteAsync(image, It.IsAny<CancellationToken>()), Times.Once);
        _images.Verify(r => r.RemoveAsync(image, It.IsAny<CancellationToken>()), Times.Once);
    }
}
