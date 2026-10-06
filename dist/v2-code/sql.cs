using System;
using System.Linq.Expressions;

Expression<Func<Order, bool>> condition = order => order.Total > 1000m;
Console.WriteLine($"Условие: {condition}");
var comparison = (BinaryExpression)condition.Body;
var member = (MemberExpression)comparison.Left;
var constant = (ConstantExpression)comparison.Right;
Console.WriteLine($"Операция: {comparison.NodeType}");
Console.WriteLine($"Свойство: {member.Member.Name}");
Console.WriteLine($"Значение: {constant.Value}");

var (sql, parameter) = Translate(condition);
Console.WriteLine(sql);
Console.WriteLine($"Параметр @p0: {parameter}");

// Учебная модель: только order.Total > число типа decimal.
// Никакого подключения к базе здесь нет.
static (string Sql, decimal Parameter) Translate(Expression<Func<Order, bool>> tree)
{
    if (tree.Body is not BinaryExpression { NodeType: ExpressionType.GreaterThan } comparison)
        throw new ArgumentException("Поддерживаем только сравнение >");
    if (comparison.Left is not MemberExpression member
        || member.Expression != tree.Parameters[0]
        || member.Member.DeclaringType != typeof(Order)
        || member.Member.Name != nameof(Order.Total))
        throw new ArgumentException("Слева должно быть свойство order.Total");
    if (comparison.Right is not ConstantExpression { Value: decimal value })
        throw new ArgumentException("Справа должно быть постоянное число decimal");
    return ("WHERE [Total] > @p0", value);
}

public class Order
{
    public decimal Total { get; set; }
}
