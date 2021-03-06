import { Alt2C } from './Alt'
import { Applicative, Applicative2C } from './Applicative'
import { Either } from './Either'
import { Foldable2 } from './Foldable'
import { Functor2 } from './Functor'
import { HKT } from './HKT'
import { Monad2C } from './Monad'
import { Monoid } from './Monoid'
import { Semigroup } from './Semigroup'
import { Setoid } from './Setoid'
import { Traversable2 } from './Traversable'
import { Predicate, phantom, toString } from './function'
import { Bifunctor2 } from './Bifunctor'
import { Compactable2C, Separated } from './Compactable'
import { Option } from './Option'
import { Filterable2C } from './Filterable'
import { Witherable2C } from './Witherable'

// Adapted from https://github.com/purescript/purescript-validation

declare module './HKT' {
  interface URI2HKT2<L, A> {
    Validation: Validation<L, A>
  }
}

export const URI = 'Validation'

export type URI = typeof URI

/**
 * The `Validation` functor, used for applicative validation
 *
 * The `Applicative` instance collects multiple failures in an arbitrary `Semigroup`.
 *
 * @example
 *
 * import { Validation, getApplicative, success, failure } from 'fp-ts/lib/Validation'
 * import { NonEmptyArray, getSemigroup } from 'fp-ts/lib/NonEmptyArray'
 *
 * interface Person {
 *   readonly name: string
 *   readonly age: number
 * }
 *
 * // curried constructor
 * const person = (name: string) => (age: number): Person => ({ name, age })
 *
 * // validators
 * function validateName(input: string): Validation<NonEmptyArray<string>, string> {
 *   return input.length === 0 ? failure(new NonEmptyArray('Invalid name: empty string', [])) : success(input)
 * }
 * function validateAge(input: string): Validation<NonEmptyArray<string>, number> {
 *   const n = parseFloat(input)
 *   if (isNaN(n)) {
 *     return failure(new NonEmptyArray(`Invalid age: not a number ${input}`, []))
 *   }
 *   return n % 1 !== 0 ? failure(new NonEmptyArray(`Invalid age: not an integer ${n}`, [])) : success(n)
 * }
 *
 * // get an `Applicative` instance for Validation<NonEmptyArray<string>, ?>
 * const A = getApplicative(getSemigroup<string>())
 *
 * function validatePerson(input: Record<string, string>): Validation<NonEmptyArray<string>, Person> {
 *   return A.ap(validateName(input['name']).map(person), validateAge(input['age']))
 * }
 *
 * console.log(validatePerson({ name: '', age: '1.2' }))
 * // failure(new NonEmptyArray("Invalid name: empty string", ["Invalid age: not an integer 1.2"]))
 *
 * console.log(validatePerson({ name: 'Giulio', age: '44' }))
 * // success({ "name": "Giulio", "age": 44 })
 *
 * @data
 * @constructor Failure
 * @constructor Success
 * @since 1.0.0
 */
export type Validation<L, A> = Failure<L, A> | Success<L, A>

export class Failure<L, A> {
  readonly _tag: 'Failure' = 'Failure'
  readonly _A!: A
  readonly _L!: L
  readonly _URI!: URI
  constructor(readonly value: L) {}
  map<B>(f: (a: A) => B): Validation<L, B> {
    return this as any
  }
  bimap<V, B>(f: (l: L) => V, g: (a: A) => B): Validation<V, B> {
    return new Failure(f(this.value))
  }
  reduce<B>(b: B, f: (b: B, a: A) => B): B {
    return b
  }
  fold<B>(failure: (l: L) => B, success: (a: A) => B): B {
    return failure(this.value)
  }
  /** Returns the value from this `Success` or the given argument if this is a `Failure` */
  getOrElse(a: A): A {
    return a
  }
  /** Returns the value from this `Success` or the result of given argument if this is a `Failure` */
  getOrElseL(f: (l: L) => A): A {
    return f(this.value)
  }
  mapFailure<M>(f: (l: L) => M): Validation<M, A> {
    return new Failure(f(this.value))
  }
  swap(): Validation<A, L> {
    return new Success(this.value)
  }
  inspect(): string {
    return this.toString()
  }
  toString(): string {
    return `failure(${toString(this.value)})`
  }
  /** Returns `true` if the validation is an instance of `Failure`, `false` otherwise */
  isFailure(): this is Failure<L, A> {
    return true
  }
  /** Returns `true` if the validation is an instance of `Success`, `false` otherwise */
  isSuccess(): this is Success<L, A> {
    return false
  }
}

