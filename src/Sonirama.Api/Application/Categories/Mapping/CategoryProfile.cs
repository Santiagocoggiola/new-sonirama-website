using AutoMapper;
using Sonirama.Api.Application.Categories.Dtos;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Categories.Mapping;

// AutoMapper profile for Category mappings.
public sealed class CategoryProfile : Profile
{
    public CategoryProfile()
    {
        CreateMap<Category, CategoryDto>()
            .ForMember(d => d.ParentIds, opt => opt.MapFrom(s => s.ParentsLink.Select(r => r.ParentId)))
            .ForMember(d => d.ChildIds, opt => opt.MapFrom(s => s.ChildrenLink.Select(r => r.ChildId)));
        CreateMap<CategoryCreateRequest, Category>();
        CreateMap<CategoryUpdateRequest, Category>();
    }
}
