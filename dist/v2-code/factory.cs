using System;
using System.Linq.Expressions;

IContinuousDistribution distribution = new UniformDistribution(12, 20);

// 1. Будущий аргумент функции. Пока здесь нет конкретного Random.
var rnd = Expression.Parameter(typeof(Random), "rnd");
// 2. Уже созданное распределение кладём внутрь дерева.
var distributionNode = Expression.Constant(distribution, typeof(IContinuousDistribution));
// 3. Описание метода. Здесь его ещё НЕ вызываем.
var generateMethod = typeof(IContinuousDistribution)
    .GetMethod(nameof(IContinuousDistribution.Generate))!;
// 4. Будущий вызов distribution.Generate(rnd).
var generateCall = Expression.Call(distributionNode, generateMethod, rnd);
// 5. Будущее присваивание Sleep = результат вызова.
var sleepProperty = typeof(Cat).GetProperty(nameof(Cat.Sleep))!;
var sleepBinding = Expression.Bind(sleepProperty, generateCall);
// 6. Будущее создание new Cat { Sleep = ... }.
var body = Expression.MemberInit(Expression.New(typeof(Cat)), sleepBinding);
// 7. Описание всей функции, затем подготовка делегата.
var tree = Expression.Lambda<Func<Random, Cat>>(body, rnd);
Console.WriteLine(tree);
var factory = tree.Compile();

// Только теперь создаются коты и генерируются числа.
var random = new Random(42);
for (var i = 0; i < 3; i++)
    Console.WriteLine($"Кот {i + 1}: сон {factory(random).Sleep:F2}");

public class Cat
{
    public double Sleep { get; set; }
}

public interface IContinuousDistribution
{
    double Generate(Random rnd);
}

// Учебное распределение для отдельного показа, не замена распределений из домашки.
public class UniformDistribution(double min, double max) : IContinuousDistribution
{
    public double Generate(Random rnd) => min + rnd.NextDouble() * (max - min);
}
