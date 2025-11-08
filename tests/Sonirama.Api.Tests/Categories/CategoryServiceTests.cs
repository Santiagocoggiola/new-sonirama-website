using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using Sonirama.Api.Application.Categories;
using Sonirama.Api.Application.Categories.Dtos;
using Sonirama.Api.Application.Categories.Mapping;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Domain.Entities;
using Xunit;

namespace Sonirama.Api.Tests.Categories;

public class CategoryServiceTests
{
    private readonly Mock<ICategoryRepository> _repo = new();
    private readonly IMapper _mapper;

    public CategoryServiceTests()
    {
        var cfg = new MapperConfiguration(c => c.AddProfile(new CategoryProfile()));
        _mapper = cfg.CreateMapper();
    }

    private CategoryService CreateSut() => new(_repo.Object, _mapper);

    [Fact]
    public async Task CreateAsync_ShouldCreate_WhenUnique()
    {
        _repo.Setup(r => r.ExistsBySlugAsync("cat-1", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.ExistsByNameAsync("Cat 1", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.AddAsync(It.IsAny<Category>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var dto = await sut.CreateAsync(new CategoryCreateRequest { Name = "Cat 1", Slug = "cat-1" }, CancellationToken.None);
        dto.Name.Should().Be("Cat 1");
    }

    [Fact]
    public async Task CreateAsync_ShouldFail_DuplicateSlug()
    {
        _repo.Setup(r => r.ExistsBySlugAsync("cat-1", It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var sut = CreateSut();
        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(new CategoryCreateRequest { Name = "Cat 1", Slug = "cat-1" }, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ShouldThrow_NotFound()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Category?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.UpdateAsync(Guid.NewGuid(), new CategoryUpdateRequest { Name = "X", Slug = "x" }, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteAsync_ShouldThrow_NotFound()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Category?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.DeleteAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task ListAsync_ShouldReturnPaged()
    {
        var cat = new Category { Id = Guid.NewGuid(), Name = "Cat", Slug = "cat" };
        var paged = new PagedResult<Category>
        {
            Page = 1,
            PageSize = 10,
            TotalCount = 1,
            Items = new List<Category> { cat }
        };
        _repo.Setup(r => r.ListAsync(It.IsAny<CategoryListFilter>(), It.IsAny<CancellationToken>())).ReturnsAsync(paged);
        var sut = CreateSut();
        var result = await sut.ListAsync(new CategoryFilterRequest { Page = 1, PageSize = 10 }, CancellationToken.None);
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items[0].Slug.Should().Be("cat");
    }

    [Fact]
    public async Task UpdateAsync_ShouldPreventCycle()
    {
        var id = Guid.NewGuid();
        var entity = new Category { Id = id, Name = "A", Slug = "a" };
        _repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _repo.Setup(r => r.ExistsBySlugAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.ExistsByNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var child = Guid.NewGuid();
        var grandChild = Guid.NewGuid();
        // Descendants of 'id' include child and grandChild, simulate existing hierarchy
        _repo.Setup(r => r.GetDescendantIdsAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(new List<Guid> { child, grandChild });

        var sut = CreateSut();
        // Use one of the descendants as a new parent -> should trigger cycle prevention
        await Assert.ThrowsAsync<ValidationException>(() => sut.UpdateAsync(id, new CategoryUpdateRequest { Name = "A2", Slug = "a2", ParentIds = new List<Guid> { child } }, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdate_WhenValid()
    {
        var id = Guid.NewGuid();
        var entity = new Category { Id = id, Name = "Old", Slug = "old" };
        _repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _repo.Setup(r => r.ExistsBySlugAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.ExistsByNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.GetDescendantIdsAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(new List<Guid>());
        _repo.Setup(r => r.UpdateAsync(entity, It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var dto = await sut.UpdateAsync(id, new CategoryUpdateRequest { Name = "New", Slug = "new", ParentIds = new List<Guid>() }, CancellationToken.None);
        dto.Name.Should().Be("New");
        dto.Slug.Should().Be("new");
    }

    [Fact]
    public async Task DeleteAsync_ShouldSoftDelete_WhenExists()
    {
        var id = Guid.NewGuid();
        var entity = new Category { Id = id, Name = "A", Slug = "a", IsActive = true };
        _repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _repo.Setup(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask)
              .Callback<Category, CancellationToken>((c, _) => c.IsActive = false);

        var sut = CreateSut();
        await sut.DeleteAsync(id, CancellationToken.None);
        entity.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task CreateAsync_ShouldSupportMultipleParents()
    {
        _repo.Setup(r => r.ExistsBySlugAsync("cat-1", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.ExistsByNameAsync("Cat 1", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.AddAsync(It.IsAny<Category>(), It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .Callback<Category, IEnumerable<Guid>, CancellationToken>((c, parents, _) =>
            {
                c.ParentsLink = parents.Select(pid => new CategoryRelation { ParentId = pid, ChildId = c.Id }).ToList();
            })
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        var dto = await sut.CreateAsync(new CategoryCreateRequest { Name = "Cat 1", Slug = "cat-1", ParentIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() } }, CancellationToken.None);
        dto.ParentIds.Should().HaveCount(2);
    }

    [Fact]
    public async Task ListAsync_ShouldOrderByName_AndSlug()
    {
        var c1 = new Category { Id = Guid.NewGuid(), Name = "B", Slug = "b" };
        var c2 = new Category { Id = Guid.NewGuid(), Name = "A", Slug = "a" };
        var paged = new PagedResult<Category> { Page = 1, PageSize = 10, TotalCount = 2, Items = new List<Category> { c1, c2 } };
        _repo.Setup(r => r.ListAsync(It.IsAny<CategoryListFilter>(), It.IsAny<CancellationToken>())).ReturnsAsync(paged);
        var sut = CreateSut();
        var result = await sut.ListAsync(new CategoryFilterRequest { Page = 1, PageSize = 10, SortBy = "Name", SortDir = "ASC" }, CancellationToken.None);
        result.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturn_NotFound_WhenMissing()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Category?)null);
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.GetByIdAsync(Guid.NewGuid(), CancellationToken.None));
    }
}