export class Success<L, A> {
  readonly _tag: 'Success' = 'Success'
  readonly _A!: A
  readonly _L!: L
  readonly _URI!: URI
  constructor(readonly value: A) {}
  map<B>(f: (a: A) => B): Validation<L, B> {
    return new Success(f(this.value))
  }
  bimap<V, B>(f: (l: L) => V, g: (a: A) => B): Validation<V, B> {
    return new Success(g(this.value))
  }
  reduce<B>(b: B, f: (b: B, a: A) => B): B {
    return f(b, this.value)
  }
  fold<B>(failure: (l: L) => B, success: (a: A) => B): B {
    return success(this.value)
  }
  getOrElse(a: A): A {
    return this.value
  }
  getOrElseL(f: (l: L) => A): A {
    return this.value
  }
  mapFailure<M>(f: (l: L) => M): Validation<M, A> {
    return this as any
  }
  swap(): Validation<A, L> {
    return new Failure(this.value)
  }
  inspect(): string {
    return this.toString()
  }
  toString(): string {
    return `success(${toString(this.value)})`
  }
  isFailure(): this is Failure<L, A> {
    return false
  }
  isSuccess(): this is Success<L, A> {
    return true
  }
}

/**
 * @function
 * @since 1.0.0
 */
export const getSetoid = <L, A>(SL: Setoid<L>, SA: Setoid<A>): Setoid<Validation<L, A>> => {
  return {
    equals: (x, y) =>
      x.isFailure() ? y.isFailure() && SL.equals(x.value, y.value) : y.isSuccess() && SA.equals(x.value, y.value)
  }
}

const map = <L, A, B>(fa: Validation<L, A>, f: (a: A) => B): Validation<L, B> => {
  return fa.map(f)
}

const of = <L, A>(a: A): Validation<L, A> => {
  return new Success<L, A>(a)
}

/**
 * @example
 * import { Validation, success, failure, getApplicative } from 'fp-ts/lib/Validation'
 * import { getArraySemigroup } from 'fp-ts/lib/Semigroup'
 *
 * interface Person {
 *   name: string
 *   age: number
 * }
 *
 * const person = (name: string) => (age: number): Person => ({ name, age })
 *
 * const validateName = (name: string): Validation<string[], string> =>
 *   name.length === 0 ? failure(['invalid name']) : success(name)
 *
 * const validateAge = (age: number): Validation<string[], number> =>
 *   age > 0 && age % 1 === 0 ? success(age) : failure(['invalid age'])
 *
 * const A = getApplicative(getArraySemigroup<string>())
 *
 * const validatePerson = (name: string, age: number): Validation<string[], Person> =>
 *   A.ap(A.map(validateName(name), person), validateAge(age))
 *
 * console.log(validatePerson('Nicolas Bourbaki', 45)) // success({ "name": "Nicolas Bourbaki", "age": 45 })
 * console.log(validatePerson('Nicolas Bourbaki', -1)) // failure(["invalid age"])
 * console.log(validatePerson('', 0)) // failure(["invalid name", "invalid age"])
 *
 * @function
 *
 * @since 1.0.0
 */
export const getApplicative = <L>(S: Semigroup<L>): Applicative2C<URI, L> => {
  const ap = <A, B>(fab: Validation<L, (a: A) => B>, fa: Validation<L, A>): Validation<L, B> => {
    return fab.isFailure()
      ? fa.isFailure()
        ? failure(S.concat(fab.value, fa.value))
        : failure(fab.value)
      : fa.isFailure()
        ? failure(fa.value)
        : success(fab.value(fa.value))
  }

  return {
    URI,
    _L: phantom,
    map,
    of,
    ap
  }
}

