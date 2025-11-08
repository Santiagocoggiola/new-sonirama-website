using AutoMapper;
using Sonirama.Api.Application.Products.Discounts.Dtos;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Products.Discounts.Mapping;

public sealed class BulkDiscountProfile : Profile
{
    public BulkDiscountProfile()
    {
        CreateMap<BulkDiscount, BulkDiscountDto>();
        CreateMap<BulkDiscountCreateRequest, BulkDiscount>()
            .ForMember(d => d.StartsAtUtc, opt => opt.MapFrom(s => s.StartsAt))
            .ForMember(d => d.EndsAtUtc, opt => opt.MapFrom(s => s.EndsAt));
        CreateMap<BulkDiscountUpdateRequest, BulkDiscount>()
            .ForMember(d => d.StartsAtUtc, opt => opt.MapFrom(s => s.StartsAt))
            .ForMember(d => d.EndsAtUtc, opt => opt.MapFrom(s => s.EndsAt));
    }
}
