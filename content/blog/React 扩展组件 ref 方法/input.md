---
title: React 扩展组件 ref 方法
date: '2022-06-12'
---

## 问题
比如有这样一个场景，我们需要实现一个输入框，并提供一个获取焦点并选中全文的方法供外部使用。
``` jsx
const ref = useRef()

useEffect(() => {
  ref.current.focusAndSelect() // <- 如何实现这个方法？
}, [])

return <FancyInput ref={ ref }>
```

## 解决方案
用 useImperativeHandle 包装原始 input ref
``` jsx
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef() // <- 获取原始 input ref

  useImperativeHandle(ref, () => { // <- 使用 useImperativeHandle 实现增强的 ref
    return () => {
      const input = inputRef.current
      input.focusAndSelect = () => { // <- 添加一个新的方法
        inputRef.current.focus()
        inputRef.current.select()
      }
      return input // <- 返回包装后的 input ref
    }
  }, [])

  return <input ref={ inputRef } { ...props } />
})
```

## DEMO
<iframe src="https://codesandbox.io/embed/jovial-ptolemy-79fzqx?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="jovial-ptolemy-79fzqx"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
