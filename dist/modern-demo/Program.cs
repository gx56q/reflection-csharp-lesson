using System.Text.Json;
using System.Text.Json.Serialization;

var method = typeof(Math).GetMethod(nameof(Math.Sin), [typeof(double)])!;
var sin = method.CreateDelegate<Func<double, double>>();
Console.WriteLine(sin(0));

var order = new Order(42, 1290m);
var json = JsonSerializer.Serialize(order, LessonJsonContext.Default.Order);
Console.WriteLine(json);

public record Order(int Id, decimal Total);

[JsonSerializable(typeof(Order))]
internal partial class LessonJsonContext : JsonSerializerContext { }
