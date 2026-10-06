using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.JSInterop;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
var host = builder.Build();
await Runner.Initialize(new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
await host.Services.GetRequiredService<IJSRuntime>().InvokeVoidAsync("runtimeReady");
await host.RunAsync();

public static class Runner
{
    private static readonly List<MetadataReference> References = [];

    public static async Task Initialize(HttpClient client)
    {
        string[] assemblies = ["System.Private.CoreLib", "System.Runtime", "System.Console",
            "System.Collections", "System.Linq", "System.Linq.Expressions", "System.Reflection",
            "System.Reflection.Primitives", "System.Runtime.Extensions", "System.ObjectModel",
            "System.Threading", "System.Threading.Tasks", "System.Memory", "netstandard"];
        foreach (var name in assemblies)
            References.Add(MetadataReference.CreateFromImage(
                await client.GetByteArrayAsync($"_framework/{name}.dll")));
    }

    [JSInvokable]
    public static async Task<string> Run(string code)
    {
        if (code.Length > 40000)
            return "Пример слишком большой: оставь до 40 000 символов.";
        var tree = CSharpSyntaxTree.ParseText(code, new CSharpParseOptions(LanguageVersion.CSharp12));
        var compilation = CSharpCompilation.Create("Experiment_" + Guid.NewGuid().ToString("N"),
            [tree], References, new CSharpCompilationOptions(OutputKind.ConsoleApplication));
        using var image = new MemoryStream();
        var result = compilation.Emit(image);
        if (!result.Success)
            return string.Join("\n", result.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error)
                .Select(d => $"Строка {d.Location.GetLineSpan().StartLinePosition.Line + 1}: {d.Id} — {d.GetMessage()}"));

        var previous = Console.Out;
        using var output = new LimitedWriter();
        Console.SetOut(output);
        try
        {
            var assembly = Assembly.Load(image.ToArray());
            var entry = assembly.EntryPoint!;
            var returned = entry.Invoke(null, entry.GetParameters().Length == 0 ? null : [Array.Empty<string>()]);
            if (returned is Task task) await task;
            return output.ToString() is { Length: > 0 } text ? text : "Программа завершилась без вывода.";
        }
        catch (Exception error)
        {
            var cause = error is TargetInvocationException { InnerException: not null } wrapped
                ? wrapped.InnerException : error;
            return output + $"\n{cause!.GetType().Name}: {cause.Message}";
        }
        finally { Console.SetOut(previous); }
    }

    private sealed class LimitedWriter : TextWriter
    {
        private readonly StringBuilder buffer = new();
        public override Encoding Encoding => Encoding.UTF8;
        public override void Write(char value)
        {
            if (buffer.Length >= 30000) throw new InvalidOperationException("Вывод превысил 30 000 символов.");
            buffer.Append(value);
        }
        public override string ToString() => buffer.ToString();
    }
}
