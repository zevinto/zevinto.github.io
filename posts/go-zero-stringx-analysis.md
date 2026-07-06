---
title: "go-zero 源码解析 · core/stringx"
date: 2026-07-06 09:00:00
tags: [Golang,go-zero]
description: go-zero 的字符串工具包。
---
# go-zero 源码解析 · core/stringx

> 包路径：`github.com/zeromicro/go-zero/core/stringx`
>
> 源文件：`strings.go` · `random.go` · `replacer.go` · `trie.go` · `node.go`
>
> 外部依赖：`core/lang`（内部）· `crypto/rand` · `math/rand` · `slices` · `unicode`

---

## 1. 包概览

`stringx` 是 go-zero 的字符串工具包，构建在 `core/lang` 之上，分为四个功能模块：

| 模块 | 文件 | 核心职责 |
|------|------|----------|
| 基础工具 | `strings.go` | 过滤、截取、拼接、转换 |
| 随机生成 | `random.go` | 随机串 / 随机 ID / 种子控制 |
| 批量替换 | `replacer.go` + `node.go` | 基于 Aho-Corasick 的多模式替换 |
| 敏感词过滤 | `trie.go` + `node.go` | 关键词检测与字符屏蔽 |

`replacer` 和 `trie` 共用同一套底层 Aho-Corasick 节点结构（`node.go`），这是本包设计上最值得关注的地方。

---

## 2. strings.go — 基础工具函数

### 2.1 错误变量

```go
var (
    ErrInvalidStartPosition = errors.New("start position is invalid")
    ErrInvalidStopPosition  = errors.New("stop position is invalid")
)
```

仅由 `Substr` 使用。使用具名 error 变量（而非 `fmt.Errorf` 每次新建），便于调用方用 `errors.Is` 精确判断错误类型。

---

### 2.2 Filter — rune 级原地过滤

```go
func Filter(s string, filter func(r rune) bool) string {
    var n int
    chars := []rune(s)
    for i, x := range chars {
        if n < i {
            chars[n] = x
        }
        if !filter(x) {
            n++
        }
    }
    return string(chars[:n])
}
```

**实现细节：** 先将字符串转为 `[]rune`，然后做**原地压缩**——用双指针 `n`（写指针）和 `i`（读指针）在同一个切片上完成过滤，避免分配额外的输出数组。`filter` 返回 `false`（即保留该字符）时 `n` 才递增。

注意：`filter` 的语义是**"是否过滤掉"**，返回 `true` 表示丢弃，返回 `false` 表示保留。这与"谓词"函数通常的惯例相反，使用时需留意。

```go
// 移除所有空格（filter 返回 true = 丢弃）
stringx.Filter("hello world", func(r rune) bool { return r == ' ' })
// → "helloworld"

// 保留数字（filter 返回 true = 丢弃非数字）
stringx.Filter("abc123def", func(r rune) bool { return !unicode.IsDigit(r) })
// → "123"
```

---

### 2.3 FirstN — UTF-8 安全截取

```go
func FirstN(s string, n int, ellipsis ...string) string {
    var i int
    for j := range s {         // j 是字节偏移，i 是 rune 计数
        if i == n {
            ret := s[:j]       // 字节切片，但 j 正好是第 n 个 rune 的字节起始位置
            for _, each := range ellipsis {
                ret += each
            }
            return ret
        }
        i++
    }
    return s
}
```

**实现细节：** 直接 `range s` 遍历字符串（Go 的 `range string` 按 rune 迭代，`j` 是字节偏移，`i` 是 rune 序号）。当 rune 数达到 `n` 时，`j` 恰好是第 n+1 个 rune 的字节起始位置，`s[:j]` 就是前 n 个 rune 的原始字节串——无需 `[]rune` 转换，零额外分配（除追加省略号外）。

```go
stringx.FirstN("你好世界", 2)            // → "你好"
stringx.FirstN("Hello World", 5, "...") // → "Hello..."
stringx.FirstN("Hi", 10)               // → "Hi"（不足时返回原串）
```

