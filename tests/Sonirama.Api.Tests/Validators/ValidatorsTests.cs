using System.Threading.Tasks;
using FluentAssertions;
using Sonirama.Api.Application.Categories.Dtos;
using Sonirama.Api.Application.Categories.Validators;
using Sonirama.Api.Application.Products.Discounts.Dtos;
using Sonirama.Api.Application.Products.Discounts.Validators;
using Sonirama.Api.Application.Products.Dtos;
using Sonirama.Api.Application.Products.Validation;
using Sonirama.Api.Application.Users.Dtos;
using Sonirama.Api.Application.Users.Validation;
using Xunit;

namespace Sonirama.Api.Tests.Validators;

public class ValidatorsTests
{
    [Fact]
    public void ProductCreateRequest_ShouldFail_WhenInvalid()
    {
        var v = new ProductCreateRequestValidator();
        var req = new ProductCreateRequest { Name = "", Code = "P", Price = 0m };
        var r = v.Validate(req);
        r.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CategoryCreateRequest_ShouldFail_WhenSlugEmpty()
    {
        var v = new CategoryCreateRequestValidator();
        var req = new CategoryCreateRequest { Name = "Cat", Slug = "" };
        var r = v.Validate(req);
        r.IsValid.Should().BeFalse();
    }

    [Fact]
    public void BulkDiscountCreateRequest_ShouldFail_WhenDatesInverted()
    {
        var v = new BulkDiscountCreateRequestValidator();
        var req = new BulkDiscountCreateRequest
        {
            MinQuantity = 2,
            DiscountPercent = 5m,
            StartsAt = System.DateTime.UtcNow.AddDays(1),
            EndsAt = System.DateTime.UtcNow.AddDays(-1),
            IsActive = true
        };
        var r = v.Validate(req);
        r.IsValid.Should().BeFalse();
    }

    [Fact]
    public void UserCreateRequest_ShouldFail_WhenEmailInvalid()
    {
        var v = new UserCreateRequestValidator();
        var req = new UserCreateRequest { Email = "not-an-email", FirstName = "A", LastName = "B", Role = Sonirama.Api.Domain.Enums.Role.User };
        var r = v.Validate(req);
        r.IsValid.Should().BeFalse();
    }
}
