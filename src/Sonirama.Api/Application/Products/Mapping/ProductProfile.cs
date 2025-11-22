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
        CreateMap<ProductCreateRequest, Product>();
        CreateMap<ProductUpdateRequest, Product>();
    }
}