---

### 2.4 HasEmpty / NotEmpty

```go
func HasEmpty(args ...string) bool {
    for _, arg := range args {
        if len(arg) == 0 {   // len() 对空串为 0，不调用 utf8.RuneCountInString
            return true
        }
    }
    return false
}

func NotEmpty(args ...string) bool {
    return !HasEmpty(args...)  // 直接复用，无重复逻辑
}
```

用 `len(arg) == 0` 而非 `arg == ""`，两者语义相同但 `len()` 在编译器层面是常量时间操作，无字符串比较开销。

---

### 2.5 Join — 跳过空元素的拼接

```go
func Join(sep byte, elem ...string) string {
    var size int
    for _, e := range elem {
        size += len(e)
    }
    if size == 0 {
        return ""
    }

    buf := make([]byte, 0, size+len(elem)-1)  // 预分配：内容长度 + 最多 len-1 个分隔符
    for _, e := range elem {
        if len(e) == 0 {
            continue           // 跳过空元素
        }
        if len(buf) > 0 {
            buf = append(buf, sep)
        }
        buf = append(buf, e...)
    }
    return string(buf)
}
```

**两次遍历设计：** 第一次遍历统计总长度并预分配，第二次遍历写入内容。这避免了 `strings.Builder` 的动态扩容，整个过程只分配一次内存（加上最终 `string(buf)` 的一次拷贝）。

`sep` 是 `byte` 而非 `string`：分隔符在实践中几乎总是单个 ASCII 字符，`byte` 参数既简洁，`append(buf, sep)` 也比 `append(buf, sep...)` 更高效。

```go
strings.Join([]string{"a", "", "b"}, ",")  // → "a,,b"（标准库，空元素不跳过）
stringx.Join(',', "a", "", "b")            // → "a,b"（go-zero，跳过空元素）
```

---

### 2.6 Remove — 原地删除指定元素

```go
func Remove(strings []string, strs ...string) []string {
    out := append([]string(nil), strings...)  // 拷贝，不修改原切片

    for _, str := range strs {
        var n int
        for _, v := range out {
            if v != str {
                out[n] = v
                n++
            }
        }
        out = out[:n]
    }
    return out
}
```

**实现细节：**

- `append([]string(nil), strings...)` 是 Go 中拷贝切片的惯用写法，等价于 `make + copy`，但更简洁。
- 对每个待删除的字符串，做一次线性扫描原地压缩。时间复杂度 O(n × m)（n 为原切片长度，m 为待删除元素数量）。
- **没有使用 map 去重**——因为 `strs` 通常数量极少（1~3 个），线性扫描比 map 构建更快。

```go
// goctl 生成的 Model 代码中的实际使用（最高频调用场景）
userRowsExpectAutoSet = strings.Join(
    stringx.Remove(userFieldNames, "`id`", "`create_time`", "`update_time`"),
    ",",
)
```

---

### 2.7 Reverse

```go
func Reverse(s string) string {
    runes := []rune(s)
    slices.Reverse(runes)   // 标准库 slices.Reverse，Go 1.21+
    return string(runes)
}
```

直接委托给标准库 `slices.Reverse`，UTF-8 安全。

---

### 2.8 Substr — rune 安全子串

```go
func Substr(str string, start, stop int) (string, error) {
    rs := []rune(str)
    length := len(rs)

    if start < 0 || start > length {
        return "", ErrInvalidStartPosition
    }
    if stop < 0 || stop > length {
        return "", ErrInvalidStopPosition
    }

    return string(rs[start:stop]), nil
}
```

注意边界条件：`start == length` 合法（空子串），`stop < start` 不会报错（返回 `""` 但不 panic，因为 Go 切片允许 `rs[n:n]`）。若需要强校验 `stop >= start`，调用方需自行处理。

