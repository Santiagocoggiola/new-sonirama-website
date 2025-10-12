namespace Sonirama.Api.Domain.Enums;

public static class Role
{
    public const string Admin = "ADMIN";
    public const string User = "USER";

    public static bool IsValid(string role)
        => role is Admin or User;
}

