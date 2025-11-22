using System.Linq;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Sonirama.Api.Application.Products.Dtos;

namespace Sonirama.Api.Application.Products.Validation;

public sealed class ProductImageUploadRequestValidator : AbstractValidator<ProductImageUploadRequest>
{
    private static readonly string[] AllowedContentTypes =
    [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    public ProductImageUploadRequestValidator()
    {
        RuleFor(x => x.Files)
            .NotNull().WithMessage("Debes adjuntar al menos una imagen.")
            .Must(files => files is { Count: > 0 }).WithMessage("Debes adjuntar al menos una imagen.")
            .Must(files => files.Count <= 10).WithMessage("Puedes enviar hasta 10 imágenes por solicitud.");

        RuleForEach(x => x.Files).Custom((file, context) =>
        {
            if (file is null)
            {
                context.AddFailure("Archivo inválido.");
                return;
            }

            if (file.Length == 0)
            {
                context.AddFailure(file.FileName ?? "archivo", "La imagen está vacía.");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                context.AddFailure(file.FileName ?? "archivo", "La imagen no puede superar los 5 MB.");
            }

            if (!AllowedContentTypes.Contains(file.ContentType))
            {
                context.AddFailure(file.FileName ?? "archivo", "Formato soportado: JPG, PNG o WEBP.");
            }
        });
    }
}
