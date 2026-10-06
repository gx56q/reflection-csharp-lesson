using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Reflection.Randomness;

public class Generator<T> where T : new()
{
    private readonly Func<Random, T> factory;

    public Generator()
    {
        var distributions = CreateDistributionsFromAttributes();
        factory = CreateFactory(distributions);
    }

    public T Generate(Random rnd) => factory(rnd);

    private static Func<Random, T> CreateFactory(
        Dictionary<PropertyInfo, IContinuousDistribution> distributions)
    {
        var rnd = Expression.Parameter(typeof(Random), "rnd");
        var generateMethod = typeof(IContinuousDistribution)
            .GetMethod(nameof(IContinuousDistribution.Generate))!;
        var bindings = new List<MemberAssignment>();

        foreach (var (property, distribution) in distributions)
        {
            var distributionNode = Expression.Constant(
                distribution, typeof(IContinuousDistribution));
            var generateCall = Expression.Call(distributionNode, generateMethod, rnd);
            bindings.Add(Expression.Bind(property, generateCall));
        }

        var body = Expression.MemberInit(Expression.New(typeof(T)), bindings);
        var tree = Expression.Lambda<Func<Random, T>>(body, rnd);
        return tree.Compile();
    }

    private static Dictionary<PropertyInfo, IContinuousDistribution>
        CreateDistributionsFromAttributes()
    {
        var result = new Dictionary<PropertyInfo, IContinuousDistribution>();
        foreach (var property in typeof(T).GetProperties())
        {
            var attribute = property.GetCustomAttribute<FromDistributionAttribute>();
            if (attribute == null) continue;
            result.Add(property, CreateDistribution(attribute.Distribution, attribute.Parameters));
        }
        return result;
    }

    private static IContinuousDistribution CreateDistribution(Type type, object[] parameters)
    {
        if (!typeof(IContinuousDistribution).IsAssignableFrom(type))
            throw new ArgumentException($"{type.Name} must implement IContinuousDistribution");
        var parameterTypes = parameters.Select(p => p.GetType()).ToArray();
        var constructor = type.GetConstructor(parameterTypes)
            ?? throw new ArgumentException($"Constructor not found for {type.Name}");
        return (IContinuousDistribution)constructor.Invoke(parameters);
    }
}

[AttributeUsage(AttributeTargets.Property)]
public class FromDistributionAttribute(Type distribution, params object[] parameters) : Attribute
{
    public Type Distribution { get; } = distribution;
    public object[] Parameters { get; } = parameters;
}
