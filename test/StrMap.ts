import * as assert from 'assert'
import { array } from '../src/Array'
import { Option, none, option, some } from '../src/Option'
import { setoidNumber } from '../src/Setoid'
import {
  StrMap,
  fromFoldable,
  getMonoid,
  getSetoid,
  insert,
  isEmpty,
  lookup,
  pop,
  remove,
  size,
  strmap,
  toArray,
  toUnfoldable,
  traverseWithKey
} from '../src/StrMap'
import { traverse } from '../src/Traversable'
import { semigroupSum } from '../src/Semigroup'
import { left, right } from '../src/Either'
import { identity as I, Identity } from '../src/Identity'

const p = (n: number) => n > 2

describe('StrMap', () => {
  it('getMonoid', () => {
    const d1 = new StrMap<number>({ k1: 1, k2: 3 })
    const d2 = new StrMap<number>({ k2: 2, k3: 4 })
    const S1 = getMonoid<number>()
    assert.deepEqual(S1.concat(d1, d2), new StrMap({ k1: 1, k2: 2, k3: 4 }))

    const S2 = getMonoid<number>(semigroupSum)
    assert.deepEqual(S2.concat(d1, d2), new StrMap({ k1: 1, k2: 5, k3: 4 }))
  })

  it('map', () => {
    const d1 = new StrMap<number>({ k1: 1, k2: 2 })
    const double = (n: number): number => n * 2
    assert.deepEqual(d1.map(double), new StrMap({ k1: 2, k2: 4 }))
    assert.deepEqual(strmap.map(d1, double), new StrMap({ k1: 2, k2: 4 }))
  })

  it('reduce', () => {
    const d1 = new StrMap({ k1: 'a', k2: 'b' })
    assert.strictEqual(d1.reduce('', (b, a) => b + a), 'ab')
    const d2 = new StrMap({ k2: 'b', k1: 'a' })
    assert.strictEqual(d2.reduce('', (b, a) => b + a), 'ab')
    assert.strictEqual(strmap.reduce(d1, '', (b, a) => b + a), 'ab')
  })

  it('traverse', () => {
    assert.deepEqual(
      traverse(option, strmap)(new StrMap<number>({ k1: 1, k2: 2 }), n => (n <= 2 ? some(n) : none)),
      some(new StrMap<number>({ k1: 1, k2: 2 }))
    )
    assert.deepEqual(
      traverse(option, strmap)(new StrMap<number>({ k1: 1, k2: 2 }), n => (n >= 2 ? some(n) : none)),
      none
    )
  })

  it('getSetoid', () => {
    assert.strictEqual(getSetoid(setoidNumber).equals(new StrMap({ a: 1 }), new StrMap({ a: 1 })), true)
    assert.strictEqual(getSetoid(setoidNumber).equals(new StrMap({ a: 1 }), new StrMap({ a: 2 })), false)
    assert.strictEqual(getSetoid(setoidNumber).equals(new StrMap({ a: 1 }), new StrMap({ b: 1 })), false)
  })

  it('lookup', () => {
    assert.deepEqual(lookup('a', new StrMap({ a: 1 })), some(1))
    assert.deepEqual(lookup('b', new StrMap({ a: 1 })), none)
  })

  it('fromFoldable', () => {
    assert.deepEqual(fromFoldable(array)([['a', 1]], (existing, a) => existing), new StrMap({ a: 1 }))
    assert.deepEqual(
      fromFoldable(array)([['a', 1], ['a', 2]], (existing, a) => existing),
      new StrMap({
        a: 1
      })
    )
  })

  it('toArray', () => {
    assert.deepEqual(toArray(new StrMap({ a: 1 })), [['a', 1]])
  })

  it('toUnfoldable', () => {
    assert.deepEqual(toUnfoldable(array)(new StrMap({ a: 1 })), [['a', 1]])
  })

  it('mapWithKey', () => {
    assert.deepEqual(new StrMap({ aa: 1 }).mapWithKey((k, a) => a + k.length), new StrMap({ aa: 3 }))
  })

  it('traverseWithKey', () => {
    const d1 = new StrMap({ k1: 1, k2: 2 })
    const t1 = traverseWithKey(option)(d1, (k, n): Option<number> => (k !== 'k1' ? some(n) : none))
    assert.deepEqual(t1, none)
    const d2 = new StrMap({ k1: 2, k2: 3 })
    const t2 = traverseWithKey(option)(d2, (k, n): Option<number> => (k !== 'k3' ? some(n) : none))
    assert.deepEqual(t2, some(new StrMap<number>({ k1: 2, k2: 3 })))
  })

  it('size', () => {
    assert.strictEqual(size(new StrMap({})), 0)
    assert.strictEqual(size(new StrMap({ a: 1 })), 1)
  })

  it('isEmpty', () => {
    assert.strictEqual(isEmpty(new StrMap({})), true)
    assert.strictEqual(isEmpty(new StrMap({ a: 1 })), false)
  })

  it('insert', () => {
    assert.deepEqual(insert('a', 1, new StrMap({})), new StrMap({ a: 1 }))
  })

  it('remove', () => {
    assert.deepEqual(remove('a', new StrMap({ a: 1, b: 2 })), new StrMap({ b: 2 }))
  })

  it('pop', () => {
    assert.deepEqual(pop('a', new StrMap({ a: 1, b: 2 })), some([1, new StrMap({ b: 2 })]))
    assert.deepEqual(pop('c', new StrMap({ a: 1, b: 2 })), none)
  })

  it('insert', () => {
    assert.deepEqual(insert('c', 3, new StrMap({ a: 1, b: 2 })), new StrMap({ a: 1, b: 2, c: 3 }))
  })

  it('compact', () => {
    assert.deepEqual(strmap.compact(new StrMap({ foo: none, bar: some(123) })), new StrMap({ bar: 123 }))
  })

  it('separate', () => {
    assert.deepEqual(strmap.separate(new StrMap({ foo: left(123), bar: right(123) })), {
      left: new StrMap({ foo: 123 }),
      right: new StrMap({ bar: 123 })
    })
  })

  it('filter', () => {
    const d = new StrMap({ a: 1, b: 3 })
    assert.deepEqual(d.filter(p), new StrMap({ b: 3 }))
    assert.deepEqual(strmap.filter(d, p), new StrMap({ b: 3 }))
  })

  it('filterMap', () => {
    const f = (n: number) => (p(n) ? some(n + 1) : none)
    assert.deepEqual(strmap.filterMap(new StrMap<number>({}), f), new StrMap({}))
    assert.deepEqual(strmap.filterMap(new StrMap({ a: 1, b: 3 }), f), new StrMap({ b: 4 }))
  })

  it('partition', () => {
    assert.deepEqual(strmap.partition(new StrMap<number>({}), p), { left: new StrMap({}), right: new StrMap({}) })
    assert.deepEqual(strmap.partition(new StrMap<number>({ a: 1, b: 3 }), p), {
      left: new StrMap({ a: 1 }),
      right: new StrMap({ b: 3 })
    })
  })

  it('partitionMap', () => {
    const f = (n: number) => (p(n) ? right(n + 1) : left(n - 1))
    assert.deepEqual(strmap.partitionMap(new StrMap<number>({}), f), { left: new StrMap({}), right: new StrMap({}) })
    assert.deepEqual(strmap.partitionMap(new StrMap<number>({ a: 1, b: 3 }), f), {
      left: new StrMap({ a: 0 }),
      right: new StrMap({ b: 4 })
    })
  })

  it('wither', () => {
    const witherIdentity = strmap.wither(I)
    const f = (n: number) => new Identity(p(n) ? some(n + 1) : none)
    assert.deepEqual(witherIdentity(new StrMap<number>({}), f), new Identity(new StrMap({})))
    assert.deepEqual(witherIdentity(new StrMap({ a: 1, b: 3 }), f), new Identity(new StrMap({ b: 4 })))
  })

  it('wilt', () => {
    const wiltIdentity = strmap.wilt(I)
    const f = (n: number) => new Identity(p(n) ? right(n + 1) : left(n - 1))
    assert.deepEqual(
      wiltIdentity(new StrMap<number>({}), f),
      new Identity({ left: new StrMap({}), right: new StrMap({}) })
    )
    assert.deepEqual(
      wiltIdentity(new StrMap({ a: 1, b: 3 }), f),
      new Identity({ left: new StrMap({ a: 0 }), right: new StrMap({ b: 4 }) })
    )
  })
})