/**
 * @function
 * @since 1.0.0
 */
export const getMonad = <L>(S: Semigroup<L>): Monad2C<URI, L> => {
  const chain = <A, B>(fa: Validation<L, A>, f: (a: A) => Validation<L, B>): Validation<L, B> => {
    return fa.isFailure() ? failure(fa.value) : f(fa.value)
  }

  return {
    ...getApplicative(S),
    chain
  }
}

const reduce = <L, A, B>(fa: Validation<L, A>, b: B, f: (b: B, a: A) => B): B => {
  return fa.reduce(b, f)
}

const traverse = <F>(F: Applicative<F>) => <L, A, B>(
  ta: Validation<L, A>,
  f: (a: A) => HKT<F, B>
): HKT<F, Validation<L, B>> => {
  return ta.isFailure() ? F.of(failure(ta.value)) : F.map(f(ta.value), of as (a: B) => Validation<L, B>)
}

const bimap = <L, V, A, B>(fla: Validation<L, A>, f: (u: L) => V, g: (a: A) => B): Validation<V, B> => {
  return fla.bimap(f, g)
}

/**
 * @function
 * @since 1.0.0
 */
export const failure = <L, A>(l: L): Validation<L, A> => {
  return new Failure(l)
}

/**
 * @function
 * @since 1.0.0
 * @alias of
 */
export const success = of

/**
 * @function
 * @since 1.0.0
 */
export const fromPredicate = <L, A>(predicate: Predicate<A>, f: (a: A) => L) => (a: A): Validation<L, A> => {
  return predicate(a) ? success(a) : failure(f(a))
}

/**
 * @function
 * @since 1.0.0
 */
export const fromEither = <L, A>(e: Either<L, A>): Validation<L, A> => {
  return e.isLeft() ? failure(e.value) : success(e.value)
}

/**
 * @function
 * @since 1.0.0
 */
export const getSemigroup = <L, A>(SL: Semigroup<L>, SA: Semigroup<A>): Semigroup<Validation<L, A>> => {
  const concat = (fx: Validation<L, A>, fy: Validation<L, A>): Validation<L, A> => {
    return fx.isFailure()
      ? fy.isFailure()
        ? failure(SL.concat(fx.value, fy.value))
        : failure(fx.value)
      : fy.isFailure()
        ? failure(fy.value)
        : success(SA.concat(fx.value, fy.value))
  }
  return {
    concat
  }
}

/**
 * @function
 * @since 1.0.0
 */
export const getMonoid = <L, A>(SL: Semigroup<L>, SA: Monoid<A>): Monoid<Validation<L, A>> => {
  return {
    ...getSemigroup(SL, SA),
    empty: success(SA.empty)
  }
}

/**
 * @function
 * @since 1.0.0
 */
export const getAlt = <L>(S: Semigroup<L>): Alt2C<URI, L> => {
  const alt = <A>(fx: Validation<L, A>, fy: Validation<L, A>): Validation<L, A> => {
    return fx.isFailure() ? (fy.isFailure() ? failure(S.concat(fx.value, fy.value)) : fy) : fx
  }
  return {
    URI,
    _L: phantom,
    map,
    alt
  }
}

/**
 * Returns `true` if the validation is an instance of `Failure`, `false` otherwise
 * @function
 * @since 1.0.0
 */
export const isFailure = <L, A>(fa: Validation<L, A>): fa is Failure<L, A> => {
  return fa.isFailure()
}

/**
 * Returns `true` if the validation is an instance of `Success`, `false` otherwise
 * @function
 * @since 1.0.0
 */
export const isSuccess = <L, A>(fa: Validation<L, A>): fa is Success<L, A> => {
  return fa.isSuccess()
}

/**
 * Builds {@link Compactable} instance for {@link Validation} given {@link Monoid} for the failure side
 * @function
 * @since 1.7.0
 */