```go
stringx.Substr("Hello, 世界", 7, 9)  // → "世界", nil
stringx.Substr("abc", 5, 6)          // → "", ErrInvalidStartPosition
stringx.Substr("abc", 0, 10)         // → "", ErrInvalidStopPosition
```

---

### 2.9 TakeOne / TakeWithPriority

```go
func TakeOne(valid, or string) string {
    if len(valid) > 0 {
        return valid
    }
    return or
}

func TakeWithPriority(fns ...func() string) string {
    for _, fn := range fns {
        val := fn()
        if len(val) > 0 {
            return val
        }
    }
    return ""
}
```

`TakeWithPriority` 的**惰性求值**是关键：只调用必要的函数，拿到非空结果立即返回。适合有 IO 操作或计算开销的取值场景。

```go
// 服务名按优先级解析：环境变量 > 配置文件 > 进程名
name := stringx.TakeWithPriority(
    func() string { return os.Getenv("SERVICE_NAME") },
    func() string { return config.ServiceName },
    func() string { return filepath.Base(os.Args[0]) },
)
```

---

### 2.10 ToCamelCase

```go
func ToCamelCase(s string) string {
    for i, v := range s {
        return string(unicode.ToLower(v)) + s[i+1:]
    }
    return ""
}
```

**实现细节极为精妙：** 利用 `for range` 遍历字符串的特性——第一次迭代 `i` 是首个 rune 的字节偏移（ASCII 时为 0），`v` 是首个 rune 的值。函数在第一次迭代就 `return`，仅处理首字符。`s[i+1:]` 是从第二个字节开始的剩余字符串（因为首字符若为 ASCII，`i+1` 恰为第二个字节起始；若为多字节字符，`unicode.ToLower` 后的 `string(v)` 和 `s[i+utf8.RuneLen(v):]` 才是正确写法——这里存在一个潜在 bug：若首字符是多字节且大小写转换后字节长度不同，`s[i+1:]` 会切错位置）。

对于实际使用（ASCII 英文首字母转小写），这个实现完全正确且极度高效——不分配任何中间切片，直接在字节级别操作。

```go
stringx.ToCamelCase("UserName")  // → "userName"
stringx.ToCamelCase("API")       // → "aPI"（仅首字母）
stringx.ToCamelCase("")          // → ""（空串走 for 循环体为 0 次，返回 ""）
```

---

### 2.11 Union

```go
func Union(first, second []string) []string {
    set := make(map[string]lang.PlaceholderType)

    for _, each := range first {
        set[each] = lang.Placeholder
    }
    for _, each := range second {
        set[each] = lang.Placeholder
    }

    merged := make([]string, 0, len(set))
    for k := range set {
        merged = append(merged, k)
    }
    return merged
}
```

`lang.PlaceholderType`（即 `struct{}`）作为 map value，零内存开销。遍历 map 时顺序不确定，**结果顺序不保证稳定**。这是 `lang.PlaceholderType` 在 stringx 中的直接使用实例。

---

## 3. random.go — 随机字符串生成

### 3.1 字符集与常量

```go
const (
    letterBytes    = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    letterIdxBits  = 6                         // 6 位可表示 0~63，覆盖 62 个字符
    idLen          = 8
    defaultRandLen = 8
    letterIdxMask  = 1<<letterIdxBits - 1      // = 0b111111 = 63（低 6 位全 1）
    letterIdxMax   = 63 / letterIdxBits        // = 10（一个 int63 可出 10 个字符索引）
)
```

`letterBytes` 包含大小写字母和数字，共 62 个字符，有别于上文文档中"只含小写+数字"的错误描述——**实际包含大写字母**。

---

### 3.2 并发安全的随机源

```go
var src = newLockedSource(time.Now().UnixNano())

type lockedSource struct {
    source rand.Source
    lock   sync.Mutex
}

func (ls *lockedSource) Int63() int64 {
    ls.lock.Lock()
    defer ls.lock.Unlock()
    return ls.source.Int63()
}
```

