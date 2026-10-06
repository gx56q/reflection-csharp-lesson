using System;
using System.Linq.Expressions;

Func<int, int> function = x => x + 1;
Expression<Func<int, int>> tree = x => x + 1;
Console.WriteLine($"Функция: {function(5)}");
Console.WriteLine($"Дерево: {tree}");
Console.WriteLine($"Действие: {tree.Body.NodeType}");
var preparedFunction = tree.Compile();
Console.WriteLine($"После Compile: {preparedFunction(5)}");

// То же дерево, но собираем сами.
var x = Expression.Parameter(typeof(int), "x");
var one = Expression.Constant(1);
var sum = Expression.Add(x, one);
var manualTree = Expression.Lambda<Func<int, int>>(sum, x);
Console.WriteLine($"Собрали сами: {manualTree}");
Console.WriteLine($"Результат: {manualTree.Compile()(5)}");
