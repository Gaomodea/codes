
// 文件：test.js（CommonJS 或 ESM 都一样）
console.log('sync');
setTimeout(() => console.log('timeout'), 0)
new Promise((resolve) => {
    console.log(2)
    process.nextTick(() => {
        
        console.log('nextTick2')
    });
    resolve()

    
    
}).then(() => {
    console.log('Promise')

    let i = 0
    while (i < 1000000000) {
        i++
    }

    process.nextTick(() => {
        
        console.log('nextTick32')
    });

}

);

process.nextTick(() => {
    
    console.log('nextTick')

    process.nextTick(() => {
    
        console.log('nextTick4')

        setTimeout(() => {
            console.log('timier----')
            Promise.resolve().then(() => console.log('end promise'))
            process.nextTick(() => console.log('bbb2'))
            setImmediate(() => console.log('setImmediate ----'))
            setTimeout(() => {
                console.log('timer 3----')

                setTimeout(() => console.log('timer 4--------'))
                
                setImmediate(() => console.log('setImmediate'))
                Promise.resolve().then(() => console.log('end promise2'))
                process.nextTick(() => console.log('bbb22'))
            }, 15)
            setTimeout(() => {
                console.log('timer 2----')
                
                Promise.resolve().then(() => console.log('end promise22'))
                process.nextTick(() => console.log('bbb222'))
            }, 15)
            loop()
        })

        process.nextTick(() => console.log('bbb'))
    });
});


// setImmediate(() => {
//     console.log('setImmediate')
//     setTimeout(() => console.log('setTimeout'))
//     setImmediate(() => console.log('setImmediate2'))
//     loop()
//     Promise.resolve().then(() => console.log('end promise2'))
//     process.nextTick(() => console.log('bbb22'))
// })
// setImmediate(() => console.log('setImmediate out'))

function loop () {
    let i = 0
    while (i < 5000000000) {
        i++
    }
}

// 1. 后加的宏任务会添加到下一轮循环中
// 2. 每执行一个回调，就会间隙的执行微任务
// 3. 宏任务执行完，并且微任务也执行完，执行setImmediate，后加的setImmediate也会在下一次循环中执行
// 4. 同步代码块执行完后，先执行Promise再执行nextTick，事件循环中，先执行nextTick，再执行Promise