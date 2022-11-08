# 解析相关的边界case

## 1.array vs tuple

```typescript
const a = [1,2]
const b: [number, string] = [1, '2']
```

在ts中数组只是特殊的对象，差别在于：数组的值的key是数字

### array
a 是 number[],  是数组，

a Type.symbol 有值，会表明这是数组, 即 Type.symbol.name is 'Array'

Type.flags is TypeFlags.Object (1 << 19), 
Type.objectFlags is ObjectFlags.Reference (1 << 2) 注释是“Generic type reference”，应该是一种泛型引用数据，等同于 
Array<number>

此时可以 Type as TypeReference

上述的Type 需要看 Type.target，指向的原始类型，即 Array<T>

Type.target.flags is TypeFlags.Object，但是 Type.target.objectFlags equals 6，但ts中没有直接6的定义，所以推测是复合类型, 计算是 6 === ObjectFlags.Reference(1 << 2) & ObjectFlags.Interface (1 << 1)，这个类型可能表示的是 Interface 泛型

以及 Type.typeArguments，对应的是泛型的入参

### tuple
b 是 [number, number], 是 tuple

此时 Type.symbol is undefined, 这表面这也可能是不需要进一步语义说明，也许是原生类型

Type.flags 和 Type.objectFlags 跟上面的一样， 但target不一样

b Type.target.objectFlags equals 12，推测应该是 12 === ObjectFlags.Reference(1 << 2) & ObjectFlags.Tuple (1 << 3)，这个类型可能是 Tuple 泛型

此时的 Type as TupleTypeReference


tuple在结果的JSON里可以转换成数组显示，区别在于tuple类型要加个固定长度限制

> 思考：怎么表示 type Arr<T> = [number, string, ...T[]]

### 总结

结合rest，tuple 可以比 array 描述范围更大，所以在处理上，可以完全用tuple代替数组
