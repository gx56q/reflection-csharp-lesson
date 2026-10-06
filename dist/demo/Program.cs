using System.Linq.Expressions;
using System.Reflection;

// Самостоятельная демонстрация для .NET 8. Не файл для сдачи в ulearn.
Console.WriteLine("1. Метаданные и свойство");
var person = new Person { Name = "Аня" };
var nameProperty = typeof(Person).GetProperty(nameof(Person.Name))!;
Console.WriteLine($"{nameProperty.Name}: {nameProperty.PropertyType.Name}");
nameProperty.SetValue(person, "Оля");
Console.WriteLine(person.Name);

Console.WriteLine("2. Генерация объектов");
var slow = new BaselineGenerator<Sample>();
var fast = new Generator<Sample>();
var a = slow.Generate(new Random(42));
var b = fast.Generate(new Random(42));
Console.WriteLine($"Одинаковые значения: {a.Delay == b.Delay}");
Console.WriteLine("Численные значения seed не считаем контрактом между версиями .NET.");

Console.WriteLine("3. Код как дерево");
Expression<Func<double, double>> square = x => x * x;
Console.WriteLine(square.Body.NodeType);
Console.WriteLine(square.Compile()(3));

Console.WriteLine("4. Символьная производная");
Expression<Func<double, double>> function = x => Math.Sin(x * x);
var derivative = Algebra.Differentiate(function);
Console.WriteLine(derivative);
Console.WriteLine($"Производная в нуле: {derivative.Compile()(0)}");

public class Person
{
    public string Name { get; set; } = "";
}

public interface IContinuousDistribution
{
    double Generate(Random random);
}

public class ExponentialDistribution(double rate) : IContinuousDistribution
{
    public double Generate(Random random) => -Math.Log(1 - random.NextDouble()) / rate;
}

[AttributeUsage(AttributeTargets.Property)]
public class FromDistributionAttribute(Type distribution, params object[] parameters) : Attribute
{
    public Type Distribution { get; } = distribution;
    public object[] Parameters { get; } = parameters;
}

public class Sample
{
    [FromDistribution(typeof(ExponentialDistribution), 2.0)]
    public double Delay { get; set; }

    public string Label { get; set; } = "Остаётся значение из конструктора";
}

public static class Configuration<T>
{
    // Учебное ограничение: атрибуты с ненулевыми аргументами точных типов конструктора.
    public static List<(PropertyInfo Property, IContinuousDistribution Distribution)> Read()
    {
        var result = new List<(PropertyInfo, IContinuousDistribution)>();
        foreach (var property in typeof(T).GetProperties(BindingFlags.Instance | BindingFlags.Public))
        {
            var attribute = property.GetCustomAttribute<FromDistributionAttribute>();
            if (attribute == null) continue;
            if (property.PropertyType != typeof(double) || property.SetMethod?.IsPublic != true
                || property.GetIndexParameters().Length != 0)
                throw new ArgumentException($"Свойство {property.Name}: нужен публичный double с сеттером без индекса.");
            var type = attribute.Distribution;
            if (!typeof(IContinuousDistribution).IsAssignableFrom(type) || type.IsAbstract)
                throw new ArgumentException($"{type.Name}: нужен конкретный IContinuousDistribution.");
            if (attribute.Parameters.Any(argument => argument == null))
                throw new ArgumentException($"{property.Name}: null-аргументы в демонстрации не поддержаны.");
            var types = attribute.Parameters.Select(argument => argument.GetType()).ToArray();
            var constructor = type.GetConstructor(types)
                ?? throw new ArgumentException($"Не найден конструктор {type.Name} для {property.Name}.");
            var distribution = (IContinuousDistribution)constructor.Invoke(attribute.Parameters);
            result.Add((property, distribution));
        }
        return result;
    }
}

public class BaselineGenerator<T> where T : class, new()
{
    private readonly List<(PropertyInfo Property, IContinuousDistribution Distribution)> properties = Configuration<T>.Read();

    public T Generate(Random random)
    {
        var result = new T();
        foreach (var (property, distribution) in properties)
            property.SetValue(result, distribution.Generate(random));
        return result;
    }
}

public class Generator<T> where T : new()
{
    private readonly Func<Random, T> factory;

    public Generator()
    {
        var random = Expression.Parameter(typeof(Random), "random");
        var generate = typeof(IContinuousDistribution).GetMethod(nameof(IContinuousDistribution.Generate))!;
        var bindings = new List<MemberBinding>();
        foreach (var (property, distribution) in Configuration<T>.Read())
        {
            var call = Expression.Call(
                Expression.Constant(distribution, typeof(IContinuousDistribution)), generate, random);
            bindings.Add(Expression.Bind(property, call));
        }
        var body = Expression.MemberInit(Expression.New(typeof(T)), bindings);
        factory = Expression.Lambda<Func<Random, T>>(body, random).Compile();
    }

    public T Generate(Random random) => factory(random);
}

public static class Algebra
{
    private static readonly MethodInfo Sin = typeof(Math).GetMethod(nameof(Math.Sin), [typeof(double)])!;
    private static readonly MethodInfo Cos = typeof(Math).GetMethod(nameof(Math.Cos), [typeof(double)])!;

    public static Expression<Func<double, double>> Differentiate(Expression<Func<double, double>> function)
    {
        var parameter = function.Parameters[0];
        Expression Diff(Expression node) => node switch
        {
            ConstantExpression => Expression.Constant(0.0),
            ParameterExpression p when p == parameter => Expression.Constant(1.0),
            BinaryExpression b when b.NodeType == ExpressionType.Add => Expression.Add(Diff(b.Left), Diff(b.Right)),
            BinaryExpression b when b.NodeType == ExpressionType.Multiply => Expression.Add(
                Expression.Multiply(Diff(b.Left), b.Right), Expression.Multiply(b.Left, Diff(b.Right))),
            MethodCallExpression c when c.Method == Sin => Expression.Multiply(
                Expression.Call(Cos, c.Arguments[0]), Diff(c.Arguments[0])),
            MethodCallExpression c when c.Method == Cos => Expression.Negate(Expression.Multiply(
                Expression.Call(Sin, c.Arguments[0]), Diff(c.Arguments[0]))),
            _ => throw new ArgumentException($"Не поддержан узел {node.NodeType}: {node}")
        };
        return Expression.Lambda<Func<double, double>>(Diff(function.Body), function.Parameters);
    }
}