`math/rand.Source` 本身不是并发安全的，`lockedSource` 用 `sync.Mutex` 包装，使全局 `src` 可安全地在多 goroutine 中使用。用 `time.Now().UnixNano()` 作初始种子，保证每次进程启动序列不同。

---

### 3.3 Randn — 高性能随机字符串

```go
func Randn(n int) string {
    b := make([]byte, n)
    for i, cache, remain := n-1, src.Int63(), letterIdxMax; i >= 0; {
        if remain == 0 {
            cache, remain = src.Int63(), letterIdxMax
        }
        if idx := int(cache & letterIdxMask); idx < len(letterBytes) {
            b[i] = letterBytes[idx]
            i--
        }
        cache >>= letterIdxBits
        remain--
    }
    return string(b)
}
```

**核心优化：一次 `Int63()` 调用产出多个字符。**

`math/rand` 每次调用 `Int63()` 产出 63 个随机位。每个字符索引只需 6 位（`letterIdxBits = 6`），因此一次调用可以提取 `63 / 6 = 10` 个索引（`letterIdxMax = 10`），大幅减少加锁次数。

算法步骤（以 `n=16` 为例）：
1. 调用 `src.Int63()` 得到 63 位随机数，存入 `cache`
2. 取低 6 位（`cache & letterIdxMask`）作为字符索引
3. 若索引 < 62（有效），写入 `b[i]`，`i--`；若 >= 62 则丢弃（拒绝采样，保证均匀分布）
4. 右移 6 位（`cache >>= letterIdxBits`），`remain--`
5. `remain == 0` 时重新调用 `Int63()` 补充随机位

这是经典的 **bit-manipulation + rejection sampling** 技巧，比每次调用 `rand.Intn(62)` 快约 10 倍（减少 10x 的互斥锁争用）。

---

### 3.4 RandId — 加密安全随机 ID

```go
func RandId() string {
    b := make([]byte, idLen)
    _, err := crand.Read(b)   // crypto/rand，OS 级随机源
    if err != nil {
        return Randn(idLen)   // 降级到伪随机
    }
    return fmt.Sprintf("%x%x%x%x", b[0:2], b[2:4], b[4:6], b[6:8])
}
```

使用 `crypto/rand`（操作系统的随机源，如 `/dev/urandom`），而非伪随机。生成 8 字节随机数后用 `%x` 格式化为 16 位十六进制字符串。`crypto/rand.Read` 极少出错，出错时降级到 `Randn`，保证函数永不 panic。

`Rand()` 和 `Randn(n)` 使用 `math/rand`（伪随机，速度快）；`RandId()` 使用 `crypto/rand`（真随机，适合安全敏感场景如 Token、Session ID）。

---

## 4. node.go — Aho-Corasick 节点

`node.go` 是整个 stringx 包算法层面最复杂的文件，`replacer` 和 `trie` 共用它。

### 4.1 节点结构

```go
type node struct {
    children map[rune]*node  // 子节点映射（支持全 Unicode）
    fail     *node           // 失败链接（Aho-Corasick 核心）
    depth    int             // 节点深度（= 从根到此节点的路径长度）
    end      bool            // 是否为某关键词的末尾
}
```

用 `map[rune]*node` 而非固定大小数组，天然支持中文等全 Unicode 字符，内存占用随实际字符数线性增长（稀疏友好）。

---

### 4.2 add — 插入关键词

```go
func (n *node) add(word string) {
    chars := []rune(word)
    if len(chars) == 0 {
        return
    }
    nd := n
    for i, char := range chars {
        if nd.children == nil {
            child := new(node)
            child.depth = i + 1
            nd.children = map[rune]*node{char: child}
            nd = child
        } else if child, ok := nd.children[char]; ok {
            nd = child
        } else {
            child := new(node)
            child.depth = i + 1
            nd.children[char] = child
            nd = child
        }
    }
    nd.end = true
}
```

标准 Trie 插入：从根节点沿字符路径走，不存在则新建节点，`depth` 记录节点深度（用于 `find` 中计算匹配词的起始位置 `i+1-child.depth`）。

