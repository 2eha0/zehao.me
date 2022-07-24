---
title: Node.js Stream 学习笔记
date: '2022-07-24'
---
流（Stream）是 Node.js 中的主要特性之一，花了一个周末时间学习，大致上对流有了一些了解。

## 何为流？
举一个好理解的生活中的例子，在流媒体诞生之前，我们在网络上看视频需要先把视频完整下载之后才能进行播放，有了流媒体技术之后，我们无需等待视频完整下载，可以边下边播放，播放完了也下载完了。

在程序中，流是一个完整数据集合中的一部分，通过一部分一部分的处理数据，我们无需等待完整数据被加载到内存中。

Node.js 中提供了许多流对象，如 HTTP 的 `Request` 和 `Response`，`process.stdin` 和 `process.stdout` 等等。

Node.js 中的流具有 4 中类型：
* `Writeable`：可以写入数据的流。
* `Readable`：可以从中读取数据的流。
* `Duplex`：即可读又可写的流。
* `Transform`：转换可度流的数据，然后输出给可写流。

## 何时使用流？
* 处理太大无法被完整加载到内存中的数据。
* 节省等待数据加载的时间，得到部分数据后立即进行处理。

## 管道（pipe）
通过管道函数可以把多个流连接起来，让上游流的输出作为下游流的输入，如以下代码中的 `process.stdin` 是一个可读流，`process.stdout` 是一个可写流，通过 `pipe` 将两者连接起来就实现了类似 `echo` 命令的效果。
```js
process.stdin.pipe(process.stdout)
```
在生产环境中推荐使用 `pipeline` 代替 `pipe`，前者可以捕获流中的错误。
```js
const { pipeline, Transform } = require("stream");

pipeline(
  streamA,
  streamB,
  streamC,
  (err) => {
    if (err) {
      console.error("An error occured in pipeline.", err);
    } else {
      console.log("Pipeline execcution successful");
    }
  }
);
```

## 一些简单的示例
读取文件并打印：
```js
const fs = require('fs')
const filePath = process.argv[2]

fs.createReadStream(filePath).pipe(process.stdout)
```

输入文字转成大写后输出：
```js
const { Transform } = require('stream')

const upperCase = new Transform({
  transform(buffer, _e, cb) {
    cb(null, buffer.toString().toUpperCase())
  }
})

process.stdin
  .pipe(upperCase)
  .pipe(process.stdout)
```

POST 请求内容转大写后返回：
```js
const http = require('http')
const { Transform } = require('stream')

const upperCase = new Transform({
  transform(buffer, _e, cb) {
    cb(null, buffer.toString().toUpperCase())
  }
})

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') return res.end()

  req
    .pipe(upperCase)
    .pipe(res)
})

server.listen(process.argv[2])
```
## 具有现实意义的示例
实现一个自定义可读流，获取 Linus 在 Github 上的关注者列表（分页接口），并写入 `followers.txt`
```js
const Octokit = require('@octokit/core').Octokit
const { createWriteStream } = require('fs')
const { Readable, pipeline, Transform } = require('stream')

// https://github.com/octokit/core.js#readme
const octokit = new Octokit({
  auth: '<YourToken>'
})

class FollowersStream extends Readable {
  constructor(options) {
    super()
    this.username = options.username
    this.pageSize = options.pageSize || 10
    this.page = options.page || 1
    this.maxPage = options.maxPage || 10
  }

  async _read() {
    if (this.page > this.maxPage) {
      this.push(null) // 超过最大页数时结束流
      return
    }

    console.log(`获取第${this.page}页数据...`)
    const { data: followers } = await octokit.request(`GET /users/${this.username}/followers`, {
      username: this.username,
      per_page: this.pageSize,
      page: this.page,
    })
    this.page++

    if (!followers.length) {
      this.push(null) // 没有数据时结束流
      return
    }

    const chunk = Buffer.from(JSON.stringify(followers), 'utf-8') // stream 必须接收 Buffer 或 string 类型数据

    this.push(chunk)
  }
}

const followersStream = new FollowersStream({
  username: 'torvalds'
})
const transform = new Transform({
  transform(chunk, _e, callback) {
    console.log(`数据转换中...`)
    const followers = JSON.parse(chunk.toString('utf-8')) // chunk 表示当前页数据
    callback(null, followers.map(f => f.login).join('\n')) // 提取用户名
  }
})
const outputStream = createWriteStream('followers.txt')

pipeline(followersStream, transform, outputStream, (e) => {
  if (e) {
    console.log(e)
  } else {
    console.log('done')
  }
})

```
