using System;
using System.Reflection;

var cat = new Cat { Name = "Барсик", Sleep = 16 };
var type = typeof(Cat);
Console.WriteLine($"Тип: {type.Name}");
foreach (var property in type.GetProperties())
{
    Console.WriteLine($"{property.Name}: {property.PropertyType.Name} = {property.GetValue(cat)}");
    var range = property.GetCustomAttribute<RandomRangeAttribute>();
    if (range != null)
        Console.WriteLine($"  Настройка: от {range.Min} до {range.Max}");
}
var nameProperty = type.GetProperty(nameof(Cat.Name))!;
nameProperty.SetValue(cat, "Кусь");
Console.WriteLine($"Теперь имя: {cat.Name}");

public class Cat
{
    public string Name { get; set; } = "";
    [RandomRange(12, 20)]
    public double Sleep { get; set; }
}

[AttributeUsage(AttributeTargets.Property)]
public class RandomRangeAttribute(double min, double max) : Attribute
{
    public double Min { get; } = min;
    public double Max { get; } = max;
}
