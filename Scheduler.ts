
// 任务调度器
// 将同步流转换为异步流

import { Observable, operate, operate2, Subscriber, Subscription, SubscriptionLike, TearndownLogic } from "./Observer";

// 调度器
export interface SchedulerLike {
    schedule(work: ((this: SchedulerLike) => void) | null, delay?: number): Subscription;
}

// parentSubscription, work, delay, repeat, scheduler
export function excuteSchdule (
    parentSubscription: Subscription,
    scheduler: SchedulerLike,
    work: () => void,
    delay: number = 0,
    repeat: boolean = false
): Subscription | void {

    let subscription = scheduler.schedule(function () {
        work()

        if (repeat) {
            parentSubscription.add((subscription = this.schedule(null, delay)))
        } else {
            subscription.unsubscribe()
        }
        
    }, delay)

    parentSubscription.add(subscription)

    return subscription
}

// 是一个操作符
export function observeOn<T> (scheduler: SchedulerLike, delay: number = 0) {
    return operate2((source: Observable<T>, subscriber: Subscriber<T>) => {
        return source.subscribe({
            next: function (value: T): void {
                excuteSchdule(
                    subscriber,
                    scheduler,
                    () => subscriber.next(value),
                    delay
                )
            },
            complete: function (): void {
                excuteSchdule(
                    subscriber,
                    scheduler,
                    () => subscriber.complete(),
                    delay
                )
            },
            error: function (error: Error): void {
                excuteSchdule(
                    subscriber,
                    scheduler,
                    () => subscriber.error(error),
                    delay
                )
            }
        })
    })
}

export function subscribeOn<T> (scheduler: SchedulerLike, delay: number = 0) {
    // return function <T> (source: Observable<T>, subscriber: Subscriber<T>): TearndownLogic {
    //     subscriber.add(scheduler.schedule(function (this: SchedulerLike) {
    //         source.subscribe(subscriber)
    //     }, delay))
    // }
    return operate((source: Observable<T>, subscriber: Subscriber<T>) => {
        subscriber.add(scheduler.schedule(() => source.subscribe(subscriber), delay))
    })
}