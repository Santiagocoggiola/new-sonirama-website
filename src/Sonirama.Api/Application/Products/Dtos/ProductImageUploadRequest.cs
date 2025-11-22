using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Sonirama.Api.Application.Products.Dtos;

public sealed class ProductImageUploadRequest
{
    [Required(ErrorMessage = "Debes adjuntar al menos una imagen.")]
    [MaxLength(10, ErrorMessage = "Puedes enviar hasta 10 imágenes por solicitud.")]
    public List<IFormFile> Files { get; set; } = new();
}