---

### 4.3 build — 构建失败链接（BFS）

```go
func (n *node) build() {
    var nodes []*node
    // 根节点的直接子节点：fail 指向根
    for _, child := range n.children {
        child.fail = n
        nodes = append(nodes, child)
    }
    // BFS 处理其余节点
    for len(nodes) > 0 {
        nd := nodes[0]
        nodes = nodes[1:]
        for key, child := range nd.children {
            nodes = append(nodes, child)
            cur := nd
            for cur != nil {
                if cur.fail == nil {     // cur 是根节点
                    child.fail = n
                    break
                }
                if fail, ok := cur.fail.children[key]; ok {
                    child.fail = fail    // 找到最长匹配后缀
                    break
                }
                cur = cur.fail           // 继续沿 fail 链向上找
            }
        }
    }
}
```

这是 Aho-Corasick 算法的核心。`build()` 用 BFS 为每个节点建立**失败链接**：当匹配在当前节点失败时，`fail` 指针指向"已匹配的最长真后缀"对应的节点，使得匹配可以继续而无需回退到文本起始位置。

时间复杂度 O(Σ|word|)，仅需在 `NewTrie` / `NewReplacer` 时构建一次，之后多次 `Filter`/`Replace` 均为 O(n)。

---

### 4.4 find — 多模式匹配

```go
func (n *node) find(chars []rune) []scope {
    var scopes []scope
    size := len(chars)
    cur := n

    for i := 0; i < size; i++ {
        child, ok := cur.children[chars[i]]
        if ok {
            cur = child
        } else {
            // 当前字符在 cur 无匹配，沿 fail 链回退
            for cur != n {
                cur = cur.fail
                if child, ok = cur.children[chars[i]]; ok {
                    cur = child
                    break
                }
            }
            if child == nil {
                continue
            }
        }

        // 检查当前节点及其 fail 链上的所有终止节点（处理嵌套匹配）
        for child != n {
            if child.end {
                scopes = append(scopes, scope{
                    start: i + 1 - child.depth,
                    stop:  i + 1,
                })
            }
            child = child.fail
        }
    }
    return scopes
}
```

`find` 返回所有命中词在 `chars` 中的区间 `[start, stop)`。内层 `for child != n` 循环沿 fail 链向上收集，这处理了嵌套匹配的情况（如关键词 "he" 和 "she" 同时存在时，匹配 "she" 后沿 fail 链还能找到 "he"）。

---

## 5. replacer.go — 多模式替换

### 5.1 结构与初始化

```go
type replacer struct {
    *node                        // 嵌入 node，继承 add / build / find
    mapping map[string]string    // 关键词 → 替换词
}

func NewReplacer(mapping map[string]string) Replacer {
    rep := &replacer{
        node:    new(node),
        mapping: mapping,
    }
    for k := range mapping {
        rep.add(k)               // 将所有 key 插入 Trie
    }
    rep.build()                  // 构建失败链接
    return rep
}
```

---

### 5.2 Replace — 最多替换两次

```go
const replaceTimes = 2

func (r *replacer) Replace(text string) string {
    for i := 0; i < replaceTimes; i++ {
        var replaced bool
        if text, replaced = r.doReplace(text); !replaced {
            return text         // 没有命中，提前退出
        }
    }
    return text
}
```

**为什么替换两次？** 注释说明得很清楚："避免替换后产生新的匹配词"。例如 `"ab"→"cd"`，`"cd"→"ef"`，第一次替换生成 `"cd"` 后还需要再替换一次才能得到 `"ef"`。最多 2 次是为了避免无限循环（若 `"ef"→"ab"` 则会死循环）。

---

### 5.3 doReplace — 核心替换逻辑

