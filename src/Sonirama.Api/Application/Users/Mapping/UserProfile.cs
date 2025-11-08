using AutoMapper;
using Sonirama.Api.Application.Users.Dtos;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Users.Mapping;

// AutoMapper profile for User entity and DTOs.
public sealed class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<User, UserDto>();
        CreateMap<UserCreateRequest, User>();
        CreateMap<UserUpdateRequest, User>();
    }
}
