using AutoMapper;
using Sonirama.Api.Application.Products.Dtos;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Products.Mapping;

// AutoMapper profile for Product mappings.
public sealed class ProductProfile : Profile
{
    public ProductProfile()
    {
        CreateMap<ProductImage, ProductImageDto>();
        CreateMap<Product, ProductDto>();
        CreateMap<ProductCreateRequest, Product>()
            .ForMember(d => d.Images, opt => opt.Ignore());
        CreateMap<ProductUpdateRequest, Product>()
            .ForMember(d => d.Images, opt => opt.Ignore());
    }
}