export function getCompactable<L>(ML: Monoid<L>): Compactable2C<URI, L> {
  const compact = <A>(fa: Validation<L, Option<A>>): Validation<L, A> => {
    if (fa.isFailure()) {
      return fa as any
    }
    if (fa.value.isNone()) {
      return failure(ML.empty)
    }
    return success(fa.value.value)
  }

  const separate = <RL, RR, A>(fa: Validation<L, Either<RL, RR>>): Separated<Validation<L, RL>, Validation<L, RR>> => {
    if (fa.isFailure()) {
      return {
        left: fa as any,
        right: fa as any
      }
    }
    if (fa.value.isLeft()) {
      return {
        left: success(fa.value.value),
        right: failure(ML.empty)
      }
    }
    return {
      left: failure(ML.empty),
      right: success(fa.value.value)
    }
  }
  return {
    URI,
    _L: phantom,
    compact,
    separate
  }
}

/**
 * Builds {@link Filterable} instance for {@link Validation} gived {@link Monoid} for the left side
 * @function
 * @since 1.7.0
 */
export function getFilterable<L>(ML: Monoid<L>): Filterable2C<URI, L> {
  const C = getCompactable(ML)
  const partitionMap = <RL, RR, A>(
    fa: Validation<L, A>,
    f: (a: A) => Either<RL, RR>
  ): Separated<Validation<L, RL>, Validation<L, RR>> => {
    if (fa.isFailure()) {
      return {
        left: fa as any,
        right: fa as any
      }
    }
    const e = f(fa.value)
    if (e.isLeft()) {
      return {
        left: success(e.value),
        right: failure(ML.empty)
      }
    }
    return {
      left: failure(ML.empty),
      right: success(e.value)
    }
  }
  const partition = <A>(fa: Validation<L, A>, p: Predicate<A>): Separated<Validation<L, A>, Validation<L, A>> => {
    if (fa.isFailure()) {
      return {
        left: fa,
        right: fa
      }
    }
    if (p(fa.value)) {
      return {
        left: failure(ML.empty),
        right: success(fa.value)
      }
    }
    return {
      left: success(fa.value),
      right: failure(ML.empty)
    }
  }
  const filterMap = <A, B>(fa: Validation<L, A>, f: (a: A) => Option<B>): Validation<L, B> => {
    if (fa.isFailure()) {
      return fa as any
    }
    const optionB = f(fa.value)
    if (optionB.isSome()) {
      return success(optionB.value)
    }
    return failure(ML.empty)
  }
  const filter = <A>(fa: Validation<L, A>, p: Predicate<A>): Validation<L, A> => {
    if (fa.isFailure()) {
      return fa
    }
    const a = fa.value
    if (p(a)) {
      return success(a)
    }
    return failure(ML.empty)
  }
  return {
    ...C,
    map,
    partitionMap,
    filterMap,
    partition,
    filter
  }
}

/**
 * Builds {@link Witherable} instance for {@link Validation} given {@link Monoid} for the left side
 * @function
 * @since 1.7.0
 */
export function getWitherable<L>(ML: Monoid<L>): Witherable2C<URI, L> {
  const filterableValidation = getFilterable(ML)

  const wither = <F>(
    F: Applicative<F>
  ): (<A, B>(wa: Validation<L, A>, f: (a: A) => HKT<F, Option<B>>) => HKT<F, Validation<L, B>>) => {
    const traverseF = traverse(F)
    return (wa, f) => F.map(traverseF(wa, f), filterableValidation.compact)
  }

  const wilt = <F>(
    F: Applicative<F>
  ): (<RL, RR, A>(
    wa: Validation<L, A>,
    f: (a: A) => HKT<F, Either<RL, RR>>
  ) => HKT<F, Separated<Validation<L, RL>, Validation<L, RR>>>) => {
    const traverseF = traverse(F)
    return (wa, f) => F.map(traverseF(wa, f), filterableValidation.separate)
  }

  return {
    ...filterableValidation,
    traverse,
    reduce,
    wither,
    wilt
  }
}

/**
 * @instance
 * @since 1.0.0
 */
export const validation: Functor2<URI> & Bifunctor2<URI> & Foldable2<URI> & Traversable2<URI> = {
  URI,
  map,
  bimap,
  reduce,
  traverse
}
