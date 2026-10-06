window.experiments = [
  {
    title: 'У объекта есть паспорт', time: '07–22', topic: 'Type и свойства',
    prompt: 'Запусти. Добавь коту ещё одно свойство — появится ли оно в списке без правки foreach?',
    challenge: 'Поменяй имя свойства на несуществующее. Кто заметит ошибку: компилятор или программа?',
    takeaway: 'Type описывает тип. PropertyInfo позволяет обратиться к свойству конкретного объекта. Имя из строки проверяется во время выполнения.',
    read: 'basics',
    action: 'Сломать имя свойства',
    breakFrom: 'nameof(Cat.Name)', breakTo: '"ГдеМойКорм"',
    code: `using System;
using System.Reflection;

var cat = new Cat { Name = "Барсик", Lives = 9 };
Console.WriteLine($"Тип: {cat.GetType().Name}");
foreach (var property in cat.GetType().GetProperties())
    Console.WriteLine($"{property.Name}: {property.PropertyType.Name} = {property.GetValue(cat)}");

var name = typeof(Cat).GetProperty(nameof(Cat.Name))!;
name.SetValue(cat, "Генеральный директор по сну");
Console.WriteLine($"Теперь: {cat.Name}");

public class Cat
{
    public string Name { get; set; } = "";
    public int Lives { get; set; }
}`
  },
  {
    title: 'Атрибут ничего не колдует', time: '22–35', topic: 'Атрибуты и генерация',
    prompt: 'Это генератор характеристик кота. Меняй границы в атрибутах и запускай снова.',
    challenge: 'Убери атрибут у одного свойства. Изменится ли значение само по себе?',
    takeaway: 'Атрибут хранит настройку. Генератор читает её и присваивает значение. Без этого кода квадратные скобки ничего не генерируют.',
    read: 'random', action: 'Убрать атрибут', breakFrom: '[RandomRange(3, 10)]', breakTo: '// [RandomRange(3, 10)]',
    code: `using System;
using System.Reflection;

var random = new Random(42);
for (var i = 0; i < 4; i++)
{
    var cat = new Cat();
    foreach (var property in typeof(Cat).GetProperties())
    {
        var range = property.GetCustomAttribute<RandomRangeAttribute>();
        if (range == null) continue;
        var value = range.Min + random.NextDouble() * (range.Max - range.Min);
        property.SetValue(cat, value);
    }
    Console.WriteLine($"Сон: {cat.Sleep:F1} ч, наглость: {cat.Audacity:F1}/10");
}

public class Cat
{
    [RandomRange(12, 20)]
    public double Sleep { get; set; }
    [RandomRange(3, 10)]
    public double Audacity { get; set; }
}

[AttributeUsage(AttributeTargets.Property)]
public class RandomRangeAttribute(double min, double max) : Attribute
{
    public double Min { get; } = min;
    public double Max { get; } = max;
}`
  },
  {
    title: 'Лямбда попала на рентген', time: '35–48', topic: 'Дерево выражения',
    prompt: 'Меняй x * x на x + 10 или Math.Sin(x). Посмотри, как меняются дерево и результат.',
    challenge: 'Два параметра с одинаковым именем — один параметр или два разных объекта?',
    takeaway: 'Дерево можно изучить, преобразовать или превратить в делегат. Имя узла — подпись; ссылки на параметр должны вести к тому же объекту.',
    read: 'expressions', action: 'Заменить квадрат на синус', breakFrom: 'x => x * x', breakTo: 'x => Math.Sin(x * x)',
    code: `using System;
using System.Linq.Expressions;

Expression<Func<double, double>> tree = x => x * x;
Console.WriteLine($"Выражение: {tree}");
Print(tree.Body, "");
var function = tree.Compile();
Console.WriteLine($"Результат для 3: {function(3)}");

static void Print(Expression node, string indent)
{
    Console.WriteLine($"{indent}{node.NodeType}: {node}");
    if (node is BinaryExpression binary)
    {
        Print(binary.Left, indent + "  ");
        Print(binary.Right, indent + "  ");
    }
    if (node is MethodCallExpression call)
        foreach (var argument in call.Arguments)
            Print(argument, indent + "  ");
}`
  },
  {
    title: 'Случайность можно заморозить', time: '48–68', topic: 'Фабрика на Expressions',
    prompt: 'Фабрика готовится один раз. Затем вызывается три раза. Числа должны различаться.',
    challenge: 'Подкинь ошибку: вместо вызова генератора в дерево попадёт уже вычисленное число. Случайность закончилась?',
    takeaway: 'Expression.Call описывает будущий вызов. Expression.Constant хранит готовое значение. Compile делаем при подготовке, а не внутри Generate.',
    read: 'activity',
    action: 'Заморозить случайность',
    breakFrom: 'var value = Expression.Call(parameter, nextDouble);',
    breakTo: 'var value = Expression.Constant(random.NextDouble());',
    code: `using System;
using System.Linq.Expressions;

var random = new Random(42);
var parameter = Expression.Parameter(typeof(Random), "rnd");
var nextDouble = typeof(Random).GetMethod(nameof(Random.NextDouble), Type.EmptyTypes)!;
var value = Expression.Call(parameter, nextDouble);
var binding = Expression.Bind(typeof(Loot).GetProperty(nameof(Loot.Luck))!, value);
var body = Expression.MemberInit(Expression.New(typeof(Loot)), binding);
var tree = Expression.Lambda<Func<Random, Loot>>(body, parameter);

Console.WriteLine($"Фабрика: {tree}");
var factory = tree.Compile();
for (var i = 0; i < 3; i++)
    Console.WriteLine($"Выпал лут: удача {factory(random).Luck:F4}");

public class Loot
{
    public double Luck { get; set; }
}`
  },
  {
    title: 'Производная без соседних точек', time: '68–80', topic: 'Символьное дифференцирование',
    prompt: 'Меняй функцию: x * x, Math.Sin(3 * x), Math.Cos(x). Получится новое дерево и значение производной.',
    challenge: 'Попробуй Math.Abs(x). Программа должна честно отказаться, а не сочинять производную.',
    takeaway: 'Мы применяем математические правила к узлам. Для Sin(u) нужен множитель u′. Упрощение результата — отдельная задача.',
    read: 'differentiate', action: 'Попробовать Math.Abs', breakFrom: 'x => Math.Sin(x * x)', breakTo: 'x => Math.Abs(x)',
    code: `using System;
using System.Linq.Expressions;

Expression<Func<double, double>> function = x => Math.Sin(x * x);
var derivative = Expression.Lambda<Func<double, double>>(
    Diff(function.Body), function.Parameters);
Console.WriteLine($"Функция: {function}");
Console.WriteLine($"Производная: {derivative}");
Console.WriteLine($"В точке 1: {derivative.Compile()(1):F6}");

static Expression Diff(Expression node) => node switch
{
    ConstantExpression => Expression.Constant(0.0),
    ParameterExpression => Expression.Constant(1.0),
    BinaryExpression { NodeType: ExpressionType.Add } b =>
        Expression.Add(Diff(b.Left), Diff(b.Right)),
    BinaryExpression { NodeType: ExpressionType.Multiply } b =>
        Expression.Add(Expression.Multiply(Diff(b.Left), b.Right),
            Expression.Multiply(b.Left, Diff(b.Right))),
    MethodCallExpression call => DiffCall(call),
    _ => throw new ArgumentException($"Не поддержан узел {node.NodeType}: {node}")
};

static Expression DiffCall(MethodCallExpression call)
{
    var sin = typeof(Math).GetMethod(nameof(Math.Sin), new[] { typeof(double) })!;
    var cos = typeof(Math).GetMethod(nameof(Math.Cos), new[] { typeof(double) })!;
    if (call.Method == sin)
        return Expression.Multiply(Expression.Call(cos, call.Arguments[0]), Diff(call.Arguments[0]));
    if (call.Method == cos)
        return Expression.Negate(Expression.Multiply(
            Expression.Call(sin, call.Arguments[0]), Diff(call.Arguments[0])));
    throw new ArgumentException($"Не поддержан метод: {call.Method.DeclaringType}.{call.Method.Name}");
}`
  }
];