```go
func (r *replacer) doReplace(text string) (string, bool) {
    chars := []rune(text)
    scopes := r.find(chars)
    if len(scopes) == 0 {
        return text, false
    }

    // 按起始位置升序、同起始位置按长度降序排序（优先匹配更长的词）
    sort.Slice(scopes, func(i, j int) bool {
        if scopes[i].start < scopes[j].start {
            return true
        }
        if scopes[i].start == scopes[j].start {
            return scopes[i].stop > scopes[j].stop
        }
        return false
    })

    var buf strings.Builder
    var index int
    for i := 0; i < len(scopes); i++ {
        scp := &scopes[i]
        if scp.start < index {
            continue               // 跳过与已处理区间重叠的匹配
        }
        buf.WriteString(string(chars[index:scp.start]))
        buf.WriteString(r.mapping[string(chars[scp.start:scp.stop])])
        index = scp.stop
    }
    if index < len(chars) {
        buf.WriteString(string(chars[index:]))
    }
    return buf.String(), true
}
```

重叠处理策略：**先到先得 + 同起始位置取最长**。排序后线性扫描，`scp.start < index` 则跳过（已被更靠前或更长的匹配覆盖）。

---

## 6. trie.go — 敏感词过滤

### 6.1 结构与初始化

```go
const defaultMask = '*'

type trieNode struct {
    node               // 嵌入 node（与 replacer 共用同一套底层实现）
    mask rune          // 屏蔽字符，默认 '*'
}

func NewTrie(words []string, opts ...TrieOption) Trie {
    n := new(trieNode)
    for _, opt := range opts {
        opt(n)
    }
    if n.mask == 0 {
        n.mask = defaultMask
    }
    for _, word := range words {
        n.add(word)
    }
    n.build()
    return n
}
```

函数选项模式（Functional Options）：默认行为（mask='*'）合理，扩展通过 `WithMask` 选项实现，API 向后兼容。

---

### 6.2 Filter — 过滤并屏蔽

```go
func (n *trieNode) Filter(text string) (sentence string, keywords []string, found bool) {
    chars := []rune(text)
    if len(chars) == 0 {
        return text, nil, false
    }

    scopes := n.find(chars)
    keywords = n.collectKeywords(chars, scopes)

    for _, match := range scopes {
        n.replaceWithAsterisk(chars, match.start, match.stop)  // 直接原地修改 chars
    }

    return string(chars), keywords, len(keywords) > 0
}
```

**与 `doReplace` 的关键区别：** `Filter` 不排序、不处理重叠，直接原地将所有命中区间替换为 mask 字符。重叠区间会被多次覆盖（无害，结果相同）。这比 `doReplace` 的排序 + 跳过逻辑更简单，也意味着 `Filter` 不关心"先到先得"——所有命中词都会被屏蔽。

---

### 6.3 collectKeywords — 去重收集命中词

```go
func (n *trieNode) collectKeywords(chars []rune, scopes []scope) []string {
    set := make(map[string]lang.PlaceholderType)
    for _, v := range scopes {
        set[string(chars[v.start:v.stop])] = lang.Placeholder
    }

    var i int
    keywords := make([]string, len(set))
    for k := range set {
        keywords[i] = k
        i++
    }
    return keywords
}
```

再次使用 `lang.PlaceholderType` 实现 Set 去重（同一词多次命中只返回一次）。返回顺序不确定。

---

### 6.4 replaceWithAsterisk

```go
func (n *trieNode) replaceWithAsterisk(chars []rune, start, stop int) {
    for i := start; i < stop; i++ {
        chars[i] = n.mask
    }
}
```

直接在 `[]rune` 上原地修改，无额外分配。

---

## 7. replacer vs trie 设计对比

| 维度 | `replacer` | `trie`（`trieNode`）|
|------|-----------|----------------------|
| 底层节点 | 嵌入 `*node` | 嵌入 `node` |
| 输出类型 | 替换后的字符串 | 替换后的字符串 + 命中词列表 + bool |
| 重叠处理 | 排序，先到先得，跳过重叠 | 不处理，全部覆盖 |
| 替换次数 | 最多 2 次（处理替换后产生新匹配）| 1 次 |
| 替换字符 | `mapping[key]`（任意字符串）| `mask`（单个 rune，默认 `*`）|
| 适合场景 | 脱敏文本替换、多语言本地化 | 敏感词过滤、关键词检测 |

