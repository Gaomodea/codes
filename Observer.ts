// export interface Operator<T, R> {
//   call(subscriber: Subscriber<R>, source: any): TeardownLogic;
// }

// lift<R>(operator?: Operator<T, R>): Observable<R> {
//     const observable = new Observable<R>();
//     observable.source = this;
//     observable.operator = operator;
//     return observable;
//   }

// operator.call(subscriber, this.source)

// pipe(...operations: OperatorFunction<any, any>[]): Observable<any> {
//     return pipeFromArray(operations)(this);
//   }


export interface Observer<T> {
  next(value: T): void

  complete(): void

  error(error: Error): void
}

export interface Unsubscribable {
  unsubscribe(): void
}

export interface SubscriptionLike extends Unsubscribable {
  readonly closed: boolean
  unsubscribe(): void
}


export class Subscription implements SubscriptionLike {
  closed: boolean = false

  unsubscribe(): void {
  }

  add (tearndown: TearndownLogic): void {

  }
}

export type TearndownLogic = Subscription | (() => void) | void


export interface Subscribable<T> {
  subscribe(observer: Observer<T>): Subscription
}

export interface Operator<T, R> {
  call(subscriber: Subscriber<R>, source: Observable<T>): TearndownLogic
}

export interface OperatorFunction<T, R> {
  (source: Observable<T>): Observable<R>
}

export class Observable<T> implements Subscribable<T> {
  public source: Observable<any> | undefined
  public operator: Operator<any, T> | undefined

  constructor (subscribe: ((this: Observable<T>, subscriber: Subscriber<T>) => TearndownLogic) | void) {
    if (subscribe) {
      this._subscribe = subscribe
    }
  }

  subscribe(observer: Observer<T>): Subscription {
    const subscriber = new Subscriber(observer)
    const { operator, source } = this
    subscriber.add(
      operator 
        ? operator.call(subscriber, source!)
        : this._subscribe(subscriber)
    )
    return subscriber
  }

  protected _subscribe(subscriber: Subscriber<T>): TearndownLogic {
    return this.source?._subscribe(subscriber)
  }

  lift<R>(operator?: Operator<T, R>): Observable<R> {
    const observable = new Observable<R>()
    observable.source = this
    observable.operator = operator
    return observable
  }

  pipe(): Observable<T>
  pipe<A>(
    op1: OperatorFunction<T, A>
  ): Observable<A>
  pipe<A, B>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
  ): Observable<B>
  pipe<A, B, C>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
  ): Observable<C>
  pipe(...operators: ((source: Observable<any>) => Observable<any>)[]): Observable<any> {
    if (operators.length == 0) {
      return this
    }

    if (operators.length == 1) {
      return operators[0](this)
    }

    return operators.reduce((prev, operator) => operator(prev), this as any)
  }
}

export class Subscriber<T> extends Subscription implements Observer<T> {
  constructor (private destination: Observer<T>) {
    super()
  }

  next(value: T): void {
    this._next(value)
  }
  complete(): void {
    this._complete()
  }

  error(error: Error): void {
    this._error(error)
  }

  protected _next(value: T): void {
    this.destination.next(value)
  }

  protected _complete(): void {
    try {
      this.destination.complete()
    } finally {
      this.unsubscribe()
    }
  }

  protected _error(error: Error): void {
    try {
      this.destination.error(error)
    } finally {
      this.unsubscribe()
    }
  }

}

const observable = new Observable<string>(subscriber => {
  subscriber.next("hello world")
})

export const operate = <T, R>(init: (source: Observable<T>, subscriber: Subscriber<R>) => TearndownLogic) => {
  return (source: Observable<T>) => {
    return source.lift<R>(function (this: Subscriber<R>, source: Observable<T>) {
      try {
        return init(source, this)
      } catch (e) {
        this.error(e as unknown as Error)
      }
    })
  }
}

export const operate2 = <T, R>(init: (source: Observable<T>, subscriber: Subscriber<R>) => TearndownLogic) => {
  return (source: Observable<T>) => {
    const observable = new Observable<R>(subscriber => {
      return init(source, subscriber)
    })
    return observable
  }
}

export const take = <T>(num: number) => {
  return operate2<T, T>((source, subscriber) => {
    let index = 0
    const subscription = source.subscribe({
      next: function (value: T): void {
        if (index < num) {
          subscriber.next(value)
          if (index == num) {
            subscriber.complete()
          }
        }
      },
      complete: function (): void {
        subscriber.complete()
        subscription.unsubscribe()
      },
      error: function (error: Error): void {
        subscriber.error(error)
        subscription.unsubscribe()
      }
    })
    // 父 subscriber 子 subscription
    // 父断开：子也断开
    // 子断开：从父中移除子

    // 1. 订阅者取消订阅：父断开、子也断开
    // 2. 子中报错：子断开、父触发error回调，父自动断开
    subscriber.add(subscription)
  })
}

const subscription = observable
  .lift<string>(function (this: Subscriber<string>, source: Observable<string>) {
    const subscriber = this
    const subscription = source.subscribe({
      next: function (value: string): void {
        subscriber.next(value)
      },
      complete: function (): void {
        subscriber.complete()
      },
      error: function (error: Error): void {
        subscriber.error(error)
      }
    })
    
    subscriber.add(subscription)
  })
  .pipe(
    operate2((source, subscriber: Subscriber<number>) => {
      return source.subscribe({
        next: function (value: string): void {
          // subscriber.next(value.length)
          setTimeout(() => {
            subscriber.next(value.length)
          }, 3000)
        },
        complete: function (): void {
          subscriber.complete()
        },
        error: function (error: Error): void {
          subscriber.error(error)
        }
      })
    }),
    (source) => {
      const observable =  new Observable<string>()
      observable.source = source
      return observable
    },
    take(3)
  )
  // .subscribe({
  //   next: function (value: string[]): void {
  //   },
  //   complete: function (): void {
  //   },
  //   error: function (error: Error): void {
  //   }
  // })

// subscription.unsubscribe()

