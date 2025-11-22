using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Moq;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using Sonirama.Api.Infrastructure.Images;
using Xunit;

namespace Sonirama.Api.Tests.Infrastructure;

public sealed class ProductImageStorageTests : IDisposable
{
    private readonly string _tempRoot;
    private readonly Mock<IWebHostEnvironment> _envMock = new();
    private readonly ProductImageStorage _storage;

    public ProductImageStorageTests()
    {
        _tempRoot = Path.Combine(Path.GetTempPath(), "sonirama-tests", Guid.NewGuid().ToString());
        Directory.CreateDirectory(_tempRoot);
        _envMock.SetupGet(e => e.WebRootPath).Returns(_tempRoot);
        _envMock.SetupGet(e => e.ContentRootPath).Returns(_tempRoot);
        _storage = new ProductImageStorage(_envMock.Object);
    }

    [Fact]
    public async Task SaveAsync_ShouldConvertPngToWebp()
    {
    var file = CreateFormFile(CreateTinyPngBytes(), "image/png", "photo.png");

        var result = await _storage.SaveAsync("PR-001", file, CancellationToken.None);

        result.FileName.Should().EndWith(".webp");
        result.RelativePath.Should().Contain("pr-001");

        var absolutePath = Path.Combine(_tempRoot, result.RelativePath.Replace('/', Path.DirectorySeparatorChar));
        File.Exists(absolutePath).Should().BeTrue();
        new FileInfo(absolutePath).Length.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task SaveAsync_ShouldKeepOriginalWebp()
    {
    var file = CreateFormFile(CreateFakeWebpBytes(), "image/webp", "photo.webp");

        var result = await _storage.SaveAsync("PR-002", file, CancellationToken.None);

        result.FileName.Should().EndWith(".webp");
        var absolutePath = Path.Combine(_tempRoot, result.RelativePath.Replace('/', Path.DirectorySeparatorChar));
        File.Exists(absolutePath).Should().BeTrue();
    }

    private static IFormFile CreateFormFile(byte[] bytes, string contentType, string fileName)
    {
        var stream = new MemoryStream(bytes);
        var file = new FormFile(stream, 0, bytes.Length, "files", fileName)
        {
            Headers = new HeaderDictionary { { "Content-Type", new StringValues(contentType) } },
            ContentType = contentType
        };
        stream.Position = 0;
        return file;
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_tempRoot))
            {
                Directory.Delete(_tempRoot, true);
            }
        }
        catch
        {
            // ignored
        }
    }

    private static byte[] CreateTinyPngBytes()
    {
        using var image = new Image<Rgba32>(1, 1, new Rgba32(200, 50, 50, 255));
        using var ms = new MemoryStream();
        image.SaveAsPng(ms);
        return ms.ToArray();
    }

    private static byte[] CreateFakeWebpBytes() => new byte[]
    {
        (byte)'R', (byte)'I', (byte)'F', (byte)'F', 0x2C, 0x00, 0x00, 0x00,
        (byte)'W', (byte)'E', (byte)'B', (byte)'P', 0x56, 0x50, 0x38, 0x4C
    };
}
