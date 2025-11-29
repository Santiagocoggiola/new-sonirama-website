using System;
using System.Collections.Generic;
using FluentAssertions;
using Sonirama.Api.Application.Orders.Dtos;
using Sonirama.Api.Application.Orders.Validators;
using Xunit;

namespace Sonirama.Api.Tests.Validators;

public class OrderModifyValidatorTests
{
    private readonly OrderModifyRequestValidator _validator = new();

    [Fact]
    public void Should_Fail_WhenReasonIsEmpty()
    {
        var request = new OrderModifyRequest
        {
            Reason = "",
            Items = new List<OrderItemModification> 
            { 
                new() { ProductId = Guid.NewGuid(), NewQuantity = 5 } 
            }
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }

    [Fact]
    public void Should_Fail_WhenItemsIsEmpty()
    {
        var request = new OrderModifyRequest
        {
            Reason = "Stock insuficiente",
            Items = new List<OrderItemModification>()
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Items");
    }

    [Fact]
    public void Should_Fail_WhenQuantityIsNegative()
    {
        var request = new OrderModifyRequest
        {
            Reason = "Ajuste de cantidad",
            Items = new List<OrderItemModification>
            {
                new() { ProductId = Guid.NewGuid(), NewQuantity = -1 }
            }
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("NewQuantity"));
    }

    [Fact]
    public void Should_Fail_WhenProductIdIsEmpty()
    {
        var request = new OrderModifyRequest
        {
            Reason = "Ajuste de cantidad",
            Items = new List<OrderItemModification>
            {
                new() { ProductId = Guid.Empty, NewQuantity = 5 }
            }
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("ProductId"));
    }

    [Fact]
    public void Should_Pass_WhenValidRequest()
    {
        var request = new OrderModifyRequest
        {
            Reason = "Ajuste por falta de stock",
            AdminNotes = "Cliente notificado",
            Items = new List<OrderItemModification>
            {
                new() { ProductId = Guid.NewGuid(), NewQuantity = 3 },
                new() { ProductId = Guid.NewGuid(), NewQuantity = 0 }
            }
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Pass_WhenQuantityIsZero()
    {
        // Zero quantity is valid (removes item from order)
        var request = new OrderModifyRequest
        {
            Reason = "Producto no disponible",
            Items = new List<OrderItemModification>
            {
                new() { ProductId = Guid.NewGuid(), NewQuantity = 0 }
            }
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Fail_WhenReasonExceeds1000Chars()
    {
        var request = new OrderModifyRequest
        {
            Reason = new string('a', 1001),
            Items = new List<OrderItemModification>
            {
                new() { ProductId = Guid.NewGuid(), NewQuantity = 1 }
            }
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }
}
