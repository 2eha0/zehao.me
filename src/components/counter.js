import React, { useCallback, useEffect, useRef, useState } from "react"
import AV from 'leancloud-storage'

const isBrowser = typeof window !== 'undefined'
const isDev = process.env.NODE_ENV === 'development'

if (isBrowser) {
  AV.init({
    appId: "SD2MtRQPiozqEpuyAHsQGV9Y-MdYXbMMI",
    appKey: "nMo64zE0YMwKbf8KmcVtP0ti",
    serverURL: "https://sd2mtrqp.api.lncldglobal.com"
  })
}

export const usePageVisitedCount = ({ path, name, readonly }) => {
  const refs = useRef({ record: null, incremented: false })
  const [ data, setData ] = useState(null)

  useEffect(() => {
    if (!isBrowser) {
      return null
    }
    const query = new AV.Query('Counter')
    const Counter = AV.Object.extend('Counter')
    query.equalTo('path', path)

    query.find()
      .then(records => {
        if (records.length === 0) {
          const counter = new Counter()
          counter.set('path', path)
          counter.set('name', name)
          counter.set('count', 0)
          counter.save()
          refs.current.record = counter
          return 1
        }

        const record = records[0]
        refs.current.record = record
        return record.get('count') + 1
      })
      .catch((err) => {
        if (err.code === 101) { // 表没创建
          const counter = new Counter()
          counter.set('path', path)
          counter.set('name', name)
          counter.set('count', 0)
          counter.save()
          refs.current.record = counter
          return 1
        }
      })
      .then(setData)
  }, [path, name])

  const increment = useCallback(() => {
    if (!refs.current.record || refs.current.incremented) {
      return
    }

    refs.current.incremented = true
    refs.current.record.increment('count')
    refs.current.record.save()
  }, [])

  useEffect(() => {
    if (!isBrowser || readonly || isDev) {
      return
    }

    increment()
  }, [readonly, increment, data])

  return data
}

export const PostCount = ({ path, name, readonly }) => {
  const count = usePageVisitedCount({ path, name, readonly })
  if (count === null) {
    return null
  }
  return <small>📖 { count } 次阅读</small>
}