---

## 8. 完整 API 速查

```go
// ── strings.go ────────────────────────────────────────────────────────────
var ErrInvalidStartPosition, ErrInvalidStopPosition error

func Contains(list []string, str string) bool              // Deprecated: slices.Contains
func Filter(s string, filter func(r rune) bool) string     // filter=true 表示丢弃
func FirstN(s string, n int, ellipsis ...string) string
func HasEmpty(args ...string) bool
func Join(sep byte, elem ...string) string                 // 跳过空元素
func NotEmpty(args ...string) bool
func Remove(strings []string, strs ...string) []string
func Reverse(s string) string
func Substr(str string, start, stop int) (string, error)   // [start, stop)，按 rune
func TakeOne(valid, or string) string
func TakeWithPriority(fns ...func() string) string         // 惰性求值
func ToCamelCase(s string) string                          // 仅首字母小写
func Union(first, second []string) []string                // 去重合并，顺序不定

// ── random.go ─────────────────────────────────────────────────────────────
func Rand() string                // = Randn(8)，伪随机，含大小写字母+数字
func RandId() string              // crypto/rand，16 位十六进制，出错降级
func Randn(n int) string          // 伪随机，bit-manipulation 优化，含大小写字母+数字
func Seed(seed int64)             // 设置伪随机种子，主要用于测试

// ── replacer.go ───────────────────────────────────────────────────────────
type Replacer interface { Replace(text string) string }
func NewReplacer(mapping map[string]string) Replacer       // 基于 Aho-Corasick

// ── trie.go ───────────────────────────────────────────────────────────────
type Trie interface {
    Filter(text string) (string, []string, bool)
    FindKeywords(text string) []string
}
type TrieOption func(trie *trieNode)
func NewTrie(words []string, opts ...TrieOption) Trie
func WithMask(mask rune) TrieOption                        // 默认 '*'
```

---

## 9. 设计要点总结

**共享底层算法** — `replacer` 和 `trieNode` 都嵌入 `node`，共用同一套 Aho-Corasick 实现（`add` / `build` / `find`），是 Go 嵌入（embedding）替代继承的典型示范。

**性能意识贯穿始终** — `Join` 两次遍历预分配；`Filter` 原地压缩；`FirstN` 利用 `range string` 的字节偏移避免 `[]rune` 转换；`Randn` 用位运算减少 10x 随机源调用。

**正确性优先于便利性** — `Filter` 的"true=丢弃"语义、`ToCamelCase` 仅处理首字母、`Substr` 对 `stop<start` 不报错，都是实现上的取舍，使用时需理解原意。

**接口隔离** — `Replacer` 和 `Trie` 以接口暴露，具体结构体未导出，便于 mock 测试和未来替换实现。

**`lang` 包的实际使用** — `Union` 和 `collectKeywords` 都用 `map[string]lang.PlaceholderType` 实现 Set 去重，是 lang 包设计意图的直接体现。

---

## 10. 学习路径建议

| 步骤 | 推荐方向 | 关联 |
|------|----------|------|
| 1 | 通读 `strings.go` | 代码量少，可快速建立整体印象，注意 `Filter` 的谓词语义 |
| 2 | 细读 `node.go` | 理解 Aho-Corasick 是读懂 replacer 和 trie 的前提 |
| 3 | 对比 `replacer.go` 与 `trie.go` | 同一 `find` 结果，两种不同的上层处理策略 |
| 4 | 细读 `random.go` 的 `Randn` | 位运算优化随机生成，经典面试题级别的技巧 |
| 5 | 追踪 `redislock.go` 的 `Randn(16)` | 随机字符串在分布式场景的实际意义 |
| 6 | 追踪 `goctl` 对 `Remove` 的调用 | 理解字符串工具在代码生成中的核心作用 |
